// 检查仓库里的文本文件是否混入了 CRLF 换行符
//
// 为什么需要：Python 在 Windows 上用 text 模式写文件会把 \n 转成 \r\n，
// 这会让「抽 ```mermaid 块」这类基于 \n 的正则静默失配——脚本不报错，
// 只是少算了几个图块，很难发现。
//
// 运行：node check-eol.mjs <仓库根目录>

import fs from "node:fs";
import path from "node:path";

const root = process.argv[2] || ".";
const EXTS = new Set([
  ".md", ".ts", ".tsx", ".js", ".mjs", ".cjs", ".json",
  ".svg", ".yml", ".yaml", ".txt", ".css", ".html",
]);
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "out", "build", ".next", "coverage"]);

const bad = [];
let scanned = 0;

const walk = (dir) => {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTS.has(path.extname(e.name).toLowerCase())) continue;
    scanned++;
    // 用 latin1 读，避免 UTF-8 解码影响字节计数
    const text = fs.readFileSync(full).toString("latin1");
    const count = text.split("\r\n").length - 1;
    if (count > 0) bad.push([path.relative(root, full), count]);
  }
};

walk(root);

console.log(`扫描 ${scanned} 个文本文件`);
if (bad.length === 0) {
  console.log("换行符全部为 LF ✓");
  process.exit(0);
}

console.log(`发现 ${bad.length} 个文件混入 CRLF ✗`);
for (const [file, count] of bad) console.log(`  ${file}  (${count} 处)`);
console.log("");
console.log("修正（在仓库根执行）：");
console.log('  python -c "import pathlib,sys; [p.write_bytes(p.read_bytes().replace(b\'\\r\\n\', b\'\\n\')) for p in pathlib.Path(\'.\').rglob(\'*\') if p.is_file() and \'.git\' not in p.parts]"');
console.log("根治：仓库根放 .gitattributes，写 `* text=auto eol=lf`");
process.exit(1);
