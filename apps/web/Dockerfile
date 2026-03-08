FROM oven/bun:1.3.9 AS builder

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN bun run -F web build

FROM node:22-alpine

WORKDIR /app/apps/web

COPY --from=builder /app/apps/web/.output /app/apps/web/.output

EXPOSE 3000

CMD ["node", "/app/apps/web/.output/server/index.mjs"]
