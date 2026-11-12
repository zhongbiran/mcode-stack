<p align="center">
  <img src="docs/assets/hero-zh.png" alt="MCode Stack：MiniMax Code 团队开发 MiniMax Code 时自己在用的工作流和 Skill" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <a href="https://github.com/zhongbiran/mcode-stack/actions/workflows/validate.yml"><img alt="validate" src="https://github.com/zhongbiran/mcode-stack/actions/workflows/validate.yml/badge.svg"></a>
  <a href="stacks/"><img alt="skills: stacks/" src="https://img.shields.io/badge/skills-stacks%2F-ff7a59.svg"></a>
  <a href="https://github.com/MiniMax-AI/minimax-code"><img alt="for MiniMax Code" src="https://img.shields.io/badge/for-MiniMax%20Code-5b6cff.svg"></a>
</p>

<p align="center"><a href="README.md">English</a> · <b>中文</b></p>

**我们团队用 MiniMax Code 写 MiniMax Code 的全套工作流，全部开源，装上就能用。**

这里放的不是 prompt 合集，也不是「最佳实践」清单，而是团队成员每天真在用的东西：怎么让 AI 写的代码保持质量、怎么判断一个任务该不该拆 subagent、长命令该怎么等、长会话怎么不变傻、每一轮往上下文里塞了什么。每一份都是一个 `SKILL.md` 格式的 Skill 或清单，能直接装进 [MiniMax Code](https://github.com/MiniMax-AI/minimax-code) 里用。

工程类的 Skill 现在装成一个插件 `mcode`（显示名 **MCode-Agent**）：由入口 skill 判定你处在四个阶段里的哪一个 —— 开工、推进、验收、收尾 —— 其余按阶段派发。

内容栈 `mcode-content` 显示名 **Mcode-Content-Check**，内置 `making-content` 与第三方 skill `lieflat-less-ai-tone`。

- [快速开始](#快速开始)
- [里面有什么](#里面有什么)
- [怎么用起来](#怎么用起来)
- [工程笔记](#工程笔记)
- [Stacks](#stacks)
- [参与贡献](#参与贡献)

## 快速开始

**Claude Code，一条命令。** 这条命令会加上本仓库的插件市场，并装上一整份 stack。在 shell 里：

```bash
claude plugin install mcode --marketplace zhongbiran/mcode-stack
```

在 Claude Code 会话里：

```bash
/plugin install mcode --marketplace zhongbiran/mcode-stack
```

`mcode` 是工程生命周期工作台，内容生产栈用 `mcode-content`，装法一样。克隆本仓库后可以跑 `scripts/install.sh`（默认 `mcode`，`scripts/install.sh mcode-content` 装另一个）：`PATH` 里有 `claude` 或 `codex` 时，它会执行同样的安装，否则把该 stack 的 Skill 复制到 `~/.agents/skills/`。

较旧的 Claude Code 可以先加市场，再安装：

```bash
/plugin marketplace add zhongbiran/mcode-stack
/plugin install mcode@mcode-stack
```

**Codex。** 先加上市场，再从 Plugins Directory 或 CLI 安装：

```bash
codex plugin marketplace add zhongbiran/mcode-stack
codex plugin add mcode@mcode-stack
```

把 `mcode` 换成 `mcode-content` 即可。如果只要某一个 Skill，把它的目录复制到 `~/.agents/skills/`。Codex 和 MiniMax Code 都会扫描这个目录，复制步骤见下文。

**装一个 Skill，所有项目都能用：**

```bash
git clone https://github.com/zhongbiran/mcode-stack.git ~/mcode-stack
mkdir -p ~/.agents/skills
cp -R ~/mcode-stack/stacks/mcode/skills/long-command-check ~/.agents/skills/
```

重新打开会话后，在 MiniMax Code 里输入 `/skills` 就能看到它。用 `/long-command-check` 调用，或者让 agent 按描述自动加载。

**整份 stack 当插件装：**

```bash
mcode plugin marketplace list    # 查看本地插件目录
```

把 `stacks/mcode` 整个目录复制到那个目录下，然后在 MiniMax Code 里打开 `/plugins`，按 `Ctrl+R` 刷新。本地插件放进去就算装好了，可以在面板里按空格启用或停用。

**从 MiniMax Code 插件市场安装：**

这个仓库本身也是一个插件市场，不用复制文件就能装，之后有更新也能直接拿到。在 MiniMax Code 桌面端打开「插件」，点「添加市场」，填入 `zhongbiran/mcode-stack`，每份 stack 都会显示成一个插件，可以安装、更新或卸载。添加市场的功能正在逐步开放，你的版本可能还没有。

**换一台电脑，快速导入（MiniMax Code 桌面端）：**

```bash
git clone https://github.com/zhongbiran/mcode-stack.git
```

把两个目录复制到插件目录（Windows：`%USERPROFILE%\.minimax\plugins\`，macOS：`~/.minimax/plugins/`）：

```text
mcode-stack/stacks/mcode          ->  .minimax/plugins/mcode
mcode-stack/stacks/mcode-content  ->  .minimax/plugins/mcode-content
```

然后打开 `/plugins` 按 **Ctrl+R** 刷新，在对话里输入 `@mcode`。只做工程开发的话，复制 `mcode` 一个即可。

> 插件目录不热加载：复制后必须刷新或重开会话。
> 多 agent 编排（`strategist` / `worker` / `deputy` / `verifier`）不在插件包里，需要在 Agent 设置里单独创建并绑定模型，详见 `stacks/mcode/WORKFLOW.md`。

<details>
<summary>更多安装方式</summary>

MiniMax Code 会自动发现这几个目录里的 Skill（每个 Skill 一个子目录，里面放 `SKILL.md`）：

- 只对当前项目生效：项目里的 `.minimax/skills/`、`.claude/skills/` 或 `.agents/skills/`
- 对所有项目生效：`~/.agents/skills/`（`~/.claude/skills/`、`~/.codex/skills/` 也会读取）

`mcode plugin add` 只从官方插件目录安装，不接受 GitHub 地址或本地路径。

这里的 Skill 用的是通用的 `SKILL.md` 格式，大部分也能放进其他支持 Skill 的 agent 里用。

</details>

## 里面有什么

| 场景 | Skill | 做什么 |
| --- | --- | --- |
| 规划与拆分 | [`subagent-split-check`](stacks/mcode/skills/subagent-split-check/SKILL.md) | 判断一段活该交给 subagent，还是留在主循环 |
| | [`engineering-small-prs`](stacks/mcode/skills/engineering-small-prs/SKILL.md) | 把大功能、大重构、迁移拆成一串好审的小 PR |
| | [`engineering-change-descriptions`](stacks/mcode/skills/engineering-change-descriptions/SKILL.md) | 写清楚改了什么、为什么改的 PR 和 commit 描述 |
| Context 与工具 | [`tool-budget-audit`](stacks/mcode/skills/tool-budget-audit/SKILL.md) | 算清工具吃了多少 context，决定先精简、上 tool search 还是上 PTC |
| | [`context-tax-audit`](stacks/mcode/skills/context-tax-audit/SKILL.md) | 每轮往请求里塞了什么，会不会弄坏提示词缓存 |
| 长会话与长命令 | [`long-session-check`](stacks/mcode/skills/long-session-check/SKILL.md) | 该丢的丢、该压的压、该落盘的落盘；什么时候压缩，什么时候开新会话 |
| | [`handoff-doc`](stacks/mcode/skills/handoff-doc/SKILL.md) | 写一份交接文档，新会话接着干 |
| | [`long-command-check`](stacks/mcode/skills/long-command-check/SKILL.md) | 长命令和后台任务的 10 项自查 |
| 代码审查 | [`independent-review`](stacks/mcode/skills/independent-review/SKILL.md) | 审查者从干净的 context 开始，只拿 diff、需求说明和测试结果 |
| | [`engineering-code-review`](stacks/mcode/skills/engineering-code-review/SKILL.md) | 按代码健康度审查改动：设计、功能、复杂度、测试、能不能批 |
| | [`engineering-review-comments`](stacks/mcode/skills/engineering-review-comments/SKILL.md) | 写清楚、标好严重程度、讲明理由的 review 评论 |
| | [`engineering-review-feedback`](stacks/mcode/skills/engineering-review-feedback/SKILL.md) | 作为作者处理 review 意见：改代码、补说明、化解分歧 |
| 实验与紧急修复 | [`harness-experiment`](stacks/mcode/skills/harness-experiment/SKILL.md) | 小 eval、一次只改一处、多跑几次、看哪些任务翻转了 |
| | [`trajectory-review`](stacks/mcode/skills/trajectory-review/SKILL.md) | 不只看结果过没过，回头看 agent 是怎么得到这个结果的 |
| 对 agent 的产出负责 | [`agent-brief`](stacks/mcode/skills/agent-brief/SKILL.md) | 交给 agent 之前：定风险高低，先写自己的猜测，用自己的话写清范围，事先说好怎样算验证过 |
| | [`evidence-first-review`](stacks/mcode/skills/evidence-first-review/SKILL.md) | agent 说做完了：先看它跑过的命令和输出，再看总结；问清它默默做了哪些决定 |
| | [`review-capacity-check`](stacks/mcode/skills/review-capacity-check/SKILL.md) | 再开一个会话之前，先看手上做完却还没人把关的活有多少 |
| | [`taste-to-checks`](stacks/mcode/skills/taste-to-checks/SKILL.md) | 同样的意见提了两次，就写成测试、lint、hook 或 CI |
| | [`engineering-emergency-changes`](stacks/mcode/skills/engineering-emergency-changes/SKILL.md) | 判断 hotfix 是不是真紧急，紧急时怎么快审又不丢质量 |

上表是 [`stacks/mcode`](stacks/mcode/) 的内容。[`stacks/mcode-content`](stacks/mcode-content/) 里是 [`making-content`](stacks/mcode-content/skills/making-content/SKILL.md)：把笔记和素材做成小红书图文和竖版短视频；以及第三方 skill [`lieflat-less-ai-tone`](stacks/mcode-content/skills/lieflat-less-ai-tone/SKILL.md)：基于两轮实测语料的 AI 味检测与最小改写（CC BY-NC 4.0，非商业使用，署名见 [`stacks/mcode-content/NOTICE.md`](stacks/mcode-content/NOTICE.md)）。

`stacks/mcode` 里还带着需求管理的一组 Skill（`req-intake`、`req-design`、`req-prioritize`、`req-track`、`req-ship`、`req-outcome`）：谁提的需求，谁就和自己的 agent 一起当这条需求的 TPM，从受理时追问该不该做，到最后拿证据对照预期效果才关闭。需求正文放飞书文档，状态和流转放飞书项目（Meegle），所以这组 Skill 需要 `meegle` 和 `lark-cli`，并先在自己的 Meegle 空间里查一遍字段和状态。

每个 stack 里一般有三类东西：

| 类型 | 是什么 | 怎么用 |
| --- | --- | --- |
| Skill | 一个目录，里面有 `SKILL.md` | 装好后在 MiniMax Code 里用 `/skill名` 调用，或者让 agent 按描述自动加载 |
| 清单 | 也做成 Skill，让 agent 拿着清单逐条对照你的项目；`checklists/` 下另有纯文本版 | 同上，或者直接读 |
| 工作流说明 | 一份 `WORKFLOW.md`，写清这个人每天怎么用 MiniMax Code 干活 | 直接读 |

## 怎么用起来

<p align="center">
  <img src="docs/assets/how-it-works-zh.png" alt="从一篇工程笔记，到一个装进 MiniMax Code、在自己项目上跑的 Skill" width="100%">
</p>

AI 写代码越来越快，真正拉开差距的，是围绕 agent 的那一圈工程习惯：什么时候让它停下来自查，review 交给谁，状态记在哪，实验怎么做才算数。这些东西写在文章里很难照着做，所以我们把它们做成了 Skill 和清单，和「MCode 工程笔记」专栏对应：文章把道理讲清楚，仓库负责落地。

我们也相信，harness 工程是一门靠实验推进的手艺。这里的每一份东西都会随着我们的实践继续改。欢迎拿去用、拿去改。想改仓库里的内容，先开 issue，见[参与贡献](#参与贡献)。

## 工程笔记

| # | MCode 工程笔记 | 对应 Skill |
| --- | --- | --- |
| 01 | [subagent 不是越多越好：先管好 context，再谈并行](notes/01-subagent.md) | `independent-review`、`subagent-split-check`、`harness-experiment` |
| 02 | [工具一多，context 就爆：从 tool search 到 PTC](notes/02-tool-context.md) | `tool-budget-audit` |
| 03 | [长会话怎么不变傻：compaction 和 memory 的取舍](notes/03-compaction-memory.md) | `long-session-check`、`handoff-doc` |
| 04 | [一条 bash 命令该等多久：从前台阻塞到后台任务](notes/04-bash-background.md) | `long-command-check` |
| 05 | [一个小字段，拖垮整段前缀缓存](notes/05-prefix-cache.md) | `context-tax-audit` |

## Stacks

```text
stacks/mcode/               生命周期工作台：一个入口、四个阶段、评审全家桶
stacks/mcode-content/       内容生产栈：把笔记素材做成小红书图文和竖版短视频
stacks/<name>/              每位成员一个目录，欢迎团队同事把自己的也放进来
notes/                      「MCode 工程笔记」每一篇对应哪一份能跑的东西
community/                  团队外的 stack，由协作者加进来
templates/stack-template/   新增 stack 用的模板
```

每份 stack 本身也是一个 MiniMax Code 插件包，具体内容见 [`stacks/mcode`](stacks/mcode/) 和 [`stacks/mcode-content`](stacks/mcode-content/)。

## 参与贡献

欢迎开 issue 讨论。代码、文档和 stack 的 PR，目前只收仓库协作者的。还不是协作者的话，先[开一个 issue](https://github.com/zhongbiran/mcode-stack/issues/new/choose) 把想法说清楚。

我们很想知道你用 MiniMax Code（或者别的 agent）每天到底怎么干活，写在 issue 里就行。协作者要把一份 stack 放进仓库，按这几步：

1. 从 `templates/stack-template/` 复制一份到 `community/<你的 id>/`
2. 写一份 `WORKFLOW.md`：你每天怎么用 agent，哪些环节交给它，哪些自己盯着
3. 至少放一个你真在用的 Skill 或清单
4. 本地跑一遍 `node scripts/check.mjs`，再提 PR，附上校验输出和一段真实的使用记录

详细规则见 [CONTRIBUTING_ZH.md](CONTRIBUTING_ZH.md)。如果你把这里的东西用进了自己的 agent，欢迎开一个「I use this」issue 告诉我们。

## 和 MiniMax Code 的关系

MiniMax Code 本体在 [MiniMax-AI/minimax-code](https://github.com/MiniMax-AI/minimax-code)。这个仓库只放工作流和 Skill，不放 MiniMax Code 的代码。

## License

[MIT](LICENSE)，各 stack 的 `NOTICE.md` 另有说明的除外。`engineering-*` 系列 Skill 改编自 Google Engineering Practices，改编部分仍遵循 CC-BY 3.0，详见 [`stacks/mcode/NOTICE.md`](stacks/mcode/NOTICE.md)。`stacks/mcode-content` 内的第三方 skill `lieflat-less-ai-tone` 遵循 CC BY-NC 4.0（署名-非商业性使用），商业用途需另行取得授权，详见 [`stacks/mcode-content/NOTICE.md`](stacks/mcode-content/NOTICE.md)。
