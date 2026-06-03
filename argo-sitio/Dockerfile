FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g pnpm@11.2.2

ENV NODE_OPTIONS=--max-old-space-size=3072

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --network-concurrency 2

COPY . .
RUN pnpm run build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/argo-sitio/browser /usr/share/nginx/html

EXPOSE 80
