# Backend Dockerfile
FROM node:20-alpine AS builder

# Cache buster for migrations
ARG CACHEBUST=1

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl openssl-dev

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci

# Copy prisma folder (including migrations) - after CACHEBUST to invalidate cache
COPY backend/prisma ./prisma/
COPY backend/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY backend/ .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install OpenSSL for Prisma runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy prisma folder (including migrations) from context
COPY backend/prisma ./prisma/

# Generate Prisma client for production
RUN npx prisma generate

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/api/health || exit 1

# Start command
CMD ["npm", "start"]
