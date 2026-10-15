// Tiny proxy + static server. No dependencies (Node 18+).
// Why a proxy: Torob's API is not CORS-open, so the browser can't call it directly.
// Politeness: results cached 10 min, one upstream request at a time, >=1.5s between requests.
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8787;
const UPSTREAM = "https://api.torob.com/v4/base-product/search/";
const CACHE_MS = 10 * 60 * 1000;
const MIN_GAP_MS = 1500;
const cache = new Map();
let chain = Promise.resolve();
let lastCall = 0;

function fetchTorob(q) {
  const run = async () => {
    const wait = lastCall + MIN_GAP_MS - Date.now();
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastCall = Date.now();
    const url = `${UPSTREAM}?${new URLSearchParams({ page: "0", sort: "popularity", size: "24", query: q, q, source: "next_desktop" })}`;
    const res = await fetch(url, { headers: { "user-agent": "torob-demo-for-job-application (low volume, cached)" } });
    if (!res.ok) throw new Error("upstream " + res.status);
    const j = await res.json();
    return { count: j.count, results: j.results || [] };
  };
  const p = chain.then(run, run);
  chain = p.catch(() => {});
  return p;
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  if (u.pathname === "/api/search") {
    const q = (u.searchParams.get("q") || "").trim().slice(0, 80);
    if (!q) { res.writeHead(400); return res.end('{"error":"empty query"}'); }
    try {
      const hit = cache.get(q);
      let data;
      if (hit && Date.now() - hit.t < CACHE_MS) data = { ...hit.data, cached: true };
      else { data = await fetchTorob(q); cache.set(q, { t: Date.now(), data }); }
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      return res.end(JSON.stringify(data));
    } catch (e) {
      res.writeHead(502, { "content-type": "application/json" });
      return res.end(JSON.stringify({ error: String(e.message || e) }));
    }
  }
  const file = path.join(__dirname, "index.html");
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("http://127.0.0.1:" + PORT));
