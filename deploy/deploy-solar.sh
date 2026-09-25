#!/usr/bin/env bash
# Deploy the Solar Builder backend to CT 1330 (beconnected-solar, 10.10.13.30) — run from the Mac:
#   cd ~/Documents/Claude/Projects/KHOME\ SMART\ WEB/khome-smart-web && ./deploy/deploy-solar.sh
# Tests first (engine + backend) → ships code → npm ci on the CT → installs systemd unit → restarts → health check.
# /opt/beconnected-solar/solar.env is created ONLY on first deploy, from SOLAR_SERVER_KEY in .env.local.
# The frontend (/solar page) still deploys with ./deploy/deploy.sh (CT 1320).
set -euo pipefail
HOST="${HOST:-root@10.10.13.30}"
DEST=/opt/beconnected-solar
cd "$(dirname "$0")/.."

echo "▸ tests"
npm run --silent test:solar
[ -d solar-server/node_modules ] || (cd solar-server && npm ci --silent)
(cd solar-server && npm test --silent)

echo "▸ upload → $HOST:$DEST/app"
export COPYFILE_DISABLE=1
tar --no-xattrs --no-mac-metadata -C . -czf - \
  package.json src/lib/solar/insights.js src/lib/solar/dailyLimit.js \
  solar-server/package.json solar-server/package-lock.json solar-server/src solar-server/migrations solar-server/deploy \
  | ssh "$HOST" "rm -rf $DEST/app.new && mkdir -p $DEST/app.new && tar -C $DEST/app.new -xzf -"

if ! ssh "$HOST" "test -f $DEST/solar.env"; then
  KEY=$(grep -E '^SOLAR_SERVER_KEY=' .env.local | head -1 | cut -d= -f2- | tr -d '"'"'"' ')
  [ -n "$KEY" ] || { echo "!! SOLAR_SERVER_KEY missing in .env.local"; exit 1; }
  echo "▸ first run: creating $DEST/solar.env (key from .env.local)"
  { sed '/^SOLAR_SERVER_KEY=/d' solar-server/deploy/solar.env.example; echo "SOLAR_SERVER_KEY=$KEY"; } \
    | ssh "$HOST" "umask 077 && cat > $DEST/solar.env && chown root:root $DEST/solar.env"
fi

# S2.5 alerts: copy the contact-form bot token + chat id once (same bot, same group)
if ! ssh "$HOST" "grep -q '^TELEGRAM_BOT_TOKEN=.' $DEST/solar.env"; then
  if [ -f server/.env ] && grep -q '^TELEGRAM_BOT_TOKEN=.' server/.env; then
    echo "▸ adding Telegram alert settings to solar.env (from server/.env)"
    grep -E '^TELEGRAM_(BOT_TOKEN|CHAT_ID)=' server/.env | ssh "$HOST" "cat >> $DEST/solar.env"
  else
    echo "!! server/.env has no TELEGRAM_BOT_TOKEN — backend alerts stay off"
  fi
fi

echo "▸ install + restart"
ssh "$HOST" bash -s <<REMOTE
set -e
cd $DEST/app.new/solar-server
npm ci --omit=dev --ignore-scripts --no-audit --no-fund --silent
chown -R root:root $DEST/app.new && chmod -R a+rX,go-w $DEST/app.new
rm -rf $DEST/app.old && { [ -d $DEST/app ] && mv $DEST/app $DEST/app.old || true; } && mv $DEST/app.new $DEST/app
chmod 600 $DEST/solar.env
cp $DEST/app/solar-server/deploy/solar-server.service /etc/systemd/system/solar-server.service
systemctl daemon-reload
systemctl enable -q solar-server
systemctl restart solar-server
sleep 2
systemctl is-active solar-server || { journalctl -u solar-server -n 30 --no-pager; exit 1; }
curl -sf http://127.0.0.1:8790/api/solar/health && echo
REMOTE
echo "✓ solar backend deployed (previous version kept at $DEST/app.old)"
