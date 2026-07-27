// ===================== EHS 排行榜後端（Cloudflare Worker + Durable Object）=====================
// 安全模型：計分改由後端負責，前端只送「使用者選了什麼」，永遠拿不到正確答案。
//
// 對外端點：
//   - POST /start        開始測驗：回傳一組「簽章 token」，內含伺服器端的開始時間戳
//                        （前端無法竄改）。body: { id }
//   - POST /submit       交卷：body { token, answers:{ "1":選項index, ... } }
//                        後端用 env.ANSWER_KEY 計分、用 (現在時間 - token 內開始時間) 算用時，
//                        一律忽略前端自己算的分數與時間。回傳 { ok, score, time, rank, answerKey }
//   - GET  /leaderboard  回傳排序後的排行榜（JSON 陣列）
//
// 防作弊設計（對應本次三項需求）：
//   1) 答案表只在後端（env.ANSWER_KEY），前端翻 source 也看不到 → 偽造分數無效。
//   2) 用時由伺服器算（token 內夾帶伺服器開始時間，HMAC 簽章防竄改）→ 前端送 time 無效。
//   3) 一工號只計分一次（first-write-wins）+ 用時下限檢查 → 擋「反覆送答案試出正解再刷分」。
//
// 為什麼答案表放 env 而非寫在這支檔案：
//   本專案原始碼在公開 GitHub repo（GitHub Pages），若把答案寫進 worker.js，
//   等於答案還是公開。故 ANSWER_KEY 與簽章密鑰 GAME_SECRET 一律用 Cloudflare Worker
//   secret 設定（wrangler secret put …），不進 git。設定步驟見 ../CLOUDFLARE_WORKER_SETUP.md
//
// 為什麼用 Durable Object（DO）：
//   排行榜「讀-改-寫」需序列化以免多人同時交卷互相覆蓋（競態）。DO 保證單一實例、
//   請求序列化、強一致性儲存，從根本消除競態。
// ================================================================================================

// 計分參數（可依題庫調整）
const POINTS_PER_QUESTION = 10;   // 每題分數
const MIN_SECONDS = 3;            // 用時下限：短於此視為偽造/重放，拒收
const MAX_SECONDS = 3 * 60 * 60;  // 用時上限：token 逾時（3 小時）視為失效

// CORS：允許前端跨域呼叫並讀到回應。
// 要鎖定只允許自家網域，把 '*' 換成你的站台網址，例如 'https://<user>.github.io'。
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

// 工號格式：英數，1~32 字（可依實際工號規則再收緊，如 /^EMP\d{4}$/）
function isValidId(id) {
    return typeof id === 'string' && /^[A-Za-z0-9_-]{1,32}$/.test(id);
}

// ---------- 簽章 token：把「開始時間」交給前端保管但不可竄改 ----------
// token = base64url(payload).base64url(HMAC-SHA256(payload))
// payload = { id, iat }（iat = 伺服器發 token 當下毫秒時間戳）

const enc = new TextEncoder();

function b64urlEncode(bytes) {
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecodeToBytes(str) {
    const pad = str.length % 4 ? '='.repeat(4 - (str.length % 4)) : '';
    const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function importHmacKey(secret) {
    return crypto.subtle.importKey(
        'raw', enc.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
    );
}

async function signToken(payloadObj, secret) {
    const payload = b64urlEncode(enc.encode(JSON.stringify(payloadObj)));
    const key = await importHmacKey(secret);
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
    return `${payload}.${b64urlEncode(new Uint8Array(sig))}`;
}

async function verifyToken(token, secret) {
    if (typeof token !== 'string' || !token.includes('.')) return null;
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const key = await importHmacKey(secret);
    let ok;
    try {
        ok = await crypto.subtle.verify('HMAC', key, b64urlDecodeToBytes(sig), enc.encode(payload));
    } catch {
        return null;
    }
    if (!ok) return null;
    try {
        return JSON.parse(new TextDecoder().decode(b64urlDecodeToBytes(payload)));
    } catch {
        return null;
    }
}

// 解析 env.ANSWER_KEY（JSON 字串），如 {"1":2,"2":2,...}
function parseAnswerKey(env) {
    if (!env.ANSWER_KEY) return null;
    try {
        const obj = JSON.parse(env.ANSWER_KEY);
        return (obj && typeof obj === 'object') ? obj : null;
    } catch {
        return null;
    }
}

// ---------- Durable Object：排行榜的唯一真實來源（僅負責儲存 + 一工號一次）----------
export class Leaderboard {
    constructor(state) {
        this.state = state; // state.storage：此 DO 私有、強一致性儲存
    }

    async fetch(request) {
        const url = new URL(request.url);

        // 讀取排行榜
        if (request.method === 'GET' && url.pathname === '/leaderboard') {
            const list = (await this.state.storage.get('list')) || [];
            return json(sortBoard(list));
        }

        // 內部端點：儲存一筆已由入口 Worker 計分完成的成績
        if (request.method === 'POST' && url.pathname === '/_store') {
            const entry = await request.json(); // { id, score, time, date }
            const list = (await this.state.storage.get('list')) || [];

            // 一工號只計分一次：已存在則拒絕，並回傳既有成績供前端顯示
            const existing = list.find(e => e.id === entry.id);
            if (existing) {
                const rank = sortBoard(list.slice()).findIndex(e => e.id === entry.id) + 1;
                return json({ error: 'already_submitted', entry: existing, rank }, 409);
            }

            list.push(entry);
            sortBoard(list);
            await this.state.storage.put('list', list);
            const rank = list.findIndex(e => e.id === entry.id) + 1;
            return json({ ok: true, rank });
        }

        return json({ error: 'not found' }, 404);
    }
}

// ---------- 入口 Worker：/start 發 token、/submit 驗證計分、/leaderboard 轉發 ----------
export default {
    async fetch(request, env) {
        if (request.method === 'OPTIONS') {
            return withCors(new Response(null, { status: 204 }));
        }

        const url = new URL(request.url);
        const stub = env.LEADERBOARD.get(env.LEADERBOARD.idFromName('global'));

        try {
            // ---- 開始測驗：發簽章 token（夾帶伺服器開始時間）----
            if (request.method === 'POST' && url.pathname === '/start') {
                if (!env.GAME_SECRET) return withCors(json({ error: 'server_misconfig: GAME_SECRET 未設定' }, 500));

                let body;
                try { body = await request.json(); } catch { return withCors(json({ error: 'invalid JSON' }, 400)); }
                const id = String(body.id ?? '').trim();
                if (!isValidId(id)) return withCors(json({ error: '工號格式不正確' }, 400));

                const token = await signToken({ id, iat: Date.now() }, env.GAME_SECRET);
                return withCors(json({ ok: true, token }));
            }

            // ---- 交卷：驗 token、伺服器算 time、後端計分 ----
            if (request.method === 'POST' && url.pathname === '/submit') {
                if (!env.GAME_SECRET) return withCors(json({ error: 'server_misconfig: GAME_SECRET 未設定' }, 500));
                const answerKey = parseAnswerKey(env);
                if (!answerKey) return withCors(json({ error: 'server_misconfig: ANSWER_KEY 未設定或格式錯誤' }, 500));

                let body;
                try { body = await request.json(); } catch { return withCors(json({ error: 'invalid JSON' }, 400)); }

                const claims = await verifyToken(body.token, env.GAME_SECRET);
                if (!claims || !isValidId(claims.id) || !Number.isFinite(claims.iat)) {
                    return withCors(json({ error: 'token 無效，請重新開始測驗' }, 401));
                }

                // 用時由伺服器算，前端送什麼都不看
                const time = (Date.now() - claims.iat) / 1000;
                if (time < MIN_SECONDS) return withCors(json({ error: '作答時間異常（過短）' }, 400));
                if (time > MAX_SECONDS) return withCors(json({ error: '測驗逾時，請重新開始' }, 400));

                // 後端計分：只信 answerKey 對 answers 的比對結果
                const answers = (body.answers && typeof body.answers === 'object') ? body.answers : {};
                let score = 0;
                for (const [qid, correct] of Object.entries(answerKey)) {
                    if (Number(answers[qid]) === Number(correct)) score += POINTS_PER_QUESTION;
                }

                const entry = {
                    id: claims.id,
                    score,
                    time: Math.round(time * 100) / 100, // 保留兩位小數
                    date: new Date().toISOString(),
                };

                // 寫入 DO（一工號一次）
                const storeRes = await stub.fetch(new Request('https://do/_store', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(entry),
                }));
                const stored = await storeRes.json();

                if (storeRes.status === 409) {
                    // 此工號先前已完成：回既有成績 + 答案（供錯題回顧），但不覆蓋
                    return withCors(json({
                        ok: false,
                        error: 'already_submitted',
                        score: stored.entry?.score,
                        time: stored.entry?.time,
                        rank: stored.rank,
                        answerKey,
                    }, 409));
                }

                return withCors(json({ ok: true, score, time: entry.time, rank: stored.rank, answerKey }));
            }

            // ---- 讀排行榜 ----
            if (request.method === 'GET' && url.pathname === '/leaderboard') {
                const res = await stub.fetch(request);
                return withCors(res);
            }

            return withCors(json({ error: 'not found' }, 404));
        } catch (err) {
            return withCors(json({ error: 'server error', detail: String(err) }, 500));
        }
    },
};

// 補上 CORS 標頭
function withCors(res) {
    const headers = new Headers(res.headers);
    for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
    return new Response(res.body, { status: res.status, headers });
}
