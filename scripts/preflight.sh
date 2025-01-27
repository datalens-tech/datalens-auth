#!/bin/sh
set -e

echo "Start migration"
npm run db:migrate
echo "Finish migration"

echo "Start creating default user Admin"
node /opt/app/dist/server/db/scripts/preflight/create-default-admin.js
echo "Finish creating default user Admin"

node dist/server
