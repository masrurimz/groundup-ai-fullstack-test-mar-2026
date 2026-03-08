FROM oven/bun:1.3.9 AS builder

WORKDIR /app

COPY . .

RUN bun install --frozen-lockfile

ARG VITE_SERVER_URL
ENV VITE_SERVER_URL=${VITE_SERVER_URL}

RUN bun run -F web build

FROM oven/bun:1.3.9-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=builder /app/apps/web/.output ./.output

EXPOSE 3000

CMD ["bun", "run", ".output/server/index.mjs"]
