# ADELE - AI-Powered No-Code Application Builder
# Production Dockerfile for AWS EC2 deployment
# Converts Cloudflare Worker to Node.js Express server

# Stage 1: Build the frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies
RUN pnpm install --frozen-lockfile 2>/dev/null || pnpm install

# Copy source code
COPY . .

# Build the frontend
RUN pnpm run build

# Stage 2: Production image
FROM node:20-alpine AS production

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache curl openssl postgresql-client && \
    npm install -g pnpm

# Create app directory structure
RUN mkdir -p /app/dist /app/server

# Copy package files
COPY package.json ./

# Install production dependencies plus server requirements
RUN pnpm install --prod 2>/dev/null || npm install --production
RUN npm install express cors helmet compression pg drizzle-orm jsonwebtoken bcryptjs dotenv

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server ./server

# Copy drizzle schema
COPY drizzle ./drizzle

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S adele -u 1001 -G nodejs && \
    chown -R adele:nodejs /app

USER adele

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server/index.js"]
