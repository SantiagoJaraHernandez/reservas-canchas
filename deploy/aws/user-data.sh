#!/bin/bash
# =====================================================================
#  Aprovisionamiento automatico de la instancia EC2 (Ubuntu 24.04 LTS)
#  Se pega en "Datos de usuario" (User data) al lanzar la instancia.
#  Log: /var/log/reservas-bootstrap.log
# =====================================================================
set -euxo pipefail
exec > >(tee -a /var/log/reservas-bootstrap.log) 2>&1

REPO_URL="https://github.com/SantiagoJaraHernandez/reservas-canchas.git"
REPO_BRANCH="hardening-seguridad"
APP_DIR="/opt/reservas"
export DEBIAN_FRONTEND=noninteractive

# ---------- 1. Swap (la instancia tiene poca RAM) ----------
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo 'vm.swappiness=10' > /etc/sysctl.d/60-swap.conf
fi

# ---------- 2. Parches y actualizaciones automaticas de seguridad ----------
apt-get update -y
apt-get upgrade -y
apt-get install -y unattended-upgrades fail2ban git openssl curl
dpkg-reconfigure -f noninteractive unattended-upgrades

# ---------- 3. Hardening del sistema operativo ----------
# SSH: sin contrasenas ni root (el acceso administrativo es por SSM Session Manager)
cat > /etc/ssh/sshd_config.d/99-hardening.conf <<'SSH'
PasswordAuthentication no
PermitRootLogin no
KbdInteractiveAuthentication no
X11Forwarding no
MaxAuthTries 3
LoginGraceTime 30
SSH
systemctl reload ssh || true

# Kernel / red
cat > /etc/sysctl.d/99-hardening.conf <<'SYS'
net.ipv4.conf.all.rp_filter=1
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.all.accept_source_route=0
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.tcp_syncookies=1
net.ipv6.conf.all.accept_redirects=0
kernel.kptr_restrict=2
kernel.dmesg_restrict=1
fs.protected_hardlinks=1
fs.protected_symlinks=1
SYS
sysctl --system

# Firewall del host (defensa adicional al Security Group)
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
systemctl enable --now fail2ban

# ---------- 4. Docker endurecido ----------
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'DJ'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" },
  "no-new-privileges": true,
  "live-restore": true,
  "userland-proxy": false,
  "icc": false
}
DJ
systemctl restart docker

# ---------- 5. Codigo de la aplicacion ----------
if [ ! -d "$APP_DIR/.git" ]; then
  git clone --branch "$REPO_BRANCH" --depth 1 "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only
fi
cd "$APP_DIR"

# Dominio publico gratuito basado en la IP (sslip.io) -> HTTPS con Let's Encrypt
TOKEN=$(curl -sX PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 300")
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)
SITE="$(echo "$PUBLIC_IP" | tr '.' '-').sslip.io"

if [ ! -f .env ]; then
  ./deploy/generate-env.sh "$SITE" "admin@reservas.local" > /root/credenciales-admin.txt
  chmod 600 /root/credenciales-admin.txt
else
  sed -i "s|^SITE_ADDRESS=.*|SITE_ADDRESS=${SITE}|" .env
fi
chown -R root:root "$APP_DIR"
chmod 600 .env

# ---------- 6. Construir (de a una imagen, para no agotar la RAM) y levantar ----------
for svc in frontend ms-auth ms-reservas gateway; do
  docker compose build "$svc"
done
docker compose up -d
echo "Despliegue terminado: https://${SITE}"
