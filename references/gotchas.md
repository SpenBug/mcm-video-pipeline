# 环境前置与已知坑（报错时先读这份）

**这份文件是流水线里唯一会「越跑越准」的部分**——每次踩新坑就往里加一条，并写清楚是真源哪一期踩的。

---

## 0. 环境前置（每次开工先确认，5 秒）

```powershell
# ① Python 必须用 3.12 系统版 + 显式挂用户站点（edge-tts 装在这里）
$env:PYTHONPATH = "C:\Users\92182\AppData\Roaming\Python\Python312\site-packages"
$py = "C:\Program Files\Python312\python.exe"
& $py -c "import edge_tts, imageio_ffmpeg; print('edge_tts OK')"

# ② 系统 ffmpeg（后处理两关用，Remotion 自带的那个不行）
ffmpeg -version          # 实测 9.0.1-full_build-www.gyan.dev

# ③ Node / Remotion
node -v ; npm -v         # 实测 v22.22.2 / 10.9.7
```

| 工具 | 位置 | 备注 |
|---|---|---|
| Python | `C:\Program Files\Python312\python.exe` | **不能用 `python`**——PATH 里第一个是 managed 3.13.12，那里没装 edge-tts |
| edge-tts | `C:\Users\92182\AppData\Roaming\Python\Python312\site-packages` (7.2.8) | 用户的 Python312 **没把用户站点加进 `sys.path`**，必须手动设 `PYTHONPATH` |
| ffmpeg（系统） | WinGet 装的 9.0.1 | 后处理两关、`-i` 探测、精确 LUFS 复测 |
| ffmpeg（Remotion 自带） | `node_modules\@remotion\compositor-win32-x64-msvc\ffmpeg.exe` | `_gen_tts.py` 优先用这个；但**能力受限**，见坑 9 / 10 |
| Remotion | 4.0.517，React 18.3.1 | `--gl=angle` 走独显（RTX 3050 Laptop 已验证） |

> ⚠️ **不要试图用 `python _gen_tts.py`。** 在本机这会解析到 managed 3.13.12 并直接 `ModuleNotFoundError: No module named 'edge_tts'`。必须按上面三行来。

---

## 1. `interpolate` 不加 clamp / 不封顶 → 动画越界

**症状**：清单 / 图例条目一多，末尾元素永远不动；场景边界画出动画外。

**根因**：固定步进累加不封顶。第 11 期 CHECKLIST 的 `segStart` 越界事故就是这个。

**修法（三条铁律）**：
```ts
// ① 所有 interpolate 必须带 clamp
{extrapolateLeft:"clamp", extrapolateRight:"clamp"}
// ② 起点必须封顶 0.9
const st = 0.06 + i * 0.10;
interpolate(p, [st, Math.min(st + 0.14, 0.9)], [0, 1], CLAMP)
// ③ 场景进度用归一化 p，不用绝对时间
p = clamp((sec - start_sec) / duration_sec, 0, 1)
```

---

## 2. TTS 读破数字和英文缩写

**症状**：`4.3%` 读成「四、三、百分号」；`2026` 读成「两千零二十六」；`ARIMA` 读成怪音。

**修法**：
- 数字全部改中文读法（对照表见 `script-and-compliance.md`）
- 英文缩写先跑 3 秒样本听：`MD5` → 「M D 五」；`Robin` → 「罗宾边界」
- 写稿时就改干净，别指望后期修——改一个数字要重跑整条 TTS

---

## 3. 只加 rate 救时长

**症状**：文案不动只把 `RATE` 从 +20% 提到 +28% 甚至 +40%，声音挤到听不清。

**修法顺序（不能颠倒）**：
1. 先压稿约 7%
2. 再提 rate 到 +28%
3. 还不够就回 S4 砍场景

实测：第十二期初稿 +20% 实测 221s（目标 190s）→ 精简约 7% + rate 提到 +28% → 189.65s。
第十三期初稿 1410 字实测 217.80s → 压到约 1040 字 → 185.28s。

---

## 4. 忘做 loudnorm

**症状**：同一系列里音量水位跳来跳去。

**修法**：交付前必过第一关（见 SKILL.md S12）。第 12 期就漏了 —— 产物是 `yuvj420p` 且未做 loudnorm。

---

## 5. 产物是 `yuvj420p`，规格不干净

**症状**：B 站能播，但 `ffmpeg -i` 显示 `yuvj420p`，没有 bt709 标签。

**修法**：第二关重编码（见 SKILL.md S12）。验收标准：`yuv420p(tv, bt709, progressive)`。

---

## 6. 封面尺寸写错（文档与实物的老账）

**症状**：交付包 README 写的是 1600×900 / 1080×1920，实际一直是 **1200×900 / 1080×1440**。

**修法**：以实物为准，文档跟着实测值改。
- 4:3 = **1200×900**（B 站 / YouTube）
- 3:4 = **1080×1440**（小红书 / 抖音 / 快手）

---

## 7. `podcast.txt` 编码显示成乱码

**症状**：PowerShell `Get-Content` 看是乱码，以为文件坏了。

**真相**：控制台编码问题，不是文件坏了。文件必须是 **UTF-8**。

**修法**：用 Read 工具或直接 `open(encoding="utf-8")` 确认，别用 `Get-Content` 判断。

---

## 8. 规则类表述强于官方原文

**症状**：把「需要注意」写成「必须做」，或把往年统计口径当成硬性及格线。

**实例**：
- 特别期 t7「漏了直接取消评奖资格」——官方触发条件其实是「**故意隐瞒** AI 使用情况、**作出虚假声明**，或**未经必要人工审查与核实**的 AI 生成内容直接作为核心成果提交」
- 第十三期相似度 60% —— 是「2025 年通报的统计口径」，不是及格线

**修法**：规则类内容一律先对 `mcm_rules_extracted.txt` / 官方原文，再写进口播稿。见 `script-and-compliance.md` 第三节的口径分级。

---

## 9. Remotion 自带 ffmpeg 的 `-color_trc` / `-colorspace` 不生效

**症状**：加了 CLI 参数但 VUI 里没有颜色标签。

**修法**：VUI 只能靠 x264-params 写：
```
-x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709
```
⚠️ `range=limited` **不是 x264-params 的合法项**（会报错），范围用 `-color_range tv`。

---

## 10. Remotion 自带 ffmpeg 不支持 loudnorm 复测

**症状**：想跑 `loudnorm print_mode=summary` 或 `volumedetect` 看精确 LUFS，报 filter 不存在。

**真相**：Remotion 自带的是 filter 白名单构建。

**修法**：编码步照常应用 `loudnorm I=-14:TP=-1.5:LRA=11`；要精确复测（第 11 期实测 -14.29 LUFS 可作基准）就用**系统 ffmpeg**。

---

## 11. `-ar 48000` 必须写

**症状**：loudnorm 那一步不加 `-ar 48000`，Remotion 的 ffmpeg 会把 aac 推到 **96kHz**。

**修法**：后处理两关的每一步都显式写 `-ar 48000`。

---

## 12. edge-tts 新版默认不给词边界

**症状**：audio 正常，但 `WordBoundary` 事件 0 个 → 字幕失去实时刻。

**根因**：新版 edge-tts 默认 `boundary="SentenceBoundary"`。

**修法**：必须显式传参：
```python
comm = edge_tts.Communicate(text, VOICE, rate=RATE, boundary="WordBoundary")
```
第一次跑特别期B 就踩到，已修进模板。

---

## 13. `make_silence` 少乘位宽和声道数

**症状**：`GAP > 0` 时插的静音长度不对，时间轴整体漂移。

**修法**：`wave.writeframes` 收的是**字节数**，必须乘 `采样位宽 × 声道数`：
```python
w.writeframes(b"\x00" * int(fr * seconds) * sw * nch)   # sw=2, nch=1
```

---

## 14. 拼接后没做总长校验

**症状**：`timing.json` 的场景窗口和实际音频对不上，字幕整体偏移。

**修法**：`_gen_tts.py` 末尾的门禁——
```python
if abs(actual - expected) > 0.15:
    raise RuntimeError("拼接总长与预期不符，时间轴会错位")
```
顺带做**音频体检**（`RMS<0.20 / peak<0.99 / ZCR<6000 / 时长>0.5s`，最多重试 6 次）——edge-tts 是**间歇性**返回损坏数据的，不体检一次抖动就毁整条音轨。这套门禁应该回填到所有期。

---

## 15. 模板尚未渲染验证（历史注记，已过期）

> 2026-09-11 记：`风格规范\template\` 是照第十二期源码抽的，当时还没跑过渲染验证。
> **特别期 B 首验已通过**（编译 OK、10 场景中间帧无 overflow 警告）。像素级目检仍建议发布前人工过一遍缩略图。

---

## 16. GPU 加速参数

渲染 / still 命令加 **`--gl=angle`** 走 ANGLE 硬件后端（独显）。本机 NVIDIA RTX 3050 Laptop 已 3 帧冒烟验证。
无独显或报错 → 去掉该参数退回软件 `swangle`。
`--gl` 只对视频渲染有意义，封面 still 不带也行。

---

## 17. node_modules 重复安装的成本

每期工程复制一份会带几 GB 的 `node_modules`。
**做法**：新建期时用 junction 指向已装好的期（特别期A 就 junction 了第十二期），避免每次 `npm install` 3–5 分钟。

---

## 18. 竖版版式不适配

**症状**：竖版底部大片留白、左右分栏挤成一团、大数字撞边。

**修法**：见 `templates/T6-封面与竖版适配.md`。第十三期新增的 `redline` / `cards` 版式就是靠「正文区改垂直居中」解决的。

---

## 19. `AbsoluteFill` 自带 `width: 100%` / `height: 100%` → 设了 `left` 或 `top` 就溢出画布

**症状**：分栏布局的右栏整个跑到画布外被裁掉；设了 `top` 的面板被推到画布下方看不见。代码里看着完全正常。

**根因**：Remotion 的 `AbsoluteFill` 基础样式是

```js
{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
  width: "100%", height: "100%", display: "flex", flexDirection: "column", ...style }
```

`width` / `height` 都是**百分比**，不是 `auto`。所以：

```tsx
// ✗ 右栏从 x=950 开始，但宽度仍是 1920 → 溢出到 x=2870
<AbsoluteFill style={{ left: 950, padding: "150px 96px 140px 0" }}>

// ✗ 面板从 y=500 开始，但高度仍是 1080 → 溢出到 y=1580
<AbsoluteFill style={{ top: 500, padding: "0 84px" }}>
```

**修法**：**设了 `left` 必须同时给 `width`；设了 `top` 必须同时给 `height`。**

```tsx
<AbsoluteFill style={{ left: 950, width: 970, padding: "150px 96px 140px 0" }}>
<AbsoluteFill style={{ top: 500, height: 540, padding: "0 84px" }}>
```

（`top: 0, height: 150` 这种写法是对的——`top` 和 `height` 同时给了。）

**排查手法**：分栏或分区布局渲染出来「有一块内容不见了 / 被切掉」，第一反应就查这个。

---

## 20. `AbsoluteFill` + `flexDirection: row` + `alignItems: center` → 内容被垂直居中到画布中点

**症状**：页眉 / 顶栏跑到画布垂直正中（y≈540），压在正文上面，看着像层级错乱。

**根因**：`AbsoluteFill` 是全高容器（见第 19 条）。`flexDirection: row` 时交叉轴是垂直方向，`alignItems: center` 于是在**整块画布高度**里居中。

```tsx
// ✗ 内容会被拉到 y≈540
<AbsoluteFill style={{ padding: "52px 84px 0", flexDirection: "row", alignItems: "center" }}>

// ✓ 限高之后，center 只在 0~150 内居中
<AbsoluteFill style={{ top: 0, height: 150, padding: "0 84px", flexDirection: "row", alignItems: "center" }}>
```

**两种修法，看意图选**：

| 意图 | 写法 |
|---|---|
| 想要顶部对齐的顶栏 | `top: 0, height: N` + `alignItems: "center"`（条内垂直居中） |
| 想在**剩余空间**里垂直居中（如底部面板） | `top: N, height: M` + `alignItems: "center"`（`M` 是剩余高度） |

⚠️ 不要靠「去掉 `alignItems`」来修——那会让子元素 `stretch` 拉伸变形，顶栏里的小图标会被撑开。

**这两条（19 / 20）在 T7–T10 四套新样式的首轮渲染里，4 张图踩了 3 张**。属于 `AbsoluteFill` 的高频陷阱，写新样式时先按这两条自查一遍。
