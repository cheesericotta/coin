# Stage 1: Base
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat openssl
COPY package.json package-lock.json ./
# postinstall runs `prisma generate`, so schema must exist at install time
COPY prisma/schema.prisma ./prisma/schema.prisma
RUN npm ci

# Stage 2: Builder
FROM base AS builder
WORKDIR /app
COPY --from=base /app/node_modules ./node_modules
COPY . .
# Generate Prisma Client
RUN npx prisma generate
# Build Next.js
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache openssl

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for runtime setup
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Startup command: run migrations then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
