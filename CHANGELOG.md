# 更新日志

本文件记录每一次推送到仓库的实质变更。**2026-09-21 之前的历史见 `git log`**（那时还没建这个文件）。

格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，日期为本地时间。

---

## 2026-09-21 · 第 11 档模板 + 跨后端能力

这次更新的主线是**把第七期的源码风格抽象成可复用模板**，顺带清掉几笔积累的技术债。

### 新增

**T11 · 单文件 HTML + GSAP 档（`templates/T11-单文件HTML-GSAP.md`）**

第一档**不走 Remotion** 的模板。来源是第七期《数模国赛避坑指南》的已交付真源
（185.5s / 5565 帧 / 30fps / 11 场景 / 配音 178.8s）。

它的工程形态是 **一个 `index.html` 装下全部场景 + GSAP 绝对秒时间线 + HyperFrames 合成契约**：

| 维度 | T1–T10（Remotion） | T11（HTML + GSAP） |
|---|---|---|
| 工程形态 | `src/remotion/*.tsx` + `node_modules` | **单个 `index.html`**，无构建 |
| 时间轴 | `timing.json` 帧驱动 | **GSAP 绝对秒**，秒数手填 |
| 口播稿 | `podcast.txt`（`[SECTION:name]`） | **`scripts/sN.txt`**，一场景一文件 |
| 配音 | edge-tts（云希 / 云健） | **Kokoro ONNX 离线**（云健，speed 1.08） |
| 渲染 | `npx remotion render` | `npx hyperframes render` |

文档含 10 节规格：色板 / 字体 / 字号 / 7 种版式 / 动效语法 / 数据层 / 配音管线 / 专属坑 / **与 Remotion 线的完整差异对照** / 已验证-未验证清单。

**`templates/code/html-gsap/` · 零依赖工程骨架（9 项）**

| 文件 | 作用 |
|---|---|
| `README.md` | 实例化 7 步 + 目录约定 + 命名规范 + 注释习惯 + 口播约定 + 已知违规 |
| `index.html` | 主合成骨架（3 个示例场景 + 音频块 + GSAP 时间线，带占位符） |
| `tts_models/gen_tts_html.py` | 分段合成脚本（路径 / 音色 / 语速参数化） |
| `tts_models/ett_edge.py` | edge-tts 备选管线（含 aiohttp 代理注入） |
| `scripts/s1.txt` | 口播分段模板 |
| `cover43.html` / `cover34.html` | 封面骨架（1200×900 / 1080×1440） |
| `voice_demo.html` | 音色试听页（8 个 Kokoro 中文音色） |
| `TIMELINE.md` / `发布文案.md` | 本档的交付文档模板 |

> ⚠️ 骨架**未跑过完整渲染**。首次使用前按 T11 文档第 9 节补齐三个门禁（lint 合规 / 数据同步校验 / 后处理两关）。

**流程图 9 · 两套渲染后端对照**

- 新增 `assets/04-html-gsap-backend.svg`（矢量）+ `docs/flowcharts.md` 第 9 节（Mermaid 源码 + 差异表 + S7–S12 变体表 + 三个已知缺口）

**补进仓库的 T4 组件源码**（此前只在技能主库里）

- `T4CreamPaperVideo.tsx` / `T4RepoTree.tsx` / `T4YearTable.tsx` / `T4plan.example.ts`

### 变更

**模板数 10 → 11**，README / README.en.md / templates/README.md 的表格、决策树、速查矩阵、仓库结构全部同步。

**`assets/03-template-decision-tree.svg` 重画**：原来只画到 T1–T6（标题还写着「6 套模板」），
现补上 T7–T11，并加了「时长反向选档」与「一句话记忆」两行。画布 980×620 → 980×794。

**`docs/flowcharts.md` 三处补全**

- 图 3 决策树补 T7–T11 分支 + 时长校验表补全
- 图 6 交付物汇聚：交付包那列的 `封面16x9.png` 修正为 `封面4比3.png`
- 图 8 风格 DNA：补 T7–T11 血统，并说明 T11 连后端都换了

### 修复

**封面命名自相矛盾（累积修正，本次一并推上）**

交付包里的封面文件名原先写成 `封面16x9.png`，但尺寸栏明明写着 1200×900（4:3）。
照着做会**误出一张 1920×1080 的 16:9 封面**——华为杯模板期就踩了这个坑。

修正范围：`templates/T1-深空学术-信息密度.md` / `templates/T6-封面与竖版适配.md` /
`references/delivery.md` / `docs/flowcharts.md`。**封面只出 4:3 与 3:4 两种，不出 16:9。**

**`_gen_tts.py` 的换行符修复回灌（反向同步）**

仓库里的 `templates/code/_gen_tts.py` 比技能主库新——它带 `newline="\n"`：

```python
with open(os.path.join(BASE, "timing.json"), "w", encoding="utf-8", newline="\n") as f:
```

不加这个参数，Python 在 Windows 上用 text 模式写文件会把 `\n` 转成 `\r\n`（见 gotchas 第 21 条），
而 `\r\n` 会让「抽 ```mermaid 块」这类基于 `\n` 的正则静默失配。**本次已把修复回灌技能主库三处**，
并把技能里那份 CRLF 的 `videos/demo/timing.json` 归一为 LF。

**`references/gotchas.md` 编号断层**

条目编号从 21 直接跳到 47（缺 22–46），现重排为连续的 0–27。仓库内无任何交叉引用指向 47–52，改动无副作用。

### 已知问题

- T11 真源**未过 HyperFrames `lint`**：用了 `repeat: -1`（禁无限重复）和正文 `<br>`（禁）。
  骨架里已改成有限次数 + 拆 block，但骨架本身还没跑过一次完整渲染。
- T11 **没有数据同步门禁**（Remotion 线有 `_check_sync.py`）。段数 = 场景数 = `<audio>` 数 = GSAP 段数，四处必须相等，需自写校验。
- T11 真源 `TIMELINE.md` 里**没有后处理两关的记录**，接入 S12 时需补做并回填实测值。
- T11 真源**没有竖版正片**；发布文案缺「章节时间戳」和「置顶评论」（S13 门禁要求，模板里已加占位）。

### 校验

```
mermaid 块   20 / 20 通过（新增 1）
手写 SVG     4 张，全部光栅化后目检通过
换行符       全部文本文件为 LF
```

---

## 2026-09-20 · T7–T10 端到端跑通

- T7–T10 四套样式**真配 TTS 音频 + 真渲染 + 真过后处理两关**，成品全部达标 `yuv420p(tv, bt709)`
- 附 36 秒端到端样片 `assets/sample/样片-T7纸感笔记-36秒.mp4`
- 每套补齐**完整视频组件**（`*Video.tsx`），从「单页演示」升级到「能直接出片」
- 新增 `tools/check-eol.mjs`（换行符检查）
- 技能描述补触发词，模板数 6 → 10

更早的变更见 `git log`。
