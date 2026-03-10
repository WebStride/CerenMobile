---
name: aws-ec2-deploy
description: 'Deploy Node.js/Express/Prisma/MySQL backend to AWS EC2 with staging and production environments. Use when: setting up AWS infrastructure, migrating from Render to EC2, configuring Nginx reverse proxy, setting up SSL with Certbot, configuring PM2 process management, creating GitHub Actions CI/CD pipelines, bootstrapping EC2 servers, migrating databases, or troubleshooting deployment issues. Covers the full 8-phase workflow: AWS account → IAM/SSH → EC2 instances → server bootstrap → domain/Nginx/SSL → PM2 → GitHub Actions → Render migration + go live.'
argument-hint: 'Which phase or task? (e.g. "phase 3 launch EC2", "set up nginx", "github actions deploy")'
---

# AWS EC2 Deployment — CerenMobile Backend

**Stack:** Node.js · TypeScript · Express · Prisma · MySQL · PM2 · Nginx · GitHub Actions  
**Environments:** `staging` (test branch) · `production` (main branch)

> Reference files for templates and configs:
> - [EC2 Bootstrap Script](./references/bootstrap.md)
> - [Nginx + SSL Configuration](./references/nginx-ssl.md)
> - [PM2 Ecosystem File](./references/pm2-ecosystem.md)
> - [GitHub Actions Deploy YAML](./references/github-actions.md)

---

## Phase 1 — AWS Account + Billing

**Goal:** Active AWS account with billing guardrails.

1. Create account at [aws.amazon.com](https://aws.amazon.com) with a dedicated email.
2. Enable **MFA** on the root account immediately.
3. Go to **Billing → Budgets** → create a budget alert (e.g. $50/month) with email notification.
4. In **Billing → Cost Explorer**, enable it so usage is visible.
5. Confirm account is out of "pending" state (may take up to 24 h for new accounts).

**Checklist:**
- [ ] Root account has MFA enabled
- [ ] Billing budget alert configured
- [ ] Account is active (EC2 console loads without errors)

---

## Phase 2 — IAM + SSH Keys

**Goal:** Non-root IAM user for daily operations + SSH key pairs for each environment.

### IAM User
1. Go to **IAM → Users → Create user** (e.g. `ceren-deploy`).
2. Attach permission: `AmazonEC2FullAccess` + `AmazonRDSFullAccess` (or custom least-privilege policy).
3. Generate **Access Key** (type: CLI) — save it securely (used for GitHub Actions secrets).
4. Enable MFA on the IAM user.

### SSH Key Pairs
1. Go to **EC2 → Key Pairs → Create key pair**.
2. Create two key pairs:
   - `ceren-staging-key` → download `ceren-staging-key.pem`
   - `ceren-production-key` → download `ceren-production-key.pem`
3. Store `.pem` files securely (1Password / local `~/.ssh/`).
4. Set correct permissions:
   ```bash
   chmod 400 ~/.ssh/ceren-staging-key.pem
   chmod 400 ~/.ssh/ceren-production-key.pem
   ```

**Checklist:**
- [ ] IAM user created (no root credentials used)
- [ ] Access Key saved (will be used in GitHub Secrets)
- [ ] SSH `.pem` files downloaded and secured

---

## Phase 3 — Launch 2 EC2 Instances

**Goal:** One EC2 instance for staging, one for production.

### Instance spec (recommended for this project)
| Setting         | Staging        | Production      |
|-----------------|----------------|-----------------|
| AMI             | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Instance type   | `t3.micro`     | `t3.small`      |
| Key pair        | `ceren-staging-key` | `ceren-production-key` |
| Storage         | 20 GB gp3      | 30 GB gp3       |
| Public IP       | Enable         | Enable          |

### Security Group rules (create separate SGs)
| Port  | Protocol | Source        | Purpose               |
|-------|----------|---------------|-----------------------|
| 22    | TCP      | Your IP /32   | SSH access            |
| 80    | TCP      | 0.0.0.0/0     | HTTP (Nginx redirect) |
| 443   | TCP      | 0.0.0.0/0     | HTTPS                 |
| 3306  | TCP      | Private IP SG | MySQL (if RDS used)   |

> **Never** open port 3000/4000 (Node app port) to 0.0.0.0 — Nginx handles that.

### Steps
1. EC2 → Launch Instance → select Ubuntu 24.04 LTS.
2. Choose instance type.
3. Select the correct key pair.
4. Network: create or select VPC, enable Auto-assign public IP.
5. Create security group with the rules above.
6. Launch.
7. Note the **Public IPv4** of each instance.
8. Set descriptive **Name tags**: `ceren-staging`, `ceren-production`.

**Checklist:**
- [ ] Staging EC2 running, public IP noted
- [ ] Production EC2 running, public IP noted
- [ ] Security groups do NOT expose app port (3000/4000) publicly

---

## Phase 4 — Bootstrap Both Servers

**Goal:** Each server is ready to run the Node.js app.

Follow [Bootstrap Script](./references/bootstrap.md) for the full script.

Run these steps on **each** server via SSH:
```bash
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@<STAGING_IP>
```

### Quick summary of what bootstrap does
1. `apt update && apt upgrade`
2. Install **Node.js 20 LTS** via NodeSource
3. Install **PM2** globally
4. Install **Nginx**
5. Install **MySQL** (or configure RDS connection — skip if using RDS)
6. Install **git**
7. Create app directory: `/var/www/ceren-backend`
8. Set directory ownership: `chown ubuntu:ubuntu /var/www/ceren-backend`
9. Create `.env` file at `/var/www/ceren-backend/.env`

**Checklist (per server):**
- [ ] Node 20 installed (`node -v`)
- [ ] PM2 installed (`pm2 -v`)
- [ ] Nginx installed (`nginx -v`)
- [ ] App directory created with correct ownership
- [ ] `.env` file created with correct values

---

## Phase 5 — Domain + Nginx + SSL

**Goal:** `api-staging.yourdomain.com` and `api.yourdomain.com` with HTTPS.

Follow [Nginx + SSL Reference](./references/nginx-ssl.md) for full configs.

### DNS Setup
1. In your DNS provider (Route 53 / Cloudflare / etc.):
   - Create `A` record: `api-staging.yourdomain.com` → Staging EC2 public IP
   - Create `A` record: `api.yourdomain.com` → Production EC2 public IP
2. Wait for DNS propagation (check with `dig api-staging.yourdomain.com`).

### Nginx Config
1. Create `/etc/nginx/sites-available/ceren-backend` (see reference).
2. Enable: `sudo ln -s /etc/nginx/sites-available/ceren-backend /etc/nginx/sites-enabled/`
3. Remove default: `sudo rm /etc/nginx/sites-enabled/default`
4. Test: `sudo nginx -t`
5. Reload: `sudo systemctl reload nginx`

### SSL with Certbot
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d api-staging.yourdomain.com
# For production:
sudo certbot --nginx -d api.yourdomain.com
```
Certbot auto-renews via systemd timer — verify with `sudo certbot renew --dry-run`.

**Checklist:**
- [ ] DNS A records created for both subdomains
- [ ] Nginx reverse proxy config working (curl http returns app response)
- [ ] SSL certificates issued (https:// loads with valid cert)
- [ ] Auto-renewal working (`certbot renew --dry-run` succeeds)

---

## Phase 6 — PM2 Ecosystem File

**Goal:** Process manager configured for both environments with auto-restart on reboot.

Follow [PM2 Ecosystem Reference](./references/pm2-ecosystem.md) for the full config file.

### Deploy on server
```bash
# Copy ecosystem.config.js to server
scp -i ~/.ssh/ceren-staging-key.pem ecosystem.config.js ubuntu@<STAGING_IP>:/var/www/ceren-backend/

# Start with PM2
cd /var/www/ceren-backend
pm2 start ecosystem.config.js --env staging

# Save PM2 process list + enable startup
pm2 save
pm2 startup
# Run the command PM2 outputs — it sets up the systemd service
```

**Checklist:**
- [ ] `pm2 list` shows app running (status = `online`)
- [ ] `pm2 logs` shows no startup errors
- [ ] `pm2 startup` systemd service configured
- [ ] App survives `sudo reboot` (PM2 auto-restarts it)

---

## Phase 7 — GitHub Actions Deploy YAML

**Goal:** Automated CI/CD — push to `develop` → deploys to staging; push to `main` → deploys to production.

Follow [GitHub Actions Reference](./references/github-actions.md) for the full YAML.

### GitHub Secrets to configure (Settings → Secrets → Actions)
| Secret Name              | Value                              |
|--------------------------|------------------------------------|
| `STAGING_HOST`           | Staging EC2 public IP              |
| `STAGING_SSH_KEY`        | Contents of `ceren-staging-key.pem` |
| `STAGING_SSH_USER`       | `ubuntu`                           |
| `PRODUCTION_HOST`        | Production EC2 public IP           |
| `PRODUCTION_SSH_KEY`     | Contents of `ceren-production-key.pem` |
| `PRODUCTION_SSH_USER`    | `ubuntu`                           |
| `AWS_ACCESS_KEY_ID`      | IAM user access key ID             |
| `AWS_SECRET_ACCESS_KEY`  | IAM user secret access key         |

### Deploy workflow summary
1. On push to `develop`: SSH into staging, `git pull`, `npm ci`, `npm run build`, `npx prisma migrate deploy`, `pm2 reload`
2. On push to `main`: Same steps on production server

**Checklist:**
- [ ] All GitHub Secrets added
- [ ] `.github/workflows/deploy.yml` committed
- [ ] Test deploy: push to `develop` → Actions tab shows green
- [ ] Test deploy: push to `main` → Actions tab shows green
- [ ] `pm2 list` on each server shows app restarted successfully

---

## Phase 8 — Migrate from Render + Go Live

**Goal:** Zero-downtime cutover from Render to AWS.

### Pre-migration checklist
- [ ] Both EC2 deployments are working end-to-end (test all API endpoints)
- [ ] Database credentials in EC2 `.env` files are correct
- [ ] SSL is working on both new domains
- [ ] GitHub Actions pipelines are green

### Database migration (if moving DB)
```bash
# On Render (or old host), export:
mysqldump -u <user> -p <db_name> > ceren_backup_$(date +%Y%m%d).sql

# On new MySQL host / EC2:
mysql -u <user> -p <db_name> < ceren_backup_YYYYMMDD.sql

# Run Prisma migrations to ensure schema is up to date:
cd /var/www/ceren-backend && npx prisma migrate deploy
```

### Cutover steps
1. Update `.env` on both EC2 servers to point to final database.
2. `pm2 reload all` on both servers.
3. Update mobile app `API_BASE_URL` (in Expo `app.config.js`) to new domain.
4. Test the **mobile app** against the new endpoints.
5. Update DNS if using Render's domain → switch to new EC2 IPs.
6. Monitor Render logs for any lingering traffic.
7. Once traffic confirms 0 errors on new server for 24+ hours:
   - Delete Render service (to stop billing)

### Post-migration monitoring
```bash
# Real-time logs
pm2 logs ceren-backend --lines 100

# Process status
pm2 monit

# Nginx access log
sudo tail -f /var/log/nginx/access.log
```

**Checklist:**
- [ ] DB exported + imported + Prisma migrations applied
- [ ] All API endpoints tested on new domain (Postman / curl)
- [ ] Mobile app updated to use new `API_BASE_URL`
- [ ] Render service deleted (save costs)
- [ ] PM2 logs clean (no unhandled errors)

---

## Quick Reference — Common Commands

```bash
# SSH into servers
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@<STAGING_IP>
ssh -i ~/.ssh/ceren-production-key.pem ubuntu@<PRODUCTION_IP>

# PM2
pm2 list                     # Show all processes
pm2 logs ceren-backend       # Tail logs
pm2 reload ceren-backend     # Zero-downtime reload
pm2 restart ceren-backend    # Hard restart
pm2 monit                    # Real-time monitor

# Nginx
sudo nginx -t                # Test config
sudo systemctl reload nginx  # Apply config changes
sudo systemctl status nginx  # Check status

# App deployment (manual)
cd /var/www/ceren-backend
git pull origin main
npm ci --omit=dev
npm run build
npx prisma migrate deploy
pm2 reload ceren-backend

# Check open ports
ss -tlnp | grep LISTEN

# Check Node app is responding
curl http://localhost:4000/health
```

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `502 Bad Gateway` | Node app not running | `pm2 list` → restart app |
| `Connection refused` on port 443 | Certbot failed | Re-run `certbot --nginx` |
| GitHub Actions SSH timeout | SG port 22 closed to GitHub IPs | Open port 22 to `0.0.0.0/0` or use `aws:` prefix in SG |
| Prisma migration error | DB not reachable from EC2 | Check `DATABASE_URL` in `.env` + SG rules for port 3306 |
| PM2 doesn't start after reboot | `pm2 startup` not run | Run `pm2 startup` + `pm2 save` again |
| `EACCES` permission error | Wrong file ownership | `sudo chown -R ubuntu:ubuntu /var/www/ceren-backend` |
