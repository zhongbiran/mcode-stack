# MaxMiniCode-Agent：此刻该调哪个 skill

入口是 `mcode`。它先判定当前阶段，再按阶段加载对应的 skill、必要时派对应的 agent。

| 此刻在做什么 | 派谁 | 加载哪些 skill | 落盘到哪 |
|---|---|---|---|
| **开工**：项目还没骨架 | `strategist`（首脑，只派一次） | `req-intake` → `subagent-split-check` → `agent-brief` → `engineering-small-prs` | `docs/plans/<date>-<slug>.md` |
| **开工**：脚手架 | 主程序自己 | `node scripts/scaffold-project.mjs` | `AGENTS.md`、`verify.ps1`、`docs/requirements/` |
| **推进**：执行子任务 | 高难度 `worker` / 中低难度 `deputy` | 按需 | 代码 |
| **推进**：卡住了 | 主程序自己 | `long-command-check` / `context-tax-audit` / `tool-budget-audit` / `long-session-check` / `engineering-emergency-changes` / `req-track` | — |
| **验收**：声称做完了 | `verifier` | `evidence-first-review` → `independent-review` → `engineering-code-review` | `docs/reviews/<date>-<slug>.md` |
| **验收**：合并前自查 / 评审某个 PR | `verifier` 或主程序 | `pr-review` → `pr-description` | PR 正文、评审结论 |
| **收尾**：今天到这 | 主程序自己 | `taste-to-checks` → `trajectory-review` → `handoff-doc` → `lifting-loops` | `AGENTS.md` 已知坑段 |
| **收尾**：把评审接进 CI / 调评审规则 | 主程序自己 | `pr-review-ci` / `pr-review-tuning` | `.github/workflows/mcode-review.yml`、`.gitlab/` |

## 难度分派（执行类子任务）

| 难度 | 判定（任一即高） | 执行者 | 模型 |
|---|---|---|---|
| 高 | 跨 ≥3 模块 / 改动 ≥5 文件 / 动协议或数据契约 / 多方案需取舍 / 验收判据没法纯靠现有命令判定 | `worker` | minimax/MiniMax-M3.1-Flash |
| 中低 | 其余 | `deputy` | opencode-go/iceman-contributor-free |

拿不准按高难度。免费档的 token 不计入任何额度档，所以尽量把活推给它；但它的产出必须过 `verifier`。

## 额度

单次任务的 opencode-go 消耗 ≈ 17.5%（首脑 15.8% + 复核 1.7%）。超过 30% 说明首脑被反复调用了。

## 其余 skill

本 stack 里剩下的 skill 是各阶段的具体手法，不在入口的默认路径上，需要时由 agent 按 description 自己加载。
