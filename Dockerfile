# syntax=docker.io/docker/dockerfile:1

FROM node:18-alpine AS base

RUN apk add --no-cache \
    libc6-compat \
    openssl \
    openssl-dev \
    build-base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY package.json pnpm-lock.yaml prisma ./

RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate

RUN pnpm run build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 4130
ENV PORT=4130
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]