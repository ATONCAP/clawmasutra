FROM node:20-alpine AS builder

WORKDIR /app

# Copy full monorepo for workspace support
COPY package.json ./
COPY dapp/package.json dapp/package-lock.json* ./dapp/

# Install dependencies using workspaces
RUN npm install --workspace=dapp

# Copy dapp source
COPY dapp/ ./dapp/

# Build the dapp
RUN npm run build --workspace=dapp

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package.json files for npm workspace commands
COPY package.json ./
COPY dapp/package.json ./dapp/

# Install serve in dapp workspace
RUN cd dapp && npm install serve --save

# Copy built files from builder
COPY --from=builder /app/dapp/dist ./dapp/dist

# Expose port
EXPOSE 3000

# The start command from Railway: npm run dev --workspace=dapp
# We need to make sure dapp/package.json has a "dev" script that serves
