# =============================================================================
# Policy-0 Multi-stage Dockerfile
# =============================================================================
# Stage 1: Build frontend + server
# Stage 2: Production runtime (minimal, non-root)

# -----------------------------------------------------------------------------
# Build Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite)
RUN npm run build

# Build server (esbuild)
RUN npx esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs

# Verify builds
RUN node --check dist/server.cjs

# -----------------------------------------------------------------------------
# Production Stage
# -----------------------------------------------------------------------------
FROM node:20-alpine AS runner

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    curl \
    tini

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S -u 1001 -G nodejs policy0

WORKDIR /app

# Copy built artifacts from builder
COPY --from=builder --chown=policy0:nodejs /app/dist ./dist
COPY --from=builder --chown=policy0:nodejs /app/server/data ./server/data
COPY --from=builder --chown=policy0:nodejs /app/exports ./exports
COPY --from=builder --chown=policy0:nodejs /app/uploads ./uploads
COPY --from=builder --chown=policy0:nodejs /app/data ./data
COPY --from=builder --chown=policy0:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=policy0:policy0 /app/package*.json ./

# Create required directories with correct permissions
RUN mkdir -p /app/data /app/exports /app/uploads /app/server/data && \
    chown -R policy0:nodejs /app/data /app/exports /app/uploads /app/server/data

# Switch to non-root user
USER policy0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use tini as init for proper signal handling
ENTRYPOINT ["tini", "--"]

# Start server
CMD ["node", "dist/server.cjs"]

# -----------------------------------------------------------------------------
# Build Arguments & Labels
# -----------------------------------------------------------------------------
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.opencontainers.image.title="Policy-0 Studio" \
      org.opencontainers.image.description="Robotics policy generation platform with NVIDIA stack integration" \
      org.opencontainers.image.version="${VERSION}" \
      org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.vendor="Policy-0" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/policy0/policy0" \
      org.opencontainers.image.documentation="https://github.com/policy0/policy0#readme"