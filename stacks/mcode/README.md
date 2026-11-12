# mcode —— MCode 生命周期工作台

一个插件，一个入口。敲 `/mcode`，走完**开工 → 推进 → 验收 → 收尾**。

## 为什么是这一个入口

原来 27 个 skill 按作者分包（ronny / req-tpm / jiachen），调用时机全靠读 description 猜，每个新项目开工要手动调 7-8 个才能把项目配置好。现在合成一个入口：
- 入口先**判定阶段**，再按阶段编排；
- 每个阶段**指定 agent**，agent 绑定不同模型，调用谁 = 花哪一份额度；
- 难度分派：高难度给 `worker`（主额度池），中低难度给 `deputy`（免费档，零额度消耗）。

## 包含什么

- 入口 `mcode`：阶段判定 + 四阶段编排 + 派 agent 表 + 难度分派规则
- `scripts/scaffold-project.mjs`：确定性脚手架（探测技术栈 → 生成 AGENTS.md / 验收入口 / 需求骨架），幂等，输出 JSON 摘要
- `templates/`：AGENTS.md、verify.ps1、verify.sh、REQ 文档的骨架
- 26 个内部 skill：原 ronny / req-tpm / jiachen 的方法论，按阶段归位
- `checklists/`：5 份纯文本检查清单
- `NOTICE.md`：`engineering-*` 系列的第三方署名（CC-BY 3.0）

## 安装

```bash
cp -R stacks/mcode ~/.minimax/plugins/
cp -R stacks/mcode-content ~/.minimax/plugins/
# 然后在 MCode 的 /plugins 面板按 Ctrl+R 刷新
```

> 插件目录**不热加载**：复制后必须刷新或重开会话。
> 更省事的办法：把 `stacks/mcode/skills/*` 直接复制到 `~/.agents/skills/`，新会话立即可用。

## 署名与许可

本 stack 由上游 `ronny`、`req-tpm`、`jiachen` 三个 stack 重组而成，方法论正文来自原作者。
`engineering-*` 系列改编自 [Google Engineering Practices](https://google.github.io/eng-practices/)（CC-BY 3.0），见 [NOTICE.md](NOTICE.md)。
其余 MIT。内容生产栈 `making-content` 由 Jiachen 撰写。
