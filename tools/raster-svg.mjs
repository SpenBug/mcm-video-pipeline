// 把仓库 assets/ 下的 SVG 光栅化成 PNG，便于目检渲染效果
// 运行：NODE_PATH=<workspace>/node_modules node raster-svg.mjs <repo根目录> <输出目录>
import fs from "node:fs";
import path from "node:path";
import { Resvg } from "@resvg/resvg-js";

const repo = process.argv[2];
const outDir = process.argv[3];
if (!repo || !outDir) {
  console.error("用法: node raster-svg.mjs <repo根目录> <输出目录>");
  process.exit(2);
}
fs.mkdirSync(outDir, { recursive: true });

const svgDir = path.join(repo, "assets");
const files = fs.readdirSync(svgDir).filter((f) => f.endsWith(".svg")).sort();

for (const f of files) {
  const svg = fs.readFileSync(path.join(svgDir, f), "utf8");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1400 },
    background: "#FFFFFF",
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Microsoft YaHei",
      sansSerifFamily: "Microsoft YaHei",
    },
  });
  const rendered = resvg.render();
  const png = rendered.asPng();
  const out = path.join(outDir, f.replace(/\.svg$/, ".png"));
  fs.writeFileSync(out, png);
  console.log(`${out}  ${rendered.width}x${rendered.height}  ${png.length} bytes`);
}
