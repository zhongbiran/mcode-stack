---
name: mcode
description: MCode-Agent 的主入口。开工、推进、验收、收尾四个阶段一次走完：生成项目配置（AGENTS.md、唯一验收入口、需求文档骨架、拆活方案），按难度指派执行 agent，按阶段复核。Use when starting a new project or task, when work is in progress and needs steering, when something is claimed done and needs verification, or when wrapping up a session.
---

# MCode 生命周期入口

一个入口走完四个阶段：**开工 → 推进 → 验收 → 收尾**。每个阶段指派对应的 agent（= 对应的模型与额度），需要更细的手法时再加载具体 skill。

**先看 §3 派 agent 表，再看 §1 判定当前阶段。**

## 1. 第 0 步：判定当前阶段（不可跳过）

按顺序检查，**第一个命中的即为当前阶段**：

| # | 判据 | 阶段 |
|---|---|---|
| 1 | 项目没有 AGENTS.md，或没有唯一验收入口 | **开工** |
| 2 | 用户在调用时说了「收尾 / 结束 / 今天到这 / 归档」 | **收尾** |
| 3 | 本次会话已有实现动作，且工作区有未提交改动 | **验收** |
| 4 | 其余 | **推进** |

- 用户在调用时直接指定阶段（「mcode，收尾」）→ 跳过判定
- 判据 1 命中且用户没说这次要做什么 → 先跑 §2.1 的脚本摸清项目，再问一次「这次要做什么」
- 判定靠可观察的文件与状态，不靠猜

## 2. 各阶段怎么走

### 2.1 开工

1. 跑 `node scripts/scaffold-project.mjs`（与本 SKILL.md 同目录）→ 生成/校准 AGENTS.md、唯一验收入口、`docs/requirements/` 骨架；读它输出的 JSON 摘要
2. **派 `strategist`（首脑）—— 只派这一次**，它出方向：
   - 加载 `req-intake` → 挑战这次的需求，写下**可验证的预期效果**
   - 加载 `subagent-split-check` → 决定这次怎么拆
   - 加载 `agent-brief` → 写本次 brief
   - 加载 `engineering-small-prs` → 大改动拆小步
   - 要求它把方案落盘到 `docs/plans/<date>-<slug>.md`（含问题定义 / 约束 / 选项 / 推荐 / 执行顺序 / 验收）
3. 首脑给每条子任务标**难度与执行者**，主程序照着派（见 §4）
4. 后续澄清轮**不再派 strategist**，改派 `explore` 读盘继续

### 2.2 推进

1. 先问「现在卡在哪」
2. 执行类子任务按 §4 的难度派给 `worker` 或 `deputy`；主程序自己不直接写实现代码
3. 卡住时按症状加载：`long-command-check`（长命令卡住）/ `context-tax-audit`、`tool-budget-audit`（上下文膨胀）/ `long-session-check`（会话变钝）/ `engineering-emergency-changes`（紧急变更）/ `req-track`（进展跟踪）
4. 本阶段**不预加载任何 skill**，按需加载

### 2.3 验收

1. 跑项目的唯一验收入口（如 `pwsh -File verify.ps1`）
2. **派 `verifier`** → 加载 `evidence-first-review`（先看证据再信自述）、`independent-review`（干净上下文复核）、`engineering-code-review`（找问题）
3. 落盘 `docs/reviews/<date>-<slug>.md`（结论 + 遗留风险）
4. **副手（`deputy`）干的活必须过这一步** —— 免费档会漏「性能 / 非显然」类缺陷
5. 要开 PR / MR 前自查，或用户点名评审某个 PR → 加载 `pr-review`（按严重度与证据阶梯给结论）；要写 PR 描述 → `pr-description`

### 2.4 收尾

1. 加载 `taste-to-checks` → 把这次反复出现的纠正变成自动检查
2. 加载 `trajectory-review` → 复盘这次是怎么走过来的
3. 加载 `handoff-doc` → 写交接（还要继续时）
4. 加载 `lifting-loops` → 找出你在替 agent 干的活
5. 更新 AGENTS.md 的「已知坑」段
6. 要把评审接进 CI（GitHub Actions / GitLab CI）→ 加载 `pr-review-ci`；要按仓库历史调评审规则 → `pr-review-tuning`

## 3. 派 agent 表（= 花哪一份额度）

| 阶段 | 派谁 | 模型 | 占 5h 额度 |
|---|---|---|---|
| 开工（首轮定方向） | `strategist` | opencode-go/kimi-k3.1-pro | **15.8%** |
| 开工（后续澄清轮） | `explore` / 主程序自己 | iceman-contributor-free / MiniMax-M3.1-Flash | ~0 |
| 推进（执行 · 高难度） | `worker` | minimax/MiniMax-M3.1-Flash | 0（minimax 池） |
| 推进（执行 · 中低难度） | `deputy` | opencode-go/iceman-contributor-free | **0** |
| 验收 | `verifier` | opencode-go/qwen3.8-max | 1.7% |
| 杂活 | `explore` | opencode-go/iceman-contributor-free | 0 |

**单次任务的 opencode-go 消耗 ≈ 17.5%（首脑 15.8% + 复核 1.7%）。超过 30% 说明首脑被反复调用了，该降本。**

## 4. 难度分派规则

| 难度 | 判定（满足任一即高难度） | 执行者 |
|---|---|---|
| 高 | 跨 ≥ 3 个模块 / 改动 ≥ 5 个文件 / 动协议或数据契约 / 有多种方案需取舍 / 验收判据没法纯靠现有命令判定 | `worker` |
| 中低 | 其余：单模块内、≤ 3 个文件、方案唯一、现有命令能判验收 | `deputy` |

- **拿不准按高难度** —— 用主额度池换正确率，划算
- 免费档（`deputy` / `explore`）的 token 不计入任何额度档，尽量把活推给它
- `deputy` 的产出**必须**经 `verifier` 复核

## 5. 硬要求

- 步骤里标明「load 某个 skill」时，用 `skill` 工具按名加载，**不要去读 SKILL.md 文件**
- 不许跳步
- 每条结论要么有证据（文件路径、命令输出），要么明确标注是假设
- 执行类工作不自己硬写，按 §4 派给 `worker` / `deputy`
