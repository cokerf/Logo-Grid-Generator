import { createServer } from "vite";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
const out = "/tmp/logo-grid-tests";
await mkdir(out, { recursive: true });
let finish;
const result = new Promise((resolve) => (finish = resolve));
const server = await createServer({
  server: { host: "127.0.0.1", port: 5178, strictPort: true },
  plugins: [
    {
      name: "regression-harness",
      configureServer(s) {
        s.middlewares.use(async (req, res, next) => {
          if (req.url === "/__test-progress") {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            console.log(Buffer.concat(chunks).toString());
            res.end("ok");
            return;
          }
          if (req.url === "/__tests") {
            res.setHeader("Content-Type", "text/html");
            res.end(
              `<!doctype html><html><head><title>Logo generator regression tests</title></head><body><h1>Running regression tests…</h1><script>window.addEventListener('error',e=>fetch('/__test-results',{method:'POST',body:JSON.stringify([{name:'Browser module',passed:false,error:e.message}])}));window.addEventListener('unhandledrejection',e=>fetch('/__test-results',{method:'POST',body:JSON.stringify([{name:'Browser promise',passed:false,error:String(e.reason)}])}));</script><script type="module" src="/tests/browser.ts"></script></body></html>`,
            );
            return;
          }
          if (req.url === "/__test-results" || req.url === "/__test-video") {
            const chunks = [];
            for await (const chunk of req) chunks.push(chunk);
            const data = Buffer.concat(chunks);
            if (req.url === "/__test-video")
              await writeFile(`${out}/construction.mp4`, data);
            else finish(JSON.parse(data.toString()));
            res.end("ok");
            return;
          }
          next();
        });
      },
    },
  ],
});
await server.listen();
const chrome = spawn(
  process.env.CHROME_BIN || "chromium",
  [
    "--headless",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    `--user-data-dir=${out}/profile`,
    "http://127.0.0.1:5178/__tests",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let stderr = "";
chrome.stderr.on("data", (d) => {
  stderr += d;
  void writeFile(`${out}/browser.log`, stderr);
});
chrome.on("exit", (code) => {
  if (code)
    finish([
      {
        name: "Browser launch",
        passed: false,
        error: `Chrome exited with ${code}: ${stderr.slice(-1000)}`,
      },
    ]);
});
chrome.on("error", (error) =>
  finish([{ name: "Browser launch", passed: false, error: String(error) }]),
);
const timeout = setTimeout(
  () =>
    finish([
      {
        name: "Browser regression suite",
        passed: false,
        error: "Timed out after 120 seconds. " + stderr.slice(-1200),
      },
    ]),
  120000,
);
try {
  const results = await result;
  clearTimeout(timeout);
  for (const r of results)
    console.log(
      `${r.passed ? "PASS" : "FAIL"} ${r.name}${r.error ? " — " + r.error : ""}`,
    );
  await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
  if (results.some((r) => !r.passed)) process.exitCode = 1;
  else
    await new Promise((resolve, reject) => {
      const shot = spawn(
        process.env.CHROME_BIN || "chromium",
        [
          "--headless",
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          `--user-data-dir=${out}/screenshot-profile`,
          "--window-size=1440,1000",
          "--virtual-time-budget=3000",
          `--screenshot=${out}/preview.png`,
          "http://127.0.0.1:5178/",
        ],
        { stdio: "ignore" },
      );
      shot.on("error", reject);
      shot.on("exit", (code) =>
        code ? reject(new Error("Screenshot failed")) : resolve(),
      );
    });
} finally {
  chrome.kill("SIGTERM");
  await server.close();
}
