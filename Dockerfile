FROM node:24-alpine AS build

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Upstreams are substituted at container start from these variables, so the
# same image works for the monolith (both -> backend:3000) and the split
# deployment (core-api and multiplayer on different hosts).
ENV CORE_API_UPSTREAM=core-api:3001 \
    MULTIPLAYER_UPSTREAM=multiplayer:3002

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build --chown=101:101 /app/dist /usr/share/nginx/html

USER 101
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
