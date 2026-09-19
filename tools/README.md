# tools · 图表校验

三个脚本，用来在推送前确认 README / docs 里的图**真的能渲染出来**，以及文件没有混入 CRLF。

这个仓库有 19 个 Mermaid 代码块和 3 张手写 SVG，靠肉眼审是审不出问题的。这几个脚本各自覆盖一类事故。

---

## 为什么需要

### 事故一：Mermaid 节点标签里的裸尖括号

```mermaid
flowchart TD
    H{"音频体检<br/>RMS<0.20 / peak<0.99"}
```

`<0.20` 里的 `<` 会被 GitHub 当成 HTML 标签开始，**整块图渲染失败**，页面上只剩一段源码文本。
同类写法还有 `GAP>0`、`误差 < 0.15s`、`> 20%`。

修法：改成中文表述 —— 「低于」「大于」「小于」「超过」。

### 事故二：SVG 坐标算错 / 文字溢出

手写 SVG 时坐标靠算，容易框住文字、连线穿框、元素跑到画布外。
不实际光栅化出来看一遍，在 GitHub 上才发现就晚了。

### 事故三：文件被写成 CRLF，校验静默失配

**Python 在 Windows 上用 text 模式写文件会把 `\n` 转成 `\r\n`**：

```python
# ✗ 会把整个文件变成 CRLF
pathlib.Path("README.md").write_text(new_text, encoding="utf-8")
# ✓
pathlib.Path("README.md").write_text(new_text, encoding="utf-8", newline="\n")
```

为什么危险：抽 Mermaid 块的正则是 ` ```mermaid\n `，而 CRLF 文件里是 `` ```mermaid\r\n ``，
`\r` 卡在中间 → **整个文件的图块被静默跳过**，校验器不报错，只是少算了几块。

**症状**：Mermaid 通过数突然下降，且差值正好等于某个文件的图块数。

---

## 用法

三个脚本都需要 `mermaid`、`jsdom`、`@resvg/resvg-js` 三个依赖：

```bash
cd <工作目录>
npm install mermaid jsdom @resvg/resvg-js
```

### 0. 先查换行符（不需要依赖，建议第一个跑）

```bash
node tools/check-eol.mjs <仓库根目录>
```

输出 `换行符全部为 LF ✓` 或列出混入 CRLF 的文件及处数。有问题的文件会让第 1 步的校验静默失配。

### 1. 校验 Mermaid 语法

用 Mermaid 官方解析器逐块 `parse()`，语法错误会带出行号和原因。

```bash
NODE_PATH=<node_modules路径> node tools/validate-mermaid.mjs <仓库根目录>
```

输出：

```
  OK   README.md #1  (flowchart TD)
  OK   README.en.md #5  (flowchart LR)
  OK   docs/flowcharts.md #8  (flowchart LR)

mermaid 块总数: 19   通过: 19   失败: 0
```

退出码：全通过为 `0`，有失败为 `1`（可以直接挂到 CI 或 pre-push hook 上）。

扫描范围写死在脚本里的 `files` 数组：`README.md`、`README.en.md`、`docs/flowcharts.md`。加了新文档记得补进去。

### 2. 光栅化 SVG 以便目检

把 `assets/*.svg` 渲染成 PNG，宽度统一到 1400px，白底。渲染完用图片查看器打开 `_preview/` 逐个看。

```bash
NODE_PATH=<node_modules路径> node tools/raster-svg.mjs <仓库根目录> <输出目录>
```

输出：

```
.../_preview/01-pipeline-overview.png  1400x924  112725 bytes
.../_preview/02-gate-protocol.png      1400x1000  84465 bytes
.../_preview/03-template-decision-tree.png  1400x886  105904 bytes
```

`_preview/` 已在 `.gitignore` 里，不会被提交。

脚本默认用 `Microsoft YaHei` 渲染中文，`loadSystemFonts: true` 走系统字体。换到 Linux / macOS 要改 `defaultFontFamily`（比如 `Noto Sans CJK SC` / `PingFang SC`）。

---

## 实现上的三个坑

### ① jsdom 的 `navigator` 在 Node 22 上是只读的

```js
globalThis.navigator = dom.window.navigator;   // TypeError: Cannot set property navigator
```

Node 22 把 `navigator` 定义成了只有 getter 的属性。必须用 `Object.defineProperty`：

```js
const define = (k, v) => Object.defineProperty(globalThis, k, {
  value: v, writable: true, configurable: true,
});
define("navigator", dom.window.navigator);
```

### ② 必须在设置完 DOM 全局变量之后再动态 `import` mermaid

mermaid 是 ESM，且在模块求值阶段就会去摸 DOM。所以要用 `await import("mermaid")` 而不是顶层 `import`，且放在 jsdom 初始化之后。

### ③ Python 写文件的 CRLF 转换

见上文「事故三」。

---

## 建议的推送前流程

```bash
node tools/check-eol.mjs .               # 换行符全部 LF 才算过
node tools/validate-mermaid.mjs .        # 19/19 通过才算过
node tools/raster-svg.mjs . _preview     # 打开 _preview/ 目检一遍
git add -A && git commit -m "docs: ..."
git push
```
