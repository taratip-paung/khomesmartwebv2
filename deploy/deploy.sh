#!/usr/bin/env bash
# Deploy beconnectedcm.com to CT 1320 — run from the Mac inside khome-smart-web/:
#   ./deploy/deploy.sh
# Builds locally, ships dist/ + contact backend, installs nginx + systemd on first run, restarts services.
# server/.env is uploaded ONLY if the server has none (secrets stay out of git).
set -euo pipefail
HOST="${HOST:-root@10.10.13.20}"
DEST=/var/www/beconnected-web
cd "$(dirname "$0")/.."

echo "▸ build"
npm run build --silent

echo "▸ upload → $HOST:$DEST"
ssh "$HOST" "mkdir -p $DEST/dist $DEST/server $DEST/src/lib"
export COPYFILE_DISABLE=1
tar --no-xattrs --no-mac-metadata -C . -czf - dist server/contact-server.mjs server/khome-contact.service src/lib/contactRules.js package.json deploy/nginx-beconnected.conf \
  | ssh "$HOST" "rm -rf $DEST/dist && tar -C $DEST -xzf -"
if ! ssh "$HOST" "test -f $DEST/server/.env"; then
  [ -f server/.env ] || { echo "!! server/.env missing locally and on server"; exit 1; }
  echo "▸ first run: uploading server/.env"
  scp -q server/.env "$HOST:$DEST/server/.env"
fi

echo "▸ install + restart"
ssh "$HOST" bash -s <<REMOTE
set -e
chown -R www-data:www-data $DEST
chmod 600 $DEST/server/.env
cp $DEST/server/khome-contact.service /etc/systemd/system/khome-contact.service
cp $DEST/deploy/nginx-beconnected.conf /etc/nginx/sites-available/beconnected
ln -sf /etc/nginx/sites-available/beconnected /etc/nginx/sites-enabled/beconnected
rm -f /etc/nginx/sites-enabled/default
nginx -t -q
systemctl daemon-reload
systemctl enable -q khome-contact
systemctl restart khome-contact
systemctl reload nginx
sleep 1
systemctl is-active khome-contact
curl -sf http://127.0.0.1/api/health && echo
curl -sI http://127.0.0.1/ | head -1
REMOTE
echo "✓ deployed"
