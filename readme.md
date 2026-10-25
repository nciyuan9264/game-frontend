# Game Frontend

基于 React、TypeScript 和 Vite 的桌游前端，当前包含：

- Acquire（并购）
- DaVinci Code（达芬奇密码）
- Splendor（璀璨宝石）
- YINSH（圈套棋）
- Othello（黑白棋）

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

真实浏览器回归：

```bash
pnpm exec playwright install chromium
pnpm test:e2e

REGRESSION_ACCESS_TOKEN=... \
REGRESSION_FRONTEND_URL=https://board.gamebus.online \
REGRESSION_HTTP_BASE=https://api.gamebus.online/pam-api \
pnpm test:e2e:production
```

浏览器测试固定单 worker，private room 通过 API 创建和关闭，token 只从环境注入
HttpOnly Cookie 和 Authorization header。生产模式不重试有业务副作用的测试。

## API 客户端

`src/api/generated` 由固定版本的 PAM IDL 生成并提交到仓库。生成代码由部署直接使用，不在生产构建阶段临时拉取或重新生成。

需要刷新客户端时，先准备相邻的 `pam-generate`，再运行：

```bash
pnpm generate:api
pnpm check:generated
```

不要手工修改生成目录。
