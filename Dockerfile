FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npm run build

FROM node:22-alpine AS runner

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001

RUN npm install -g http-server@14

COPY --from=builder /app/dist ./dist

USER nodeuser

EXPOSE 5173

CMD ["http-server", "-p", "5173", "-a", "0.0.0.0", "-s", "dist"]
