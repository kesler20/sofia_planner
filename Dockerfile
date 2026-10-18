FROM node:22-alpine
RUN npm install -g pnpm@9.12.0
WORKDIR /app
COPY backend/package.json backend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY backend/src ./src
COPY backend/tsconfig.json ./tsconfig.json
RUN pnpm build && pnpm prune --prod
EXPOSE 3000
CMD ["node", "dist/server.js"]
