# Game Frontend

基于 React、TypeScript 和 Vite 的桌游前端，当前包含：

- Acquire（并购）
- DaVinci Code（达芬奇密码）
- Splendor（璀璨宝石）

## 开发

```bash
pnpm install --frozen-lockfile
pnpm dev
```

质量门禁：

```bash
pnpm lint
pnpm test
pnpm build
```

## API 客户端

`src/api/generated` 由固定版本的 PAM IDL 生成并提交到仓库。生成代码由部署直接使用，不在生产构建阶段临时拉取或重新生成。

需要刷新客户端时，先准备相邻的 `pam-generate`，再运行：

```bash
pnpm generate:api
pnpm check:generated
```

不要手工修改生成目录。
