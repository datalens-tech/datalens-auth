#!/bin/sh
set -e

echo "Start migration"
npm run db:migrate
echo "Finish migration"

node dist/server
