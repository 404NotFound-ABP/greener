#!/bin/sh
set -e

echo "[Entrypoint] 🔄 Aplicando migrações no banco de dados..."
node migrate.js

echo "[Entrypoint] 🚀 Iniciando aplicação..."
exec "$@"
