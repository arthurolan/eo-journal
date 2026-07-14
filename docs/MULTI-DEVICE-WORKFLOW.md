# Mac Studio 与 MacBook 交替工作方法

## 核心原则

GitHub 上的 `main` 分支是两台电脑共用的最新版本。

可以把整个过程理解为：

> 离开前推上去，开工前拉下来。

同一时间只在一台电脑上工作，是避免冲突最简单、最可靠的方法。

## 第一次在 MacBook 上建立项目

1. 在 MacBook 上安装 GitHub Desktop，并登录与当前仓库相同的 GitHub 账户。
2. 选择 **Clone a repository from the Internet**。
3. 选择 `arthurolan/eo-journal`，再选择 MacBook 上的保存位置。
4. 克隆完成后，确认当前分支是 `main`。
5. 打开 `README.md` 和 `HANDOFF.md`，再开始新任务。

克隆只需做一次。以后不要重复克隆，只需在原有项目中拉取最新内容。

## 每次开始工作

1. 确认另一台电脑上的上一次修改已经提交并推送。
2. 打开 GitHub Desktop，选择 `eo-journal` 仓库。
3. 确认当前分支为 `main`，而且没有尚未提交的本地修改。
4. 点击 **Fetch origin**；如果出现 **Pull origin**，继续点击它。
5. 阅读 `HANDOFF.md`，确认是否有上一台电脑留下的未完成任务。
6. 现在才打开 Codex，进入这个项目开始工作。

在新的 Codex 任务中，可以直接说：

> 请先阅读 AGENTS.md、README.md、HANDOFF.md 和最近的 Git 提交，然后再继续工作。

## 每次结束工作

1. 检查网页效果和受影响的页面。
2. 如果任务尚未完成且准备换电脑，更新 `HANDOFF.md`。
3. 在 GitHub Desktop 中查看本次变更，写一条简洁明确的 Summary。
4. 点击 **Commit to main**。
5. 点击 **Push origin**。
6. 确认 GitHub Desktop 不再显示待推送的提交，再关闭电脑或换到另一台电脑。

只点击 Commit 而没有点击 Push，另一台电脑仍然看不到这次修改。

## 未完成工作如何交接

首选做法是在换电脑前，把当前工作整理到一个可靠状态，再提交和推送。

如果工作确实没有完成：

1. 在 `HANDOFF.md` 中写明已完成部分、下一步和已知问题。
2. 确保当前文件至少能正常打开，不要把明知已损坏的版本当成交接点。
3. 使用明确的提交说明，例如“保存摄影页改版的阶段进度”。
4. 推送到 GitHub，然后再在另一台电脑拉取。

## 出现异常时

如果看到以下情况，先停止修改：

- GitHub Desktop 显示既有本地修改，又有需要拉取的远程修改。
- 出现 `conflict`、`merge conflict` 或无法推送。
- 不确定哪台电脑上的版本更新。
- 同一文件已在两台电脑分别修改。

不要选择强制推送，不要随意丢弃任何一边的修改。将 GitHub Desktop 中看到的提示交给 Codex 检查，再决定如何合并。

## 对话与项目记录的分工

- Codex 对话用于当时的讨论和协作。
- `AGENTS.md` 保存长期规则。
- `HANDOFF.md` 保存当前未完成状态。
- Git 提交保存已完成的项目历史。

这样即使另一台电脑上没有旧对话，Codex 仍可从仓库中读取项目原则、已完成历史和当前交接状态。
