#!/bin/sh
set -e

if [ "${SKIP_INSTALL_DB_EXTENSIONS}" = "1" ]; then
    echo '{"level":"INFO","msg":"Skip extensions setting up"}'
else
    echo '{"level":"INFO","msg":"Start setting up extensions"}'
    node /opt/app/dist/server/db/scripts/preflight/extensions.js
    echo '{"level":"INFO","msg":"Finish setting up extensions"}'
fi

echo '{"level":"INFO","msg":"Start migration"}'
npm run db:migrate
echo '{"level":"INFO","msg":"Finish migration"}'

echo '{"level":"INFO","msg":"Start creating default user Admin"}'
node /opt/app/dist/server/db/scripts/preflight/create-default-admin.js
echo '{"level":"INFO","msg":"Finish creating default user Admin"}'

exec 'node' 'dist/server'
