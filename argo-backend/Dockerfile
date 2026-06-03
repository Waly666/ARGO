FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@11.2.2

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod --network-concurrency 2

COPY src ./src

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "src/server.js"]
