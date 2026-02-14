FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/client/package.json packages/client/

# Install deps
RUN npm ci --workspace=packages/shared --workspace=packages/client --include-workspace-root

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/client/ packages/client/
COPY tsconfig.base.json ./

# Build shared types first, then client
RUN npm run build --workspace=packages/shared
RUN npx --workspace=packages/client vite build

# --- Output stage: just copy the built files to /output volume ---
FROM alpine:3.19
COPY --from=builder /app/packages/client/dist /dist
CMD ["cp", "-r", "/dist/.", "/output/"]
