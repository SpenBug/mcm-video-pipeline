# 流程图全集

本文件集中放这套流程的**全部流程图**，含可直接复制的 Mermaid 源码。
需要单张矢量图（放进 PPT / 视频）时用 `assets/` 下的 SVG。

| # | 图 | 用途 | 对应步骤 |
|---|---|---|---|
| 1 | [总体流程](#1-总体流程) | 一眼看清 13 步与阶段划分 | S1–S13 |
| 2 | [确认门协议](#2-确认门协议) | 每一步的准入与门禁逻辑 | 全流程 |
| 3 | [模板选型决策树](#3-模板选型决策树) | 选哪一档模板 | S6 |
| 4 | [配音与时间轴管线](#4-配音与时间轴管线) | `_gen_tts.py` 内部流程 | S9 |
| 5 | [后处理两关](#5-后处理两关) | 交付前的编码链 | S12 |
| 6 | [交付物汇聚](#6-交付物汇聚) | 产物怎么归集 | S13 |
| 7 | [时长超标回退路径](#7-时长超标回退路径) | 超时了怎么救 | S5 / S9 |
| 8 | [风格 DNA 继承关系](#8-风格-dna-继承关系) | 6 档模板的血缘 | S6 |

---

## 1. 总体流程

```mermaid
flowchart TD
    subgraph PA["阶段 A · 立项与内容 · S1–S6"]
        direction TB
        S1["S1 立项卡"]
        S2["S2 素材清点"]
        S3["S3 事实核对与合规"]
        S4["S4 视频思路蓝图"]
        S5["S5 口播稿"]
        S6["S6 模板选型"]
    end

    subgraph PB["阶段 B · 工程与配音 · S7–S9"]
        direction TB
        S7["S7 工程初始化"]
        S8["S8 内容配置"]
        S9["S9 配音 + 混音 + 时间轴"]
    end

    subgraph PC["阶段 C · 渲染与交付 · S10–S13"]
        direction TB
        S10["S10 目检与抽帧"]
        S11["S11 渲染"]
        S12["S12 后处理两关"]
        S13["S13 交付与文档"]
    end

    S1 --> S2 --> S3 --> S4 --> S5 --> S6
    S6 --> S7 --> S8 --> S9
    S9 --> S10 --> S11 --> S12 --> S13

    S9 -. "时长超标 · 回 S5 压稿" .-> S5
    S10 -. "动画越界 / 字幕溢出 · 回 S8" .-> S8
    S12 -. "规格不达标 · 重编码" .-> S11
    S13 -. "经验回灌" .-> KB["gotchas.md<br/>templates/T*.md"]
```

**读法**：实线是正向推进，虚线是回退路径。
注意所有回退都指向**上游的内容步骤**（S5 / S8），而不是重渲——这是「蓝图前移」设计的直接结果。

**阶段产出对照**

| 阶段 | 步骤 | 核心产物 | 完成标志 |
|---|---|---|---|
| A | S1–S6 | `视频思路.md`、`podcast.txt`、选定模板 | 蓝图与稿件用户已确认 |
| B | S7–S9 | 可跑工程、`episode_data.ts`、`timing.json`、`mixed_audio.wav` | `total_dur` 落在目标区间 |
| C | S10–S13 | probe 帧、横版 mp4、归一化成品、4 份文档 | `ffmpeg -i` 显示 `yuv420p(tv, bt709)` |

---

## 2. 确认门协议

```mermaid
flowchart TD
    Start(["进入第 N 步"]) --> ReadOnly{"这一步是只读操作?"}
    ReadOnly -->|"是 · 探测 / 抽帧 / 列表"| Exec["直接执行"]
    ReadOnly -->|"否 · 写文件 / 渲染 / 覆盖产物"| Card["输出确认卡"]

    Card --> Wait{"用户答复?"}
    Wait -->|"未答复"| Hold["停下<br/>不动任何文件"]
    Wait -->|"已确认"| Exec

    Exec --> Gate{"本步硬门禁通过?"}
    Gate -->|"否"| Rollback["回退到上游步骤"]
    Gate -->|"是"| Next(["进入第 N+1 步"])

    Rollback --> Card
```

**四个分支的含义**

| 分支 | 条件 | 行为 |
|---|---|---|
| 只读 → 直接执行 | 读文件、`ffmpeg -i`、列 Composition、抽帧到临时目录 | 不打断用户 |
| 写操作 → 先出确认卡 | 写文件、渲染、覆盖产物 | 必须等答复 |
| 未答复 | — | 停手，不动任何文件 |
| 硬门禁不过 | 时长超标 / 体检不过 / 规格不符 | 回退到上游，**不回退到重渲** |

### 确认卡模板

```
【S<N> · <步骤名>】
要做什么：<一句话，含会动到哪些文件 / 目录>
需要你给：<① ② ③ 编号列出必填输入；没有必填就写「无」>
我的建议：<默认方案 + 一句理由，让用户回「1」就能过>
可选分叉：<A / B / C，只在真的有选择时写>
```

---

## 3. 模板选型决策树

```mermaid
flowchart TD
    Q0{"内容能不能用<br/>编号 + 一句话 表达?"}
    Q0 -->|"能 · 且条数 ≤ 10"| T2["T2 大字清单档<br/>110–120s · 单版式 · 三档语气"]
    Q0 -->|"不能"| Q1{"主体是什么?"}

    Q1 -->|"一道真题完整求解"| T3["T3 真题长拆解档<br/>240–320s · 只出横版 · 必有自拟观点"]
    Q1 -->|"论文图 / 题目原图"| T4["T4 奶油论文图解档<br/>220–260s · 浅色 · 云健 +8%"]
    Q1 -->|"赛事资讯"| T5["T5 赛事资讯快报档<br/>180–200s · 10 版式"]
    Q1 -->|"方法对比 / 对错辨析<br/>评分细则 / 自查清单"| T1["T1 深空学术信息密度档<br/>185–195s · 7 版式"]

    T1 --> T6["T6 封面与竖版适配<br/>叠加档 · 任意档都要过"]
    T2 --> T6
    T3 --> T6
    T4 --> T6
    T5 --> T6
```

**一句话记忆**：能不能用「编号 + 一句话」表达？**能 → T2，不能 → T1。** 真题 → T3，图讲解 → T4，资讯 → T5。

**时长校验**（用户先给了时长时反向选档）

| 用户要的时长 | 选档 |
|---|---|
| < 2 分钟 | T2（其他档撑不到那么短） |
| 2–3 分钟 | T5，或 T1 压到 185s |
| 3–4 分钟 | T4 |
| 4–6 分钟 | T3 |

---

## 4. 配音与时间轴管线

```mermaid
flowchart TD
    TXT["podcast.txt<br/>SECTION 分块"] --> Parse["解析 SECTION 块"]
    Parse --> Loop{"逐段循环"}

    Loop --> TTS["edge-tts 合成<br/>boundary=WordBoundary<br/>流式抓词边界"]
    TTS --> Wav["ffmpeg 转 mono<br/>44100 16bit"]
    Wav --> Health{"音频体检<br/>RMS 低于 0.20 · peak 低于 0.99<br/>ZCR 低于 6000 · 时长大于 0.5s"}
    Health -->|"不合格 · 重试 ≤ 6 次"| TTS
    Health -->|"合格"| Rec["记录词边界 + 时长"]
    Rec --> Loop

    Loop -->|"全部完成"| Concat["拼接人声轨<br/>GAP 等于 0 直接字节拼接<br/>GAP 大于 0 用 ffmpeg concat 插静音"]
    Concat --> Len{"总长校验<br/>误差小于 0.15s"}
    Len -->|"超标"| Fail["raise RuntimeError<br/>时间轴会错位"]
    Len -->|"通过"| Write["回写 timing.json<br/>podcast_audio.srt<br/>phonemes.json"]
    Write --> Mix["混音 BGM volume=0.10<br/>amix duration=first"]
    Mix --> Out["mixed_audio.wav<br/>视频里播这个"]
```

**三个关键点**

1. **体检门禁是必须的** —— edge-tts 会**间歇性**返回损坏数据（RMS 飙到 0.4+、削波、过零率翻 5 倍），不体检一次抖动就毁整条音轨。
2. **必须显式要词边界** —— `Communicate(..., boundary="WordBoundary")`。新版默认 `SentenceBoundary`，不传就拿到 0 个词事件。
3. **总长校验兜底** —— 拼接后实测总长与预期差 > 0.15s 直接 `raise`，不让错位的时间轴流到渲染。

**GAP 参数按档位不同**

| 档 | GAP | 理由 |
|---|---|---|
| T1 / T3 / T5 | 0 | 场景即配音，场景边界就是语音边界 |
| T4 | 0.18s | 逐句拼接，句间留气口增强自然感 |
| T2 | 0.35s | 段间静默让旧场景自然淡出 |

---

## 5. 后处理两关

```mermaid
flowchart LR
    Raw["Remotion 原始渲染<br/>yuvj420p · 未做 loudnorm"] --> P1["第一关<br/>loudnorm I=-14:TP=-1.5:LRA=11<br/>-ar 48000 · -c:v copy"]
    P1 --> Tmp["_1.mp4"]
    Tmp --> P2["第二关<br/>libx264 + pix_fmt yuv420p<br/>-x264-params bt709 三参数<br/>-color_range tv"]
    P2 --> Final["成品<br/>yuv420p tv, bt709"]
    Final --> Check{"ffmpeg -i 探测"}
    Check -->|"不符"| P2
    Check -->|"符合"| Done["可交付"]
```

**为什么必须两步**

| 关 | 解决什么 | 不做的后果 |
|---|---|---|
| 第一关 | 音量归一到系列标准 -14 LUFS | 同系列音量跳变（第十二期就漏了） |
| 第二关 | 像素格式转 `yuv420p` + 写 bt709 色彩标签 | 产物是 `yuvj420p`，B 站能播但规格不干净 |

**两个易错点**

- `-ar 48000` 必须写，否则 Remotion 的 ffmpeg 会把 aac 推到 **96kHz**。
- 色彩标签只能靠 `-x264-params` 写，CLI 的 `-color_trc` / `-colorspace` 在 Remotion ffmpeg 上**不生效**；`range=limited` 不是合法 x264 参数，范围用 `-color_range tv`。

---

## 6. 交付物汇聚

```mermaid
flowchart TD
    Eng["项目源码 / mcm-video-temp"] --> O1["成品 / 横版_1920x1080.mp4"]
    Eng --> O2["成品 / 封面_4比3.png · 1200×900"]
    Eng --> O3["成品 / 封面_3比4.png · 1080×1440"]
    Eng --> Doc["4 份文档"]

    Doc --> D1["视频思路.md<br/>选题 承接 场景大纲"]
    Doc --> D2["时间线核对表.md<br/>每场景窗口 + 帧数"]
    Doc --> D3["publish_info.md<br/>如实填实测值"]
    Doc --> D4["发布文案.md<br/>标题 正文 章节 标签"]

    O1 --> Pkg["数模AI冲国奖_视频交付包<br/>第N期_主题"]
    O2 --> Pkg
    O3 --> Pkg
    D4 --> Pkg
```

**工程内产物名 → 交付包名对照**（别搞混）

| 工程内 | 成品目录 | 交付包内 |
|---|---|---|
| `landscape_with_bgm.mp4` | `横版_1920x1080.mp4` | `landscape_with_bgm.mp4` |
| `portrait_with_bgm.mp4` | `竖版_1080x1920.mp4` | （不进交付包） |
| `cover43.png` | `封面_4比3.png` | `封面16x9.png` |
| `cover34.png` | `封面_3比4.png` | `封面3比4.png` |

---

## 7. 时长超标回退路径

这是整条流程里最常走的回退分支，单独画一张。

```mermaid
flowchart TD
    Run["跑 _gen_tts.py"] --> Check{"total_dur 在目标区间?"}
    Check -->|"是"| OK["进 S10 目检"]
    Check -->|"否 · 超出"| Q1{"超出多少?"}

    Q1 -->|"≤ 10%"| Cut["压稿约 7%<br/>砍重复承接句 / 合并同类清单项"]
    Q1 -->|"10%–20%"| CutThenRate["先压稿 7%<br/>再把 RATE +20% → +28%"]
    Q1 -->|"超过 20%"| Back["回 S4 砍场景<br/>别硬撑"]

    Cut --> ReRun["重跑 _gen_tts.py"]
    CutThenRate --> ReRun
    Back --> ReRun
    ReRun --> Check
```

**实测参考**

| 期 | 初稿 | 目标 | 处理 | 落地 |
|---|---|---|---|---|
| 第十二期 | +20% 实测 221s | 190s | 精简约 7% + rate 提到 +28% | 189.65s |
| 第十三期 | 1410 字实测 217.8s | 185–195s | 压到约 1040 字 | 185.28s |

> **别只加 rate。** 文案不动只提语速，会挤到听不清；而且 rate 越高，TTS 读破中文数字的概率越大。

---

## 8. 风格 DNA 继承关系

```mermaid
flowchart LR
    DNA["深空学术 × 玻璃拟态<br/>theme.ts 设计令牌"] --> T1["T1 信息密度档<br/>6 + number 版式<br/>8 色 accent"]
    DNA --> T2["T2 大字清单档<br/>1 版式 NumberView<br/>3 档语气 呼吸光晕"]
    DNA --> T5["T5 资讯快报档<br/>10 版式<br/>countdown/ladder/gantt/alert"]

    T1 --> T3["T3 真题长拆解档<br/>沿用 T1 版式序<br/>+ 数值口径分级"]
    T1 --> T6["T6 封面与竖版适配<br/>封面公式 / 竖版 8 项清单"]

    Cream["奶油极简<br/>#FDFBF4 浅色"] --> T4["T4 奶油论文图解档<br/>1 版式 左文右图<br/>云健 +8%"]
```

**读法**

- **T1 是主干**：T3、T5、T6 都从它派生。要改配色 / 字体 / 动效语法，改 `theme.ts` 一处，T1/T3/T5 一起变。
- **T2 是主干的分支**：共用深空底色，但把「8 色 accent」简化成「3 档语气」，换场景只换一个 `tone`，认知成本更低。
- **T5 是 T1 的版式扩充**：同一套骨架，多了 `countdown` / `timeline` / `ladder` / `gantt` / `alert` 五个资讯类版式。
- **T4 是独立血统**：浅色奶油底 + 云健音色 + 慢速 +8% + 句子索引硬编码章节，跟深空系没有共用代码。
