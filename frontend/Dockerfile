# 1️⃣ 使用更小的 Node.js 版本，减少镜像体积
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/node:18-alpine AS builder

# 2️⃣ 设置工作目录
WORKDIR /usr/src/app

# 3️⃣ 安装 pnpm（Alpine 版需要额外安装 bash）
RUN echo "https://mirrors.aliyun.com/alpine/v3.21/main/" > /etc/apk/repositories && \
    echo "https://mirrors.aliyun.com/alpine/v3.21/community/" >> /etc/apk/repositories && \
    apk add --no-cache bash && npm install -g pnpm

# 4️⃣ 复制 package.json 和 pnpm-lock.yaml，并安装依赖
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# 5️⃣ 复制所有项目代码并进行构建
COPY . .
RUN pnpm build

# 6️⃣ 使用更小的 Nginx 镜像
FROM registry.cn-hangzhou.aliyuncs.com/google_containers/nginx:1.23-alpine

# 7️⃣ 复制前端构建产物到 Nginx 目录
COPY --from=builder /usr/src/app/dist /usr/share/nginx/html

# 8️⃣ 复制优化后的 Nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 9️⃣ 暴露端口并启动 Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
