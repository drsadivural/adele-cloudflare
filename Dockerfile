# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install
COPY . .
RUN pnpm run build

# Stage 2: Production runtime
FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache curl openssl postgresql-client
RUN npm install -g pnpm

# Copy manifests first (better caching)
COPY package.json pnpm-lock.yaml* ./

# IMPORTANT: install ALL deps so runtime modules like dotenv exist
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy built assets + server
COPY --from=frontend-builder /app/dist ./dist
COPY server ./server
COPY drizzle ./drizzle

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.cjs"]

