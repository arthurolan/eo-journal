# E.O图文

E.O图文是 Olan 长期维护的个人图文网站，主要收录摄影作品、旅行记录、文字作品与 AI 工坊实践。

网站采用纯静态网页。GitHub `main` 保存源代码、版本历史和两台电脑之间的同步基准；正式站点由 Cloudflare Workers Static Assets 发布在 `https://eomoment.com`，公开图片由 Cloudflare R2 通过 `https://media.eomoment.com` 提供。

GitHub Pages 目前仅保留为旧地址的过渡入口，会跳转到正式域名，不再是正式发布渠道。

## 当前发布方式

本地项目是唯一编辑源。正常更新流程为：

1. 在本地修改并检查网页、文字、样式和图片引用。
2. 提交并推送到 GitHub `main`，保存可追溯的源文件与历史。
3. 如有公开图片更新，先将准备好的 WebP（及仍被直接引用的少数 JPG）上传到 R2 桶 `eomoment-media`。
4. 生成 Cloudflare 静态部署副本并部署 Worker `eo-journal-site`。
5. 在 `eomoment.com` 核验页面、图片和控制台。

`.cloudflare-static/` 和 `.cloudflare-media/` 都是本地临时生成的发布目录，不提交到 Git。不要直接在 Cloudflare 中修改网页内容；那会与 GitHub 源文件脱节，并在下一次部署时被覆盖。

## 项目文档

- `AGENTS.md`：网站长期原则和 AI 协作规则。
- `HANDOFF.md`：两台电脑之间的临时交接状态。
- `docs/MULTI-DEVICE-WORKFLOW.md`：Mac Studio 与 MacBook 交替工作的操作方法。
- Git 提交记录：已完成修改的时间线和原因。

## 网站页面

- `index.html`：首页
- `photography.html`：摄影
- `travel.html`：旅行
- `reading.html`：文字
- `tools.html`：AI工坊
- `about.html`：关于

## 换电脑继续工作

在一台电脑离开前，完成“检查、提交、推送”；换到另一台电脑后，完成“拉取、阅读交接、再开始”。

不要在两台电脑上同时修改同一项内容。详细步骤见 `docs/MULTI-DEVICE-WORKFLOW.md`。
