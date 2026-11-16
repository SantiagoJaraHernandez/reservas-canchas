# ---------- Etapa 1: build de React/Vite ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# HARDENING: instalacion reproducible desde package-lock y sin scripts de terceros
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Etapa 2: nginx sin privilegios (usuario nginx, puerto 8080) ----------
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
