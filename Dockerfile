FROM node:20-alpine

WORKDIR /app

# Copy gallery-server
COPY gallery-server/package*.json ./
RUN npm install

COPY gallery-server/ ./
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/index.js"]
