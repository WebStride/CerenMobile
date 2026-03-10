# EC2 Server Bootstrap Script

Run this **once** on each EC2 instance immediately after first SSH login.

## Full bootstrap script

```bash
#!/bin/bash
set -e

echo "=== [1/9] Updating system packages ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== [2/9] Installing Node.js 20 LTS ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # Should print v20.x.x
npm -v

echo "=== [3/9] Installing PM2 globally ==="
sudo npm install -g pm2
pm2 -v

echo "=== [4/9] Installing Nginx ==="
sudo apt-get install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo "=== [5/9] Installing Git ==="
sudo apt-get install -y git

echo "=== [6/9] Installing useful tools ==="
sudo apt-get install -y curl wget unzip htop

echo "=== [7/9] Creating app directory ==="
sudo mkdir -p /var/www/ceren-backend
sudo chown ubuntu:ubuntu /var/www/ceren-backend
sudo chmod 755 /var/www/ceren-backend

echo "=== [8/9] Creating PM2 log directory ==="
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

echo "=== [9/9] Setting up firewall (UFW) ==="
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status

echo ""
echo "=== Bootstrap complete! ==="
echo "Node: $(node -v)"
echo "NPM:  $(npm -v)"
echo "PM2:  $(pm2 -v)"
echo "Nginx: $(nginx -v 2>&1)"
echo ""
echo "Next steps:"
echo "1. Clone repo: cd /var/www && git clone https://github.com/WebStride/CerenMobile.git ceren-backend"
echo "2. Create .env: nano /var/www/ceren-backend/backend/.env"
echo "3. Configure Nginx site"
echo "4. Run Certbot for SSL"
```

## How to run it

```bash
# SSH into the server
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@<EC2_IP>

# Option A: Run inline (paste into terminal)
# Copy and paste the script above

# Option B: Upload and execute
scp -i ~/.ssh/ceren-staging-key.pem bootstrap.sh ubuntu@<EC2_IP>:~/
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@<EC2_IP> "chmod +x ~/bootstrap.sh && ~/bootstrap.sh"
```

## Post-bootstrap: Clone the repo

```bash
cd /var/www
git clone https://github.com/WebStride/CerenMobile.git temp-clone
mv temp-clone/backend/* ceren-backend/
rm -rf temp-clone

# OR clone into a subdirectory and symlink
git clone https://github.com/WebStride/CerenMobile.git /var/www/ceren-repo
ln -s /var/www/ceren-repo/backend /var/www/ceren-backend
```

> **Recommended:** Clone the full mono-repo and work from the `backend/` subfolder:
> ```bash
> cd /var/www
> git clone https://github.com/WebStride/CerenMobile.git ceren-full
> cd ceren-full/backend
> ```
> Update `PM2 ecosystem.config.js` `cwd` to `/var/www/ceren-full/backend`.

## Create `.env` on server

```bash
nano /var/www/ceren-backend/.env
```

Required variables (from your backend `src/app.ts` + `prisma/schema.prisma`):
```dotenv
NODE_ENV=staging
PORT=4000

# Database
DATABASE_URL="mysql://USER:PASSWORD@HOST:3306/DB_NAME"

# Auth
ACCESS_TOKEN_SECRET=your_super_secret_access_token
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token

# MSG91
MSG91_API_KEY=your_msg91_api_key

# Twilio (if used)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_VERIFY_SERVICE_SID=your_verify_sid
```

> **Never commit `.env` to git.** The file lives only on the server disk.

## Verify everything is working

```bash
# Check processes
sudo systemctl status nginx
pm2 list

# Check Node app responds
curl http://localhost:4000/health

# Check Nginx is proxying correctly
curl http://localhost/health
```
