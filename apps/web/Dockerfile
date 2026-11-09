FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@12.6.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ packages/
COPY apps/web/ apps/web/

RUN pnpm install
RUN pnpm --filter @cloud-ide/shared build
RUN pnpm --filter @cloud-ide/web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app

EXPOSE 3000
CMD ["pnpm", "--filter", "@cloud-ide/web", "start"]
