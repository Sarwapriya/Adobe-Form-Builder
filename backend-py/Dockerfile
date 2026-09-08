# Python (FastAPI) port of backend/Dockerfile's multi-stage intent.
# Build from the repo root:  docker build -f backend-py/Dockerfile -t formbuilder-backend-py .
# Run:                       docker run -p 4001:4001 --env-file backend-py/.env -v $(pwd)/backend-py/uploads:/app/uploads formbuilder-backend-py
#
# Requires the "ODBC Driver 17 for SQL Server" + unixODBC to be present for
# pyodbc to connect to SQL Server — installed via Microsoft's apt repo in the
# builder stage and copied forward (its .so files + odbcinst.ini) into the
# slim runtime stage, the same "install once, copy artifacts" shape as the
# Node Dockerfile's own build/runtime split.

FROM python:3.12-slim AS build
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg apt-transport-https ca-certificates gcc g++ unixodbc-dev \
    && curl https://packages.microsoft.com/keys/microsoft.asc | tee /etc/apt/trusted.gpg.d/microsoft.asc \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && rm -rf /var/lib/apt/lists/*

COPY backend-py/pyproject.toml ./pyproject.toml
RUN pip install --no-cache-dir --prefix=/install .

COPY backend-py/app ./app

FROM python:3.12-slim
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gnupg apt-transport-https ca-certificates unixodbc \
    && curl https://packages.microsoft.com/keys/microsoft.asc | tee /etc/apt/trusted.gpg.d/microsoft.asc \
    && curl https://packages.microsoft.com/config/debian/12/prod.list > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql17 \
    && apt-get purge -y curl gnupg apt-transport-https \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /install /usr/local
COPY backend-py/app ./app

ENV UPLOAD_DIR=/app/uploads
VOLUME ["/app/uploads"]
EXPOSE 4001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4001"]
