FROM node:24-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates openssl \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && install -d -o node -g node /app

WORKDIR /app
ENV HUSKY=0

COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY --chown=node:node apps/api apps/api
COPY --chown=node:node packages/db packages/db
COPY --chown=node:node packages/shared packages/shared
COPY --chown=node:node tools/content-sync tools/content-sync

USER node
RUN pnpm install --frozen-lockfile --config.full-metadata=true \
    && pnpm -r --filter @prograds/api... build

ENV NODE_ENV=production
EXPOSE 8088
CMD ["node", "apps/api/dist/main.js"]
