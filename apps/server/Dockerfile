FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm@12.6.0

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/ packages/
COPY apps/server/ apps/server/

RUN pnpm install
RUN pnpm --filter @cloud-ide/shared build
RUN pnpm --filter @cloud-ide/server prisma:generate
RUN pnpm --filter @cloud-ide/server build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache docker-cli

COPY --from=builder /app /app

EXPOSE 4000
CMD ["node", "apps/server/dist/index.js"]
