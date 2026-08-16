const { chromium } = require(process.env.PW_PATH);
const fs = require("node:fs");

const ids = fs.readFileSync("/tmp/qa_ids.txt", "utf8").trim().split(/\s+/).reduce((a, kv) => {
  const [k, v] = kv.split("=");
  a[k] = v;
  return a;
}, {});

const BASE = "http://localhost:3000";
const OUT = "/workspace/lala/screenshots";
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  ["dashboard", "/"],
  ["projects", "/projects"],
  ["project-detail", `/projects/${ids.PID}`],
  ["videos", "/videos"],
  ["processing", `/processing?videoId=${ids.VIDID}`],
  ["candidates", `/candidates?videoId=${ids.VIDID}`],
  ["clips", "/clips"],
  ["editor", `/clips/${ids.CLIP}`],
  ["analytics", "/analytics"],
  ["settings", "/settings"],
];

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const [name, path] of pages) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    // Give client fetches + any video posters a moment to settle.
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
    console.log("captured", name);
  }
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
