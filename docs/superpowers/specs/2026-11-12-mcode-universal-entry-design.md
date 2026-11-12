# mcode-stack 重整：一个插件、一个万能入口

- 日期：2026-11-12
- 仓库：`~/.minimax/workspace/mcode-stack`（clone of `github.com/MiniMax-AI/mcode-stack`，起点 HEAD `88f84be`，2026-11-06）
- 分支：`feat/mcode-universal-entry`

## 1. 要解决的问题

仓库现有 27 个 skill，按**作者**分包（ronny 19 / req-tpm 6 / jiachen 2），不按**使用时机**分。用户原话：

> 「仓库里那20多个插件，对我来说太复杂了，每个新项目开始，就要调用7-8个来配置，我想有一套轻松快捷的插件帮我做这些事」

两个具体痛点：

1. **认知负担** —— 看到 27 个名字，不知道该调哪个、什么时候调。stack 名是人名，skill 名是抽象功能名。
2. **调用成本** —— 新项目开工要手动调 7-8 个 skill 才能把项目配置好。

「配置一个新项目」具体指产出一套项目骨架。对照已经跑通的两个项目（FirePrevention、RC.DustFall），它等于四件事：

| 产物 | FirePrevention 实例 |
|---|---|
| 项目硬规则 + 已知坑 | `AGENTS.md`（19 条硬规则） |
| 唯一验收入口 | `verify.ps1`（静态规则 + 类型检查/构建 + 自检） |
| 需求文档骨架 | `docs/requirements/REQ-001..011` + README |
| 本次工作的拆活方案 + brief + 实施计划 | 散落在会话里，未落盘 |

## 2. 已验证的事实（2026-11-12 实测，非推断）

| 事实 | 证据 |
|---|---|
| **一个入口 skill 能编排多个 skill** | 实验：新起子会话，入口 `mcode-lab` 正文写明依次加载三个子 skill。子会话的 `skill` 调用序列 = `mcode-lab` → `lab-split-check` → `lab-brief` → `lab-probe`，4 次全部 ok，12 次工具调用 0 失败 |
| **被编排的可以是上游真实 skill** | 实验用的是上游 `subagent-split-check` / `agent-brief` 原文，未做简化 |
| **子 skill 是真加载，不是嘴上说** | 子 agent 报告原文：`Sub-skills were loaded through the skill tool only; no sub-skill SKILL.md was read directly from disk`；4 个产物文件全部落盘（1586 / 1927 / 9 / 1022 字节），`03-probe.txt` = `PROBE_OK\n` |
| **MCode 插件没有 commands 组件** | 本机 32 个官方插件的 manifest 中零个声明 `commands` 字段；插件目录下无 `commands/` 目录。可调用最小单位只有 skill（`/skill-name`） |
| **插件目录非热加载** | 同一进程内解析 `mcode-lab:lab-probe` 直接返回 `Local skill not found`。必须 `/plugins` 面板 Ctrl+R 或重开会话 |
| **`~/.agents/skills/` 对新会话立即生效** | 实验子会话直接加载到刚放进 `~/.agents/skills/` 的 `mcode-lab`，未等刷新 |
| **插件规范由脚本强制** | `scripts/check.mjs` 校验 plugin.json 字段、skill 清单、marketplace 一一对应、companion manifest 一致性、version bump |
| **skills 必须平铺** | `check.mjs` 只遍历 `skills/` 的直接子目录。**不能按阶段建子文件夹** |

## 3. 目标与非目标

### 目标

- 对外只暴露 **1 个插件**、**1 个入口 skill**，敲一次完成整套流程
- 32 个既有 skill 全部降级为**内部工具**，用户不需要知道它们存在（31 个进 `mcode` 插件，`making-content` 进 `mcode-content` 插件）
- **确定性工作交给脚本**（秒级、零 token），**判断工作才交给模型**
- 每个 skill 在 description 里自带「什么时候用」，agent 能自己选中
- **入口 skill 写明每步派哪个 agent**（见 `5.3）—— 派谁 = 花哪一份额度
- 重整后仓库仍通过 `node scripts/check.mjs`

### 非目标

- 不做桌面端 marketplace 自动安装（本机 `mcode` CLI 不在 PATH，用不了那条路）
- 不改上游 skill 的方法论正文，只做归属与落地适配
- 不引入新的运行时依赖（沿用 Node 22+、现有 `scripts/*.mjs` 风格）
- 不推送到任何远端（用户明确选择：本地改，先不推）

## 4. 方案总览

    用户敲 /mcode
       │
       ├─ 第 0 步  阶段判定（自动判定 + 用户可显式覆盖）
       │
       ├─ 脚本层（确定性，秒级零 token）
       │    scripts/scaffold-project.mjs
       │    · 探测项目类型与构建命令
       │    · 生成/校准 AGENTS.md
       │    · 生成/校准唯一验收入口
       │    · 建 docs/requirements/ 骨架
       │    · 输出 JSON 摘要给 skill 读
       │
       └─ 编排层（判断，需要模型）
            按阶段加载内部 skill：
            开工 8 个 / 推进 6 个 / 验收 11 个 / 收尾 6 个

### 为什么是「1 插件 1 入口」而不是「4 插件 4 入口」

用户诉求是「轻松快捷」，不是「分类清晰」。4 个插件仍然是 4 个名字要挑、4 次要敲。**插件数应当最小化到 1**，阶段信息放进入口 skill 的编排表、每个 skill 的 description、以及 `WORKFLOW.md`。

### 插件与 skill 的最终形态

| | 插件 | skill |
|---|---|---|
| `mcode` | 1 个 | 32 个：入口 `mcode` + 31 个内部工具 |
| `mcode-content` | 1 个 | 1 个：`making-content`（内容生产，不属于工程生命周期） |

- 插件 id = `mcode`，入口 skill id = `mcode` → skill 目录里显示为 `mcode:mcode`，用户敲 `/mcode`
- 裸名可解析：官方插件 `mcode-trajectory-studio` 的同名 skill 用裸名即可加载（本次会话已实测），所以 `/mcode` 成立
- `making-content` 按用户选择独立成小插件，不污染生命周期

### 内部 skill 的阶段归属（32 个）

| 阶段 | 何时调 | skill |
|---|---|---|
| **开工** | 开工前 | subagent-split-check · agent-brief · engineering-small-prs · engineering-change-descriptions · review-capacity-check · req-intake · req-prioritize · req-design |
| **推进** | 干活中 | long-command-check · long-session-check · tool-budget-audit · context-tax-audit · engineering-emergency-changes · req-track |
| **验收** | 声称做完时 | engineering-code-review · independent-review · evidence-first-review · engineering-review-comments · engineering-review-feedback · req-ship · pr-review · pr-review-ci · pr-review-tuning · pr-description · pr-quiz |
| **收尾** | 停下来时 | taste-to-checks · trajectory-review · harness-experiment · handoff-doc · req-outcome · lifting-loops |

来源：本地 27 个 + 上游 jiachen 0.2.0 的 pr-review 全家桶 5 个（本地缺，用户确认吃进来）。

**「7-8 个」对上了**：开工阶段正好 8 个 skill（subagent-split-check / agent-brief / engineering-small-prs / engineering-change-descriptions / review-capacity-check / req-intake / req-prioritize / req-design）——即用户说的「每个新项目开始要调用 7-8 个来配置」。

## 5. 万能入口的设计

### 5.1 阶段判定（第 0 步，不可跳过）

按顺序检查，**第一个命中的即为当前阶段**：

| # | 判据 | 阶段 |
|---|---|---|
| 1 | 项目没有 AGENTS.md，或没有唯一验收入口 | **开工** |
| 2 | 用户在调用时说了「收尾 / 结束 / 今天到这 / 归档」 | **收尾** |
| 3 | 本次会话已有实现动作，且工作区有未提交改动 | **验收** |
| 4 | 其余 | **推进** |

- 用户可以在调用时直接指定阶段（「mcode，收尾」），指定即跳过判定
- 判据 1 命中且用户没说这次要做什么时，先跑脚本摸清项目，再问一次「这次要做什么」
- 判定不靠模型猜，靠可观察的文件/状态信号

### 5.2 各阶段的编排

**开工**
1. 跑 `scripts/scaffold-project.mjs` → 生成/校准 AGENTS.md、唯一验收入口、`docs/requirements/` 骨架（读它输出的 JSON 摘要）
2. 加载 `req-intake` → 挑战这次的需求，写下**可验证的预期效果**
3. 加载 `subagent-split-check` → 决定这次怎么拆（结果要落盘，供后续轮读盘继续）
4. 加载 `agent-brief` → 写本次 brief
5. 落盘 `docs/plans/<date>-<slug>.md`（拆活方案 + brief + 实施计划）—— **这一步是首脑分层的关键**：后续澄清轮靠它读盘，不必再调 kimi

**推进**
1. 先问「现在卡在哪」
2. 按症状加载对应 skill：长命令卡住 → `long-command-check`；上下文膨胀 → `context-tax-audit` / `tool-budget-audit`；会话变钝 → `long-session-check`；紧急变更 → `engineering-emergency-changes`；进展跟踪 → `req-track`
3. 本阶段**不预加载任何 skill**，按需加载，避免上下文税

**验收**
1. 跑项目的唯一验收入口（FirePrevention 即 `pwsh -File verify.ps1`）
2. 加载 `evidence-first-review` → 先看证据再信自述
3. 加载 `independent-review` → 干净上下文复核
4. 加载 `engineering-code-review` → 找问题
5. 落盘 `docs/reviews/<date>-<slug>.md`（结论 + 遗留风险）
6. 可选：`pr-review`（若已配 CI）

**收尾**
1. 加载 `taste-to-checks` → 把这次反复出现的纠正变成自动检查
2. 加载 `trajectory-review` → 复盘这次是怎么走过来的
3. 加载 `handoff-doc` → 写交接（还要继续时）
4. 加载 `lifting-loops` → 找出你在替 agent 干的活
5. 更新 AGENTS.md 的「已知坑」段

### 5.3 模型与额度分配（插件的一部分）

入口 skill 不只是流程，还必须写明**每一步派哪个 agent** —— 因为每个 agent 在 MCode 里绑定了不同模型，调用谁就决定了花哪一份额度。这张表是插件的一部分，不是外挂约定。

本机额度结构（2026-11-12 实测）：

- **minimax/MiniMax-M3.1-Flash** —— 用户的主要额度池，量大。承担**执行层与主程序**，最能扛量。
- **opencode-go** —— 稀缺池。5 小时滚动窗口约 380 万 token，30% 红线约 114 万 token。**只留给首脑与复核。**
- **opencode-go 免费档**（iceman-contributor-free）—— **token 不计入任何额度档**，杂活全放这里 = 0 消耗。

| 阶段 | 派谁 | 模型 | 单次占 5h 额度 |
|---|---|---|---|
| 开工（首轮定方向） | strategist | opencode-go/kimi-k3.1-pro | **15.8%** |
| 开工（后续澄清轮） | explore / 主程序自己 | iceman-contributor-free / minimax/MiniMax-M3.1-Flash | ~0 |
| 推进（执行） | worker | minimax/MiniMax-M3.1-Flash | 0（minimax 池） |
| 验收 | verifier | opencode-go/qwen3.8-max | 1.7% |
| 杂活 | explore | opencode-go/iceman-contributor-free | 0 |

**首脑分层规则（守 30% 红线）**：kimi 一轮就吃掉 15.8%，「反复确认」两三轮必破线。所以：

1. 首脑只出**一轮**方向 —— 一次成型，含问题定义 / 约束 / 选项 / 推荐 / 执行顺序 / 验收。
2. 首脑必须把结论**落盘**到 `docs/plans/<date>-<slug>.md`。
3. 之后的澄清轮**不再调 kimi**，改派 `explore`（免费档）读盘继续，或主程序自己读盘推进。
4. 单任务预算：15.8 + 0 + 0 + 1.7 ≈ **17.5%**，留足余量。

**需要更强执行力时**（方案复杂、worker 卡住）：显式 `task(model="opencode-go/deepseek-v4.1-flash")`。该模型 AA 智能 33、cache 读免费、实测 4/4 命中，但吃 opencode-go 额度 3.6%，属于按需加码，不进默认槽位。

### 5.4 入口 skill 的写法约束

- frontmatter `description` 第一句写清「什么时刻调」，并列出触发词
- 正文按上面 5.1 / 5.2 结构写死，每一步标明「**load** 哪个 skill」
- 明确写「用 skill 工具加载，不要读 SKILL.md 文件」——实验已验证这是可行且可靠的路径
- 明确写「不许跳步」

## 6. 脚本层设计

### 6.1 `scripts/scaffold-project.mjs`

纯确定性，无模型参与。职责：

1. **探测**：`package.json` / `*.csproj` / `go.mod` / `pyproject.toml` → 项目类型；读 `package.json` 的 scripts → 构建/测试命令
2. **生成 `AGENTS.md`**：从模板 + 探测结果填充（技术栈、构建命令、验收命令、目录约定）
3. **生成唯一验收入口**：按探测到的技术栈选 `verify.ps1`（Windows）或 `verify.sh`（Unix）
4. **生成 `docs/requirements/README.md` + `REQ-000-template.md`**
5. **输出 JSON 摘要**（生成了什么、跳过了什么、探测结果），供入口 skill 读取

**幂等**：已存在的文件不覆盖，除非 `--force`；跳过项写进 JSON 摘要，不静默。

### 6.2 `templates/project-scaffold/`

| 模板 | 说明 |
|---|---|
| `AGENTS.md.tmpl` | 章节骨架：项目概览 / 硬规则 / 已知坑 / 验收命令 / 权威文档索引。占位用双花括号 |
| `verify.ps1.tmpl` | 通用 PowerShell 验收入口：静态规则 → 类型检查/构建 → 自检 → 验收。空规则集也要能跑 |
| `verify.sh.tmpl` | Unix 版 |
| `REQ.md.tmpl` | 需求文档模板 |
| `requirements-README.md.tmpl` | `docs/requirements/README.md` 骨架 |

### 6.3 参考实例

`templates/project-scaffold/examples/` 放两个**脱敏后**的完整实例：

- `fire-prevention/`：AGENTS.md + verify.ps1 + REQ 样例
- `rc-dustfall/`：同上

**必须脱敏**：上游仓库明文要求 `Keep it public-safe: no internal hostnames, links, project codenames, internal metrics, credentials or customer data`。实例里的数据库地址、端口、公司名、客户名一律替换成占位符。

## 7. 命名与时机规范

写进 `templates/stack-template/` 和仓库 `CONTRIBUTING.md`，让以后新增的 stack 遵守同一套：

1. 插件 id 用小写字母 + 数字 + 连字符
2. **description 第一句必须写「什么时刻调」**
3. `exampleQueries` ≤ 3 条，写成用户会说的话
4. `WORKFLOW.md` 第一节固定是「此刻该调哪个 skill」表
5. 阶段词只用 `开工 / 推进 / 验收 / 收尾`

## 8. 仓库规范符合性

每个新插件目录必须满足 `scripts/check.mjs`：

| 文件 | 要求 |
|---|---|
| `.minimax-plugin/plugin.json` | 正本。`name` = 目录名；含 version / description / author / category / exampleQueries / skills 清单 |
| `.claude-plugin/plugin.json` | companion。name / version / description / author 必须与正本一致 |
| `.codex-plugin/plugin.json` | companion。同上 |
| 根 `plugin.json` | companion（portable）。同上 |
| `WORKFLOW.md` | 必需 |
| `icon.png` | 必需（manifest 声明后文件必须存在） |
| `skills/<name>/SKILL.md` | 平铺；目录名 = frontmatter name；description 非空且 ≤ 1024 字符 |
| `.claude-plugin/marketplace.json` | 每个已发布插件一条，`source: "./stacks/<id>"`，`name` = 目录名，`description` 与 plugin.json 一致，**不得**出现 skills/commands/agents/hooks/mcpServers 字段 |
| `.agents/plugins/marketplace.json` | 第二份清单，同样 2 条（`mcode` + `mcode-content`） |

**NOTICE.md**：`engineering-*` 系列改编自 Google Engineering Practices（CC-BY 3.0），承载它们的插件必须保留署名。

## 9. 安装与生效

两条路径都写进 README：

| 路径 | 做法 | 生效 |
|---|---|---|
| A（推荐） | 把 `stacks/mcode`、`stacks/mcode-content` 复制到 `~/.minimax/plugins/` | `/plugins` 面板 **Ctrl+R** 刷新后可用 |
| B（更省事） | 把 skill 目录复制到 `~/.agents/skills/` | **新会话立即可用**，不必装插件 |

**插件目录非热加载**这一条必须写在 README 顶部，否则「装完不生效」会被误判成装错了。

路径 B 的注意事项：skill 目录是平铺的，`subagent-split-check` 这类裸名可能与其它来源重名。安装前需检查目标目录是否已存在同名 skill。

## 10. 风险与未决项

| # | 风险 | 处置 |
|---|---|---|
| R1 | 插件目录非热加载，装完不生效 | README 顶部写明；提供路径 B 兜底 |
| R2 | 万能入口的阶段判定可能误判 | 判定基于可观察信号；用户可显式指定阶段；判定表写进 skill 正文可审计 |
| R3 | `pr-review-ci` 面向 GitHub/GitLab CI；本机项目在 gitee，CI 能力不同 | 先把 skill 接进来并标注；**不承诺开箱即用**，落地需单独评估 |
| R4 | 参考实例含内部主机名/凭据/客户名 | 落盘前逐项脱敏，遵守上游 public-safe 要求 |
| R5 | 仓库位于 `~/.minimax/workspace/`，归运行时管，有被清的风险 | 收尾时拷一份到 D 盘项目目录下 |
| R6 | 上游 pr-review 全家桶引入方式未定 | 从 `origin/main` 取 `stacks/jiachen/` 下的 5 个 skill 目录，不合并上游历史 |
| R7 | 万能入口只验过 3 个子 skill，未验 30+ 规模 | 实施后用 harness-experiment 复测：入口加载的 skill 数、请求数、token |

## 11. 实施分期

三个 commit，每个都能独立过 `node scripts/check.mjs`：

**commit 1 — 骨架**
- 新建 `scripts/scaffold-project.mjs`
- 新建 `templates/project-scaffold/`（模板 + 脱敏实例）
- 新建 `stacks/mcode/`、`stacks/mcode-content/` 的目录与全部 manifest
- 重写 `.claude-plugin/marketplace.json`、`.agents/plugins/marketplace.json`（各 2 条）
- 删除 `stacks/ronny`、`stacks/jiachen`、`stacks/req-tpm`
- 更新 `scripts/install.sh` 默认 stack
- 更新 `templates/stack-template/` 承载新规范

**commit 2 — 内容**
- 32 个 skill 迁入两个新插件（31 进 `stacks/mcode/skills/`，1 进 `stacks/mcode-content/skills/`），平铺
- 从 `origin/main` 取 pr-review 全家桶 5 个
- NOTICE.md 分配到承载 engineering-* 的插件
- 5 份 checklist 归入推进阶段
- 写 33 个 skill 的 description（32 个迁入的 + 1 个入口 `mcode`），每个含阶段标记与触发词
- req-* 6 个 skill 的**落地部分**本地化：飞书文档 + Meegle → 仓库内 `docs/requirements/` 文档
- 写入口 skill `skills/mcode/SKILL.md`（第 0 步判定 + 四阶段编排）
- 写 2 份 `WORKFLOW.md`、2 份 `README.md`

**commit 3 — 文档**
- 重写 `README.md`、`README_ZH.md`（现共 117 处旧 stack 名引用）
- 重写 `stacks/README.md`
- 修 `notes/` 5 篇文章里失效的 skill 路径链接
- 修 `.github/ISSUE_TEMPLATE/i-use-this.yml`

## 12. 验收判据

1. `node scripts/check.mjs` 输出 `check: N stack(s) passed`，退出码 0
2. `CHECK_BASE=origin/main node scripts/check.mjs` 的 version bump 检查通过
3. 装到 `~/.minimax/plugins/` → Ctrl+R → skill 目录出现 `mcode:mcode` 与 31 个内部 skill
4. 在一个真实新项目里敲 `/mcode`，产出四类产物：AGENTS.md、验收入口、`docs/requirements/` 骨架、`docs/plans/` 计划
5. 入口 skill 的 `skill` 调用序列 ≥ 4 次且全部成功（机制已在实验验证，此处复测规模）
6. 旧三个插件从 `~/.minimax/plugins/` 移除后，仓库内无残留旧名引用
7. 入口 skill 按 5.3 节的表派 agent：开工派 strategist、推进派 worker、验收派 verifier、杂活派 explore；单次任务消耗的 opencode-go 额度 ≤ 30%
