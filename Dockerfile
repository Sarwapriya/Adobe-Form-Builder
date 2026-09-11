# Frontend (repo root) — static SPA served by nginx, which also reverse-
# proxies /api/ to the backend container (see nginx.conf.template) so the
# browser only ever talks to ONE port — this one.
#
# SUBPATH controls whether this app is served from the domain root (default,
# e.g. http://20.224.2.229:8080/) or from underneath a path prefix on a
# shared multi-project hub (e.g. https://ax-hub.samsung.com/formiq/) — pass
# `--build-arg SUBPATH=/formiq` for the latter. It drives three things at
# once: Vite's `base` (so built asset URLs are correctly prefixed),
# VITE_API_BASE_URL (so API calls go to <prefix>/api/... instead of /api/...),
# and nginx's own location blocks (see nginx.conf.template). Baked in at BUILD
# time — rebuilding the image is the only way to change it.

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

RUN npm run build --workspace=packages/shared && npx tsc -b

ARG SUBPATH=""
ENV VITE_API_BASE_URL=${SUBPATH}
RUN npx vite build --base="${SUBPATH}/"

FROM nginx:alpine
ARG SUBPATH=""
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /tmp/nginx.conf.template
RUN sed "s#__SUBPATH__#${SUBPATH}#g" /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf \
    && rm /tmp/nginx.conf.template
EXPOSE 80
