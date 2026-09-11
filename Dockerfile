# Frontend (repo root) — static SPA served by nginx, which also reverse-
# proxies /api/ to the backend container (see nginx.conf) so the browser only
# ever talks to ONE port — this one. Leave VITE_API_BASE_URL unset (the
# default): every API call is then a relative /api/... URL, resolved by
# nginx, not baked to a specific backend host/port at build time. Only pass
# --build-arg VITE_API_BASE_URL=... if the backend is deployed on a genuinely
# separate host from this frontend (no shared nginx to proxy through) — in
# that case it's inlined into the JS bundle at BUILD time (Vite convention),
# so rebuilding the image is the only way to change it.

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
