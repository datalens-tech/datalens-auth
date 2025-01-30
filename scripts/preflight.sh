#!/bin/sh
set -e

if [ "$SKIP_INSTALL_DB_EXTENSIONS" = "1" ]; then
    echo 'Skip extensions setting up'
else
    echo "Start setting up extensions"
    node /opt/app/dist/server/db/scripts/preflight/extensions.js
    echo "Finish setting up extensions"
fi

echo "Start migration"
npm run db:migrate
echo "Finish migration"

echo "Start creating default user Admin"
node /opt/app/dist/server/db/scripts/preflight/create-default-admin.js
echo "Finish creating default user Admin"

node dist/server
