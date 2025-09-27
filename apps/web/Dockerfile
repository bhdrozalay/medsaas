# Web uygulaması için Dockerfile
FROM node:20-alpine AS base

# Dependencies stage
FROM base AS deps
WORKDIR /app

# Monorepo için gerekli dosyaları kopyala
COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/package*.json ./apps/web/

# Dependencies yükle
RUN npm install && npm cache clean --force

# Builder stage
FROM base AS builder
WORKDIR /app

# Install OpenSSL
RUN apk add --no-cache openssl

COPY package*.json ./
COPY turbo.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Build dependencies yükle
RUN npm install

# Prisma generate ve build
WORKDIR /app/apps/web
ENV PRISMA_SCHEMA_PATH=/app/packages/database/prisma/schema.prisma
RUN npx prisma generate --schema=/app/packages/database/prisma/schema.prisma
RUN npm run build

# Runtime stage
FROM base AS runner
WORKDIR /app

# Non-root kullanıcı oluştur
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Gerekli dosyaları kopyala
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/apps/web/src ./src
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]