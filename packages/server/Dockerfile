FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace config
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

# Install all deps (need shared + server)
RUN npm ci --workspace=packages/shared --workspace=packages/server --include-workspace-root

# Copy source
COPY packages/shared/ packages/shared/
COPY packages/server/ packages/server/
COPY tsconfig.base.json ./

# Build shared first, then server
RUN npm run build --workspace=packages/shared
RUN npm run build --workspace=packages/server

# --- Production stage ---
FROM node:20-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/server/package.json packages/server/

RUN npm ci --workspace=packages/shared --workspace=packages/server --include-workspace-root --omit=dev

# Copy built files
COPY --from=builder /app/packages/shared/dist packages/shared/dist
COPY --from=builder /app/packages/server/dist packages/server/dist

EXPOSE 3001

CMD ["node", "packages/server/dist/index.js"]
