// ===================== EHS 排行榜後端（Cloudflare Worker）=====================
// 這支 Worker 就是整個「迷你後端」，對外開兩個端點：
//   - POST /submit       寫入一筆成績（body 為 JSON：{ id, score, time, date }）
//   - GET  /leaderboard  回傳排序後的排行榜（JSON 陣列）
//
// 資料存在 Cloudflare KV，綁定名稱為 EHS（見 wrangler.toml）。
// 同一工號只保留「最高分」那筆；同分時較快者覆蓋。
//
// 部署步驟請見 ../CLOUDFLARE_WORKER_SETUP.md
// ============================================================================

const KV_KEY = 'leaderboard';

// CORS：允許前端（任意來源）跨域呼叫並讀到回應。
// 若要鎖定只允許自家網域，把 '*' 換成你的網址，例如 'https://your-site.pages.dev'。
const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' },
    });
}

// 依排行榜規則排序：分數高優先，分數相同比用時短。
function sortBoard(list) {
    return list.sort((a, b) => (b.score - a.score) || (a.time - b.time));
}

export default {
    async fetch(request, env) {
        // CORS 預檢
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: CORS });
        }

        const url = new URL(request.url);

        // ---------- 讀取排行榜 ----------
        if (request.method === 'GET' && url.pathname === '/leaderboard') {
            const raw = await env.EHS.get(KV_KEY);
            const list = raw ? JSON.parse(raw) : [];
            return json(sortBoard(list));
        }

        // ---------- 寫入成績 ----------
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

            const raw = await env.EHS.get(KV_KEY);
            const list = raw ? JSON.parse(raw) : [];

            const entry = { id, score, time, date };
            const i = list.findIndex(e => e.id === id);
            if (i === -1) {
                list.push(entry);                                   // 新工號
            } else if (score > list[i].score) {
                list[i] = entry;                                    // 同工號刷新更高分
            } else if (score === list[i].score && time < list[i].time) {
                list[i] = entry;                                    // 同分但更快
            }

            await env.EHS.put(KV_KEY, JSON.stringify(sortBoard(list)));
            return json({ ok: true });
        }

        return json({ error: 'not found' }, 404);
    },
};
