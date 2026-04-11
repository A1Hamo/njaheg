#!/bin/bash
# ═══════════════════════════════════════════
# scripts/setup-server.sh
# One-command Ubuntu 22.04 VPS setup
# Usage: sudo bash setup-server.sh yourdomain.com admin@email.com
# ═══════════════════════════════════════════
set -e
DOMAIN=${1:-yourdomain.com}
EMAIL=${2:-admin@yourdomain.com}
APP_DIR=/opt/najah

log() { echo -e "\033[0;32m[$(date +%T)] ✅ $1\033[0m"; }
warn(){ echo -e "\033[1;33m[$(date +%T)] ⚠️  $1\033[0m"; }

log "Updating system..."
apt-get update -qq && apt-get upgrade -y -qq
apt-get install -y -qq curl wget git ufw fail2ban

log "Installing Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
fi

log "Installing Docker Compose v2..."
DOCKER_CONFIG=${DOCKER_CONFIG:-$HOME/.docker}
mkdir -p $DOCKER_CONFIG/cli-plugins
COMPOSE_VER=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep tag_name | cut -d'"' -f4)
curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VER}/docker-compose-linux-x86_64" \
  -o $DOCKER_CONFIG/cli-plugins/docker-compose
chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose

log "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

log "Configuring Fail2ban..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
[sshd]
enabled = true
EOF
systemctl enable --now fail2ban

log "Installing Certbot..."
snap install --classic certbot 2>/dev/null || apt-get install -y certbot
ln -sf /snap/bin/certbot /usr/bin/certbot 2>/dev/null || true

log "Creating app directory..."
mkdir -p $APP_DIR/{nginx/ssl,logs,backups}

log "Requesting SSL certificate for $DOMAIN..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  certbot certonly --standalone --non-interactive --agree-tos -m "$EMAIL" -d "$DOMAIN" -d "www.$DOMAIN" \
    && cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $APP_DIR/nginx/ssl/ \
    && cp /etc/letsencrypt/live/$DOMAIN/privkey.pem   $APP_DIR/nginx/ssl/ \
    || warn "SSL failed — check DNS and retry: certbot certonly --standalone -d $DOMAIN"
fi

log "Creating .env.production template..."
if [ ! -f "$APP_DIR/.env.production" ]; then
cat > $APP_DIR/.env.production << ENVEOF
NODE_ENV=production
PORT=5000
CLIENT_URL=https://$DOMAIN

DB_NAME=najah_db
DB_USER=postgres
DB_PASSWORD=CHANGE_ME_STRONG_DB_PASSWORD

MONGO_USER=admin
MONGO_PASSWORD=CHANGE_ME_STRONG_MONGO_PASSWORD

REDIS_PASSWORD=CHANGE_ME_STRONG_REDIS_PASSWORD

JWT_SECRET=CHANGE_ME_MIN_64_CHARS_RANDOM_abcdefghijklmnopqrstuvwxyz1234567890ABCDEF
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=CHANGE_ME_DIFFERENT_64_CHARS_RANDOM_zyxwvutsrqponmlkjihgfedcba9876543210
JWT_REFRESH_EXPIRES_IN=30d

GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://$DOMAIN/api/auth/google/callback

FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your_project.iam.gserviceaccount.com
FIREBASE_STORAGE_BUCKET=your_project.appspot.com

OPENAI_API_KEY=sk-your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=2000

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=Najah Platform <noreply@$DOMAIN>

REACT_APP_API_URL=https://$DOMAIN/api
REACT_APP_SOCKET_URL=https://$DOMAIN
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
ENVEOF
  warn "Fill in $APP_DIR/.env.production before starting!"
fi

log "Creating systemd service..."
cat > /etc/systemd/system/najah.service << EOF
[Unit]
Description=Najah Platform
After=docker.service
Requires=docker.service
[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
ExecStop=docker compose down
TimeoutStartSec=300
[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable najah

log "Setting up backup cron..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/scripts/backup.sh >> $APP_DIR/logs/backup.log 2>&1") | crontab -

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Server setup complete!"
echo ""
echo "  Next steps:"
echo "  1. nano $APP_DIR/.env.production  (fill in all secrets)"
echo "  2. Copy najah project files to server"
echo "  3. cd $APP_DIR && docker compose up -d"
echo "  4. docker compose exec backend npm run seed"
echo ""
echo "  GitHub Actions secrets:"
echo "  SERVER_HOST     = $(curl -s ifconfig.me 2>/dev/null || echo YOUR_IP)"
echo "  SERVER_USER     = $(whoami)"
echo "  SSH_PRIVATE_KEY = <your private key>"
echo "══════════════════════════════════════════"
