FROM node:20-alpine AS builder

WORKDIR /app

# Copy just the dapp package files
COPY dapp/package.json dapp/package-lock.json* ./

# Install dependencies
RUN npm install

# Copy dapp source
COPY dapp/ ./

# Build the dapp
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway uses PORT env var)
EXPOSE 3000

# Serve the static files
CMD ["serve", "-s", "dist", "-l", "3000"]
