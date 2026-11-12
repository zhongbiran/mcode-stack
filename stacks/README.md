# Stacks

每个目录是一个插件包。装上之后，里面每个 skill 都能单独调。

| Stack | 用途 | 入口 |
|---|---|---|
| [`mcode`](mcode/) | 生命周期工作台：开工、推进、验收、收尾四个阶段，一个入口走完 | `mcode` |
| [`mcode-content`](mcode-content/) | 内容生产：去 AI 味、小红书图文、竖版短视频 | `making-content` |

## 新增一个 stack

1. 取 id：小写字母 + 数字 + 连字符，**同时是目录名和 plugin name**
2. `cp -R templates/stack-template stacks/<id>`
3. 改 `.minimax-plugin/plugin.json`：`name` 填 `<id>`；**description 第一句写「什么时刻调」**
4. 改 `WORKFLOW.md`：第一节固定是「此刻该调哪个 skill」表
5. 每个 skill 目录一个 `SKILL.md`，目录名 = frontmatter `name`
6. 在 `../.claude-plugin/marketplace.json` 与 `../.agents/plugins/marketplace.json` 各加一条
7. 跑 `node ../scripts/check.mjs`
