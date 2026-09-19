// 用 Mermaid 官方解析器校验仓库里所有 mermaid 代码块的语法
// 运行：NODE_PATH=<workspace>/node_modules node validate-mermaid.mjs <repo根目录>
import fs from "node:fs";
import path from "node:path";
import { JSDOM } from "jsdom";

const repo = process.argv[2];
if (!repo) {
  console.error("用法: node validate-mermaid.mjs <repo根目录>");
  process.exit(2);
}

const dom = new JSDOM("<!DOCTYPE html><body></body>", { pretendToBeVisual: true });
const g = globalThis;
const define = (k, v) => Object.defineProperty(g, k, { value: v, writable: true, configurable: true });
define("window", dom.window);
define("document", dom.window.document);
define("navigator", dom.window.navigator);
define("HTMLElement", dom.window.HTMLElement);
define("SVGElement", dom.window.SVGElement);
define("Element", dom.window.Element);
define("Node", dom.window.Node);
define("DOMParser", dom.window.DOMParser);
define("NodeFilter", dom.window.NodeFilter);
define("trustedTypes", undefined);

const mermaid = (await import("mermaid")).default;
mermaid.initialize({ startOnLoad: false, securityLevel: "loose" });

const files = ["README.md", "README.en.md", "docs/flowcharts.md"];
let total = 0;
let ok = 0;
const failures = [];

for (const rel of files) {
  const abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) continue;
  const text = fs.readFileSync(abs, "utf8");
  const blocks = [...text.matchAll(/```mermaid\n([\s\S]*?)```/g)].map((m) => m[1]);
  for (let i = 0; i < blocks.length; i++) {
    total++;
    const body = blocks[i];
    const firstLine = body.split("\n").find((l) => l.trim()) || "";
    try {
      await mermaid.parse(body);
      ok++;
      console.log(`  OK   ${rel} #${i + 1}  (${firstLine.trim()})`);
    } catch (e) {
      const msg = String(e && e.message ? e.message : e).split("\n").slice(0, 4).join(" | ");
      failures.push({ rel, index: i + 1, firstLine: firstLine.trim(), msg });
      console.log(`  FAIL ${rel} #${i + 1}  (${firstLine.trim()})`);
      console.log(`       ${msg}`);
    }
  }
}

console.log("");
console.log(`mermaid 块总数: ${total}   通过: ${ok}   失败: ${failures.length}`);
process.exit(failures.length === 0 ? 0 : 1);
