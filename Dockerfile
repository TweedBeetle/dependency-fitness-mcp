# Containerized stdio MCP server. Multi-stage: build from source, ship a slim
# runtime. Used for Glama introspection checks and any container-based MCP host.
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json tsconfig.json ./
RUN npm ci
COPY src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# stdio transport: the MCP host speaks JSON-RPC over stdin/stdout.
ENTRYPOINT ["node", "dist/index.js"]
