# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source & compile
COPY . .
RUN npm run build

# Stage 2: runtime
FROM node:18-alpine
WORKDIR /app

# Copy built app and prod deps
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
RUN npm ci --production

# Copy SSL certs & scripts if needed
COPY --from=builder /app/ssl ./ssl

# Copy compiled config files into /app/config
COPY --from=builder /app/dist/config ./config

# Copy compiled src folder so config/settings.js can require '../src/env'
COPY --from=builder /app/dist/src ./src

# Expose ports
EXPOSE 8080 8443

# Run proxy
CMD ["node", "dist/proxy.js"]
