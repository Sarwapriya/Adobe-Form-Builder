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

# node:20-bookworm-slim (glibc), not alpine — and `npm install`, not `npm ci`
# with the committed package-lock.json. That lockfile was generated on
# Windows; npm's optional-dependency resolution (npm/cli#4828) then omits the
# Linux-only native rollup binary (@rollup/rollup-linux-x64-gnu/musl) from a
# strict `npm ci` install, failing the build with "Cannot find module
# @rollup/rollup-linux-x64-*". `npm install` re-resolves optional deps for the
# platform actually running the build instead of trusting the lockfile's.
FROM node:20-bookworm-slim AS build
WORKDIR /app

COPY package.json ./
COPY packages ./packages
RUN npm install --include=optional

COPY . .

ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
