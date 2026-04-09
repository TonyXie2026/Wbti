# 互联网梗身份测试

一个可直接静态托管的单页前端项目，使用原生 HTML、CSS 和 ES Modules 实现首页、答题页与结果页。

## 项目结构

- `index.html`：站点入口
- `src/`：前端源码与本地 JSON 数据
- `assets/`：站点静态资源，部署后可直接通过 `/assets/...` 访问
- `server.mjs`：仅用于本地预览，不参与线上静态部署

## 本地开发

项目不依赖第三方包，只需要 Node.js。

```bash
npm run dev
```

启动后访问终端输出的地址，默认优先使用：

```text
http://localhost:4173
```

如果 `4173` 已被占用，服务会自动切换到下一个可用端口。

## 代码检查

```bash
npm run check
```

用于做基础语法检查。

## 资源与数据路径

- 入口文件继续使用相对路径引用 `./src/styles.css` 和 `./src/main.js`
- JSON 数据继续从 `./src/data/tags.json` 与 `./src/data/questions.json` 读取
- 所有图片与回退图统一使用站点根路径 `/assets/...`

## 图片说明

标签图片路径来自 `src/data/tags.json`，默认读取：

```text
/assets/characters/*.png
```

如果角色图不存在，页面会自动回退到：

```text
/assets/placeholder-character.png
```

后续只需要把实际角色图放进 `assets/characters/` 即可替换。

## 静态部署

这个项目上线时不依赖 `server.mjs`，把仓库作为普通静态站点托管即可。

- `npm run dev` 只用于本地预览和检查
- 线上平台直接托管项目根目录中的静态文件
- 不需要改成 Vite、React 或其他框架

## 部署到 Vercel

1. 在 Vercel 中导入这个 Git 仓库。
2. Framework Preset 选 `Other`。
3. Build Command 留空。
4. Output Directory 设为项目根目录 `.`。
5. 完成导入后直接部署，站点会按静态文件方式提供服务。

自定义域名绑定：

1. 进入项目的 `Settings` -> `Domains`。
2. 添加你的域名。
3. 按 Vercel 提示在域名 DNS 服务商处配置记录。
4. 等待验证和证书签发完成即可。

参考文档：

- Vercel Builds: https://vercel.com/docs/builds
- Vercel `vercel.json`: https://vercel.com/docs/project-configuration/vercel-json
- Vercel Domains: https://vercel.com/docs/domains
