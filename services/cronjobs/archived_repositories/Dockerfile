ARG NODE_VERSION=24
ARG PNPM_VERSION=10.14.0
ARG PNPM_CACHE_DIR=/tmp/archived-repositories-cronjob-pnpm-cache

## Builder stage
FROM node:${NODE_VERSION}-alpine AS builder
ARG PNPM_VERSION
ARG PNPM_CACHE_DIR

RUN npm install -g corepack@latest && \
    corepack enable pnpm && \
    corepack prepare pnpm@${PNPM_VERSION} --activate

WORKDIR /build

# Only copy the necessary files to avoid invalidating the Docker layer cache if one of the other files changes (source
# code changes much more often than dependencies)
COPY package.json pnpm-lock.yaml ./

# Pre-fetch dependencies and use a Docker cache mount for pnpm to speed up subsequent builds
RUN --mount=type=cache,id=pnpm,target=${PNPM_CACHE_DIR} pnpm config set store-dir ${PNPM_CACHE_DIR} && \
    pnpm fetch --frozen-lockfile

COPY ./ /build

RUN --mount=type=cache,id=pnpm,target=${PNPM_CACHE_DIR} pnpm config set store-dir ${PNPM_CACHE_DIR} && \
    pnpm install --frozen-lockfile --ignore-workspace && \
    pnpm build

# Clean install of production dependencies only
RUN --mount=type=cache,id=pnpm,target=${PNPM_CACHE_DIR} pnpm config set store-dir ${PNPM_CACHE_DIR} && \
    rm -rf node_modules && \
    pnpm install --prod --frozen-lockfile --ignore-workspace


## Runner stage
FROM node:${NODE_VERSION}-alpine AS runner
ARG PNPM_VERSION
WORKDIR /app

# Add non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder --chown=nodejs:nodejs /build/dist /app
COPY --from=builder --chown=nodejs:nodejs /build/node_modules /app/node_modules

# Switch to non-root user
USER nodejs

# Set NODE_ENV
ENV NODE_ENV=production
