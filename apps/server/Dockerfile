FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@10.17.0 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml tsconfig.base.json ./
COPY apps/server/package.json apps/server/
COPY packages/shared/package.json packages/shared/

RUN pnpm install --frozen-lockfile --filter "@dm/server..." --filter "@dm/shared..."

COPY packages/shared packages/shared
COPY apps/server apps/server

WORKDIR /app/apps/server

ENV NODE_ENV=production
EXPOSE 4000

CMD ["sh", "-c", "pnpm exec drizzle-kit migrate && node --import tsx/esm src/index.ts"]
