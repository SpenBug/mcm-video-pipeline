# templates/code · 可运行样式组件

T7–T10 四套新样式的 **Remotion 组件源码**。每个文件是一个完整的 `React.FC`，不依赖任何外部数据文件。

---

## 文件

| 文件 | 样式 | 预览 |
|---|---|---|
| `T7PaperNote.tsx` | 纸感笔记 | `../../assets/preview/T7-纸感笔记.png` |
| `T8Dashboard.tsx` | 数据仪表盘 | `../../assets/preview/T8-数据仪表盘.png` |
| `T9Magazine.tsx` | 杂志排版 | `../../assets/preview/T9-杂志排版.png` |
| `T10BlackGold.tsx` | 黑金权威 | `../../assets/preview/T10-黑金权威.png` |

---

## 怎么跑起来

1. 把 `.tsx` 拷进工程的 `src/remotion/`
2. 在 `Root.tsx` 注册：

```tsx
import { T7PaperNote } from "./T7PaperNote";

<Composition
  id="T7PaperNote"
  component={T7PaperNote}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

3. 渲染静帧看效果：

```bash
npx remotion still src/remotion/index.ts T7PaperNote out/T7.png --frame=120
```

⚠️ `still` 的参数顺序是 **入口 → 组合 ID → 输出路径**。写反了会报 `Could not find composition with ID out/T7.png`。

4. 出预览图（缩小到 1280 宽，方便放进 README）：

```bash
npx remotion still src/remotion/index.ts T7PaperNote out/T7.png --frame=120 --scale=0.667
```

---

## 动画落定在第几帧

四个组件都设计成 **frame 120 时动画全部结束**，所以：

- 抽帧目检 → `--frame=120`
- 看进场效果 → `--frame=20` / `--frame=60`
- 做视频时组件可复用，但要把 `durationInFrames` 和场景时长对齐

各元素的起始帧写在组件顶部的 `fadeUp(frame, start)` / `interpolate(frame, [start, ...])` 里，改节奏改这些数字。

---

## 四个组件是「单版式演示」，不是完整视频组件

它们展示的是一套风格的**一个页面**长什么样。要用到实际一期，需要改造成：

```
读 timing.json → 按当前帧判断落在哪个场景 → 取该场景的配置 → 渲染对应版式
```

参考真源工程的 `EpisodeVideo.tsx`（在 `风格规范/template/` 或任一已交付期的 `项目源码/` 里）。

---

## 改样式前必读

**`references/gotchas.md` 第 19 / 20 条**：

1. `AbsoluteFill` 自带 `width: 100%` / `height: 100%` → 设了 `left` 必须给 `width`，设了 `top` 必须给 `height`，否则溢出画布
2. `AbsoluteFill` + `flexDirection: row` + `alignItems: center` → 内容被拉到画布垂直中点（要配 `top: N, height: M` 限高）

这两条在 T7–T10 的首轮渲染里，**4 张图踩了 3 张**。都是代码看着完全正常、渲染出来才发现的那种。

---

## 已知未验证项

| 项 | 状态 |
|---|---|
| 编译 | ✅ 四套全通过 |
| 静帧渲染 frame 120 | ✅ 四套全通过，目检无溢出 |
| 中间帧动画 | ⚠️ 未逐帧检查 |
| 完整视频 | ❌ 未跑过 |
| 时长实测 | ❌ 无 |
| 竖版适配 | ❌ 无 |
| 字体回退（T7 楷体 / T8 等宽） | ⚠️ 仅在本机验证 |
