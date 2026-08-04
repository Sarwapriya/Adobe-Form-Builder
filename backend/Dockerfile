# Simple manual-deploy image for the FormBuilder backend.
# Build from the repo root:  docker build -f backend/Dockerfile -t formbuilder-backend .
# Run:                       docker run -p 4000:4000 --env-file backend/.env -v $(pwd)/backend/uploads:/app/backend/uploads formbuilder-backend
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=backend --workspace=packages/shared
COPY packages/shared packages/shared
RUN npm run build --workspace=packages/shared
COPY backend backend
RUN npm run build --workspace=backend

FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci --workspace=backend --workspace=packages/shared --omit=dev
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/packages/shared/dist packages/shared/dist
COPY backend/sql backend/sql

ENV UPLOAD_DIR=/app/backend/uploads
VOLUME ["/app/backend/uploads"]
EXPOSE 4000

CMD ["node", "backend/dist/index.js"]
