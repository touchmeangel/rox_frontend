# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runtime
WORKDIR /app

RUN npm install --global --omit=dev sirv-cli@2

COPY --from=build --chown=node:node /app/dist ./dist
RUN mv ./dist/config.js ./dist/config.js.template

USER node
EXPOSE 8080
ENV PORT=8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- "http://127.0.0.1:${PORT}/" || exit 1

ENTRYPOINT ["sh", "-c", "test -n \"$API_BASE_URL\" && sed \"s#__VITE_API_BASE_URL__#${API_BASE_URL}#g\" dist/config.js.template > dist/config.js && exec sirv-cli dist --single --etag --host 0.0.0.0 --port ${PORT}"]