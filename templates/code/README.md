# templates/code · 可运行样式组件

T7–T10 四套样式的 **Remotion 组件源码**。每套都有两个形态：**单页演示**（看风格长什么样）和 **完整视频组件**（读 `timing.json` 真能出片）。

---

## 目录

```
templates/code/
├─ src/remotion/
│  ├─ shared/                      场景引擎（四套共用）
│  │  ├─ types.ts                  TimingData / Section / Sentence 类型
│  │  ├─ scene.ts                  useScene() 按帧定位场景 + pickSentence()
│  │  └─ Subtitle.tsx              句级实时刻硬切字幕条
│  ├─ demoData.ts                  演示内容（对应 5 个场景）
│  ├─ T7PaperNote.tsx              单页演示
│  ├─ T7PaperNoteVideo.tsx         完整视频组件
│  ├─ T8Dashboard.tsx / T8DashboardVideo.tsx
│  ├─ T9Magazine.tsx / T9MagazineVideo.tsx
│  ├─ T10BlackGold.tsx / T10BlackGoldVideo.tsx
│  └─ Root.example.tsx             8 个 Composition 的注册示例
└─ videos/demo/timing.json         演示用时间轴（5 场景 / 32.75s / 982 帧）
```

---

## 两种形态的区别

| | 单页演示 `T7PaperNote.tsx` | 完整视频组件 `T7PaperNoteVideo.tsx` |
|---|---|---|
| 场景 | 写死一个页面 | 由 `timing.json` 驱动，按帧自动切换 |
| 内容 | 硬编码在组件里 | 从 `demoData.ts` 按 `section.name` 取 |
| 动画 | 基于绝对帧 | 基于**场景内局部帧** `lf = frame - section.start_frame` |
| 字幕 | 无 | `Subtitle` 组件，句级实时刻硬切 |
| 用途 | 目检风格 | 实际出片 |

**关键设计**：动画全部基于 `lf`（场景内局部帧）而不是绝对帧。这样改某个场景的时长，动画节奏不用跟着改。

---

## 场景引擎怎么用

```tsx
import timingData from "../../videos/demo/timing.json";
import { useScene } from "./shared/scene";
import { Subtitle } from "./shared/Subtitle";

const MyVideo: React.FC = () => {
  const { frame, sec, section, p } = useScene(timingData);
  const lf = frame - section.start_frame;        // 场景内局部帧
  const content = MY_DATA[section.name];         // 按场景名取内容

  return (
    <>
      {/* 你的版式 */}
      <Subtitle section={section} sec={sec} s={{ /* 样式 */ }} />
    </>
  );
};
```

`useScene` 返回：

| 字段 | 含义 |
|---|---|
| `frame` | 当前绝对帧 |
| `sec` | 当前绝对秒（`frame / fps`） |
| `idx` | 当前场景序号 |
| `section` | 当前场景对象（含 `sentences`） |
| `p` | **场景内归一化进度 0–1** |
| `total` | 场景总数 |

### 场景判定为什么不用严格区间

用的是「**起点已过的最后一个**」而不是 `start ≤ sec < start+dur`。
理由：段间可能有 GAP 静默（T2 是 0.35s、T7 是 0.30s），严格区间会在静默期掉到场景之间的空隙里；取「最后一个已开始的」更稳，旧场景会自然淡出。

### 字幕为什么是硬切

`Subtitle` 默认 `fadeFrames = 0`（硬切），这是 2026-09-10 特别期 B 起的系列做法——字幕与音频轨逐词对齐，加淡入反而显得延迟。

老 `timing.json` 没有 `sentences` 字段时 `pickSentence` 返回 `null`，`Subtitle` 渲染 `null`（不崩），调用方自己走「整段显示」兜底。

---

## 怎么跑起来

### 1. 拷进工程

```bash
cp -r templates/code/src/remotion/* <你的工程>/src/remotion/
cp templates/code/videos/demo/timing.json <你的工程>/videos/<你的ep名>/timing.json
```

⚠️ 路径要对：`timing.json` 在工程根的 `videos/<ep名>/` 下，组件里用 `../../videos/<ep名>/timing.json` 引用（`src/remotion/` 退两级到工程根）。

### 2. 注册 Composition

参考 `Root.example.tsx`：

```tsx
<Composition id="T7PaperNoteVideo" component={T7PaperNoteVideo}
  durationInFrames={timingData.total_frames} fps={30} width={1920} height={1080} />
```

`durationInFrames` 一定要从 `timing.json` 读，别写死——重跑配音后自动同步。

### 3. 渲染

```bash
npx remotion still  src/remotion/index.ts T7PaperNoteVideo out/f490.png --frame=490
npx remotion render src/remotion/index.ts T7PaperNoteVideo out/横版.mp4 --gl=angle
```

⚠️ `still` 的参数顺序是 **入口 → 组合 ID → 输出路径**。漏了组合 ID 会报 `Could not find composition with ID out/f490.png`（它把输出路径当成了组合 ID）。

### 4. 换期改哪里

| 文件 | 改什么 |
|---|---|
| `videos/<ep名>/timing.json` | 由 `_gen_tts.py` 生成，**不要手改** |
| `demoData.ts` | 各场景的内容。key 必须与 `podcast.txt` 的 `[SECTION:name]` 完全一致 |

---

## 演示数据（videos/demo/timing.json）

5 个场景，主题是「灵敏度分析三步」：

| 场景 | 起始 | 时长 | 帧窗口 |
|---|---|---|---|
| `hook` | 0.00s | 6.31s | 0 – 189 |
| `s1` | 6.73s | 6.31s | 202 – 391 |
| `s2` | 13.46s | 5.95s | 404 – 582 |
| `s3` | 19.83s | 7.38s | 595 – 816 |
| `outro` | 27.63s | 5.12s | 829 – 982 |

总长 32.75s / 982 帧 / 30fps。每场景 2–3 句，句级时刻齐全，可以验证字幕硬切。

抽帧验证用的就是这些帧号：`120 / 300 / 490 / 700 / 900`。

---

## 已验证 / 未验证

### 已通过

| 项 | 结果 |
|---|---|
| 编译 | ✅ 8 个 Composition 全部注册成功 |
| 场景切换 | ✅ T7 逐场景抽 5 帧（120/300/490/700/900），页号、栏目、标题、要点、批注全部正确切换 |
| 字幕实时刻 | ✅ frame 120 = 4.0s，正好落在 hook 的第 3 句窗口内 |
| 四套同场景对比 | ✅ 四套在 frame 490（s2）各渲一帧，见 `assets/preview/video/` |
| 中文渲染 | ✅ 无乱码、无缺字 |

### 修过的 bug（都是渲染出来才发现的）

| 问题 | 修法 |
|---|---|
| T8 趋势线画反了（值递增，线却下降） | y 轴映射 `H-(1-v)*(H-24)-12` 是反的，改成 `12+(1-v)*(H-24)` |
| T10 字幕压在第三条条款上 | 条款区 `padding-bottom` 120 → 176 |
| T9 首字下沉过大（92px vs 25px 正文） | 降到 72px |
| T7 字幕与页脚重叠 | 字幕 `bottom` 40 → 86 |

### 未验证

| 项 | 状态 |
|---|---|
| 中间帧动画 | ⚠️ 只验了落定态，**未逐帧检查** |
| 完整视频渲染 | ❌ 没跑过 `remotion render`（只出了静帧） |
| 配真实音频 | ❌ 演示 timing.json 是造的，没配 mp3/wav |
| 时长实测 | ❌ 无 |
| 竖版适配 | ❌ 无 |
| 字体回退 | ⚠️ 仅本机（T7 楷体 / T8 等宽数字） |

---

## 改样式前必读

**`references/gotchas.md` 第 19 / 20 条**：

1. `AbsoluteFill` 自带 `width: 100%` / `height: 100%` → 设了 `left` 必须给 `width`，设了 `top` 必须给 `height`，否则溢出画布
2. `AbsoluteFill` + `flexDirection: row` + `alignItems: center` → 内容被拉到画布垂直中点（要配 `top: N, height: M` 限高）

这两条在 T7–T10 的开发过程中，**4 张图踩了 3 张**。都是代码看着完全正常、渲染出来才发现的那种。
