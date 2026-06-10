// ===================== EHS 排行榜後端（Cloudflare Worker + Durable Object）=====================
// 對外端點（與舊版相同，前端不需更動）：
//   - POST /submit       寫入一筆成績（JSON：{ id, score, time, date }）
//   - GET  /leaderboard  回傳排序後的排行榜（JSON 陣列）
//
// 為什麼用 Durable Object（DO）取代「Worker + 單一 KV key」：
//   舊版把整個排行榜存在同一個 KV key，採「讀整包 → 改 → 寫整包」，
//   多人同時交卷時會用各自手上的舊資料互相覆蓋 → 真實成績遺失（競態）。
//   DO 保證「每個 id 全域只有唯一實例、請求序列化處理」，加上儲存有 input gate 保護，
//   讀-改-寫不會交錯，從根本消除競態；DO 儲存亦為強一致性（不像 KV 為最終一致）。
//
// 作法：所有讀寫都導向「同一個」全域 DO 實例（idFromName('global')）。
// 同一工號只保留最高分；同分時較快者覆蓋。
//
// 部署步驟請見 ../CLOUDFLARE_WORKER_SETUP.md
// ================================================================================================

// CORS：允許前端跨域呼叫並讀到回應。
// 要鎖定只允許自家網域，把 '*' 換成你的站台網址，例如 'https://your-site.pages.dev'。
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
    });
}

// 排序規則：分數高優先，分數相同比用時短。
function sortBoard(list) {
    return list.sort((a, b) => (b.score - a.score) || (a.time - b.time));
}

// ---------- Durable Object：排行榜的唯一真實來源 ----------
export class Leaderboard {
    constructor(state) {
        // state.storage 是此 DO 的私有、強一致性儲存
        this.state = state;
    }

    async fetch(request) {
        const url = new URL(request.url);

        // 讀取排行榜
        if (request.method === 'GET' && url.pathname === '/leaderboard') {
            const list = (await this.state.storage.get('list')) || [];
            return json(sortBoard(list));
        }

        // 寫入成績
        if (request.method === 'POST' && url.pathname === '/submit') {
            let body;
            try {
                body = await request.json();
            } catch {
                return json({ error: 'invalid JSON' }, 400);
            }

            const id = String(body.id ?? '').trim();
            const score = Number(body.score);
            const time = Number(body.time);
            const date = String(body.date ?? '');

            if (!id) return json({ error: '缺工號 id' }, 400);
            if (!Number.isFinite(score) || !Number.isFinite(time)) {
                return json({ error: 'score / time 必須是數字' }, 400);
            }

            // 在 DO 內部讀-改-寫：請求序列化 + 儲存 input gate 保護 → 無競態、不掉資料
            const list = (await this.state.storage.get('list')) || [];
            const entry = { id, score, time, date };
            const i = list.findIndex(e => e.id === id);
            if (i === -1) {
                list.push(entry);                                   // 新工號
            } else if (score > list[i].score) {
                list[i] = entry;                                    // 同工號刷新更高分
            } else if (score === list[i].score && time < list[i].time) {
                list[i] = entry;                                    // 同分但更快
            }

            await this.state.storage.put('list', sortBoard(list));
            return json({ ok: true });
        }

        return json({ error: 'not found' }, 404);
    }
}

// ---------- 入口 Worker：處理 CORS，並把請求轉給唯一的全域 DO ----------
export default {
    async fetch(request, env) {
        // CORS 預檢
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS });
        }

        // 全部導向同一個 DO 實例 → 寫入因而序列化、無競態
        const stub = env.LEADERBOARD.get(env.LEADERBOARD.idFromName('global'));
        const res = await stub.fetch(request);

        // 補上 CORS 標頭後回傳給前端
        const headers = new Headers(res.headers);
        for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
        return new Response(res.body, { status: res.status, headers });
    },
};
