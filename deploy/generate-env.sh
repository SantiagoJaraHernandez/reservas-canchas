#!/usr/bin/env sh
# Genera el archivo .env con secretos aleatorios y fuertes (una sola vez).
# Uso: ./deploy/generate-env.sh [SITE_ADDRESS] [ADMIN_EMAIL]
#   Local:  ./deploy/generate-env.sh
#   Nube:   ./deploy/generate-env.sh 3-90-1-2.sslip.io admin@reservas.local
set -eu
cd "$(dirname "$0")/.."
if [ -f .env ]; then
  echo ".env ya existe; no se sobrescribe." >&2
  exit 0
fi
rnd() { openssl rand -hex "$1"; }
SITE="${1:-http://localhost}"
ADMIN="${2:-admin@reservas.local}"
ADMIN_PASS="Adm-$(rnd 9)!"
umask 077
cat > .env <<ENV
SITE_ADDRESS=${SITE}
JWT_SECRET=$(rnd 48)
INTERNAL_TOKEN=$(rnd 32)
POSTGRES_USER=reservas
POSTGRES_PASSWORD=$(rnd 24)
MONGO_ROOT_USER=root
MONGO_ROOT_PASSWORD=$(rnd 24)
MONGO_APP_USER=authapp
MONGO_APP_PASSWORD=$(rnd 24)
ADMIN_EMAIL=${ADMIN}
ADMIN_PASSWORD=${ADMIN_PASS}
AUTH_RATE_LIMIT=10
API_RATE_LIMIT=120
ENV
chmod 600 .env
echo "Creado .env (permisos 600)."
echo "Administrador inicial: ${ADMIN} / ${ADMIN_PASS}"
