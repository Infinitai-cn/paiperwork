#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   sudo bash deploy.sh /path/to/dist/linux your-domain.example.com
# Example:
#   sudo bash deploy.sh ~/paiperwork-main/dist/linux app.example.com

if [[ ${EUID} -ne 0 ]]; then
  echo "Run as root: sudo bash deploy.sh <dist-linux-path> <domain>"
  exit 1
fi

DIST_DIR=${1:-}
DOMAIN=${2:-}

if [[ -z "$DIST_DIR" || -z "$DOMAIN" ]]; then
  echo "Usage: sudo bash deploy.sh <dist-linux-path> <domain>"
  exit 1
fi

if [[ ! -x "$DIST_DIR/Paiperwork-server" ]]; then
  echo "Missing executable: $DIST_DIR/Paiperwork-server"
  exit 1
fi

if [[ ! -d "$DIST_DIR/app" ]]; then
  echo "Missing app directory: $DIST_DIR/app"
  exit 1
fi

apt-get update
apt-get install -y caddy

id -u paiperwork >/dev/null 2>&1 || useradd --system --home /opt/paiperwork --shell /usr/sbin/nologin paiperwork

mkdir -p /opt/paiperwork
cp -R "$DIST_DIR"/* /opt/paiperwork/
chown -R paiperwork:paiperwork /opt/paiperwork
chmod +x /opt/paiperwork/Paiperwork-server

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
cp "$SCRIPT_DIR/paiperwork.service" /etc/systemd/system/paiperwork.service

sed "s/your-domain.example.com/$DOMAIN/g" "$SCRIPT_DIR/Caddyfile" > /etc/caddy/Caddyfile

systemctl daemon-reload
systemctl enable paiperwork
systemctl restart paiperwork
systemctl enable caddy
systemctl restart caddy

echo "Deployment complete."
echo "Check services: systemctl status paiperwork caddy"
