# Frontend (repo root) — static SPA served by nginx.
#
# VITE_API_BASE_URL is inlined into the JS bundle at BUILD time, not read at
# container runtime (see DEPLOYMENT.md) — it MUST be passed as a --build-arg
# pointing at the backend's real, publicly-reachable URL:
#
#   docker build -t formiq-frontend \
#     --build-arg VITE_API_BASE_URL=http://20.224.2.229:4001 .
#
# Rebuilding the image is the only way to change it — setting the env var on
# `docker run` (or in a compose file) after the fact does nothing.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build --workspace=packages/shared && npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
