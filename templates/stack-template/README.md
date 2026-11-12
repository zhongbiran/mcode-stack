# <栈名>

<一句话：这个 stack 解决什么问题，什么时候用。>

## 包含什么

- 入口 skill：`/<name>` —— 判定阶段 + 编排 + 派 agent 表
- `scripts/` —— 确定性部分（秒级、零 token）
- `templates/` —— 骨架模板
- 其余 skill：具体手法，按阶段归位

## 安装

```bash
cp -R stacks/<name> ~/.minimax/plugins/
# 然后在 MCode 的 /plugins 面板按 Ctrl+R 刷新
```

> 插件目录**不热加载**：复制后必须刷新或重开会话。
> 更省事：把 `skills/*` 复制到 `~/.agents/skills/`，新会话立即可用。

## 署名与许可

<原作者与第三方素材的署名；改编自 Google Engineering Practices 的要指明 CC-BY 3.0>
