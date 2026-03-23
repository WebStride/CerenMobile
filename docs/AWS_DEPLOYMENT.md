# CerenMobile — AWS EC2 Deployment Log

> **Purpose:** A living document updated after each deployment step is completed.  
> Each phase explains **what** was done and **why** — so any team member can understand the decisions, reproduce the setup, or debug issues in the future.

---

## Overview

We are migrating the CerenMobile backend from **Render** to **AWS EC2** with:
- Two separate environments: **Staging** and **Production**
- Automated deployments via **GitHub Actions** (CI/CD)
- Reverse proxy via **Nginx**, HTTPS via **Certbot (Let's Encrypt)**
- Process management via **PM2**
- Database: **MySQL** (hosted on EC2 itself, or optionally Amazon RDS)

**AWS Account:** CerenCreatives (Account ID: `4385-1041-7762`)  
**AWS Region:** `us-east-1` (N. Virginia) — chosen for lowest latency to global users and widest AWS service availability.

---

## Mobile App Environment Runbook ✅

**Date verified:** March 23, 2026  
**Status:** ✅ Current reference for running the mobile app against staging and production correctly

This section is the operational guide for choosing the correct backend from the mobile app.

### Environment Matrix

| Use case | Mobile env source | Expected backend URL | How to run |
|---|---|---|---|
| Daily staging testing on phone | `MobileAppUI/.env.development` | `https://api-staging.cerenmobile.com` | `npx expo start --host lan --clear --go` |
| Daily staging testing on Android emulator/dev client | `MobileAppUI/.env.development` | `https://api-staging.cerenmobile.com` | `npm run android` or `npx expo start --dev-client --clear` |
| Local backend testing on Android emulator | `MobileAppUI/.env.development` | `http://10.0.2.2:3002` | start local backend, then `npm run android` |
| Local backend testing on physical device | `MobileAppUI/.env.development` | `http://<your-mac-lan-ip>:3002` | start local backend, then `npx expo start --host lan --clear --go` |
| Production APK / AAB build | `MobileAppUI/.env.production` and `MobileAppUI/eas.json` production profiles | `https://api.cerenmobile.com` | `eas build --platform android --profile production` |
| Internal production-like QA build | `MobileAppUI/eas.json` preview / testflight profile | `https://api.cerenmobile.com` | `eas build --platform android --profile preview` or `eas build --platform ios --profile testflight` |

### Critical Rule: Which config actually wins

The mobile app does **not** use one single source for environment configuration. The correct backend depends on how the app is launched:

1. **Expo / Metro local runs** use `MobileAppUI/.env.development` through `app.config.js`.
2. **Production-style EAS builds** use the `env` block from `MobileAppUI/eas.json` for the selected profile.
3. **Fallback values in code** should only be a last resort and must not be relied on for environment switching.

Because of this, changing only one file is not enough. To avoid sending traffic to the wrong backend, keep these files aligned:

```text
MobileAppUI/.env.development
MobileAppUI/.env.production
MobileAppUI/eas.json
```

### Verified staging setup

For staging, the frontend should resolve to:

```env
EXPO_PUBLIC_API_URL=https://api-staging.cerenmobile.com
```

This value is already the correct target for local development flows.

### Correct way to run staging on a phone with Expo Go

From `MobileAppUI/`:

```bash
npm install
npx expo start --host lan --clear --go
```

Then:

1. Connect the phone to the same Wi-Fi as the Mac.
2. Open **Expo Go**.
3. Scan the QR shown by Metro, or open the `exp://...` URL printed in the terminal.

Use this mode when you want fast staging verification from a real device without creating a new build.

### Correct way to run staging on Android emulator / development build

From `MobileAppUI/`:

```bash
npm install
npx expo start --dev-client --clear
```

In another terminal:

```bash
npm run android
```

Use this mode when testing native modules, dev-client features, or emulator-only workflows.

### Correct way to run against local backend

For **Android emulator**, set:

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:3002
```

For **iPhone simulator**, use:

```env
EXPO_PUBLIC_API_URL=http://localhost:3002
```

For a **real phone on the same Wi-Fi**, use your Mac LAN IP:

```env
EXPO_PUBLIC_API_URL=http://<your-mac-lan-ip>:3002
```

Then start the backend locally:

```bash
cd backend
npm run dev
```

### Correct way to build production

Before creating preview, TestFlight, or production builds, make sure both `.env.production` and the relevant `eas.json` profiles point to production:

```env
EXPO_PUBLIC_API_URL=https://api.cerenmobile.com
```

Recommended commands:

```bash
cd MobileAppUI

# Android internal QA build
eas build --platform android --profile preview

# iOS TestFlight build
eas build --platform ios --profile testflight

# Android production store build
eas build --platform android --profile production
```

### Important note about current repository state

At the time of this update, the documented **correct** production target is `https://api.cerenmobile.com`, but old Render URLs may still exist in historical build profiles or fallback values.

Before any production or preview release, verify and update all of the following if needed:

1. `MobileAppUI/.env.production`
2. `MobileAppUI/eas.json` (`preview`, `testflight`, `production` profiles)
3. Any hardcoded fallback production URL in frontend service files

### How to verify the app is hitting the expected backend

When the app boots, check device or Metro logs for:

```text
🌍 Using environment API URL: https://api-staging.cerenmobile.com
```

or:

```text
🌍 Using environment API URL: https://api.cerenmobile.com
```

If the app is supposed to hit staging but CloudWatch stays empty, verify these in order:

1. Metro / device logs show the correct `EXPO_PUBLIC_API_URL`.
2. The app was reloaded or rebuilt after changing env values.
3. The device is not running an older signed build with stale configuration.
4. The frontend is not crashing before the API calls are made.

### Safe operator checklist before every test session

- Confirm the intended backend: local, staging, or production.
- Confirm the correct env file or EAS profile is being used.
- Reload or reinstall the app after changing the backend URL.
- Check the first frontend log line that prints `Using environment API URL`.
- Only then verify backend logs in PM2 / CloudWatch.

---

## Phase 1 — AWS Free Tier Account Setup ✅

**Date completed:** March 11, 2026  
**Status:** ✅ Done

### What was done
- Created an AWS free-tier account under the **CerenCreatives** organization.
- Enabled billing alerts to avoid unexpected charges.

### Why
AWS free tier provides 12 months of limited EC2 usage (750 hrs/month of `t2.micro` or `t3.micro`). By starting on free tier, we avoid cost during development and staging, and only pay when we scale to production-grade resources.

---

## Phase 2 — IAM User + SSH Key Pairs ✅

**Date completed:** March 11, 2026  
**Status:** ✅ Done

### What was done

#### 2a. IAM User: `ceren-deploy`
- Created IAM user **`ceren-deploy`** (ARN: `arn:aws:iam::438510417762:user/ceren-deploy`)
- Attached policies:
  - `AmazonEC2FullAccess` — allows GitHub Actions to describe/start/stop EC2 instances if needed
  - `AmazonRDSFullAccess` — allows future database automation (snapshots, restores)
- Generated an **Access Key** for programmatic access (used in GitHub Actions secrets)

> ⚠️ **DO NOT commit the Access Key ID or Secret to the repository.**  
> Store them only in GitHub Secrets: `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`.

#### 2b. SSH Key Pairs (created in AWS EC2 → Key Pairs, region us-east-1)

| Key Name | Key ID | Purpose | Local Path |
|---|---|---|---|
| `ceren-staging-key` | `key-0d2d84d3a13a30c90` | SSH into staging EC2 | `~/.ssh/ceren-staging-key.pem` |
| `ceren-production-key` | *(see AWS console)* | SSH into production EC2 | `~/.ssh/ceren-production-key.pem` |

- Both are **RSA** type, `.pem` format.
- Files are stored locally at `~/.ssh/` with **permission `400`** (owner read-only).

#### 2c. Securing the key files locally
```bash
# These commands were run after downloading the .pem files
mkdir -p ~/.ssh
cp ~/Downloads/ceren-production-key.pem ~/.ssh/ceren-production-key.pem
cp ~/Downloads/e.pem ~/.ssh/ceren-staging-key.pem   # browser downloaded as "e.pem"
chmod 400 ~/.ssh/ceren-staging-key.pem
chmod 400 ~/.ssh/ceren-production-key.pem
```

### Why

**IAM user (not root):** AWS root account has unlimited privileges. Using a dedicated IAM user (`ceren-deploy`) with only the permissions it needs (principle of least privilege) prevents accidental or malicious damage if the credentials are compromised.

**Separate SSH keys per environment:** If the production key is ever compromised, we can rotate it without affecting staging, and vice versa. This isolates security boundaries between environments.

**`chmod 400` on .pem files:** SSH will refuse to use private key files that are readable by other users. Permission `400` (owner read-only) is required by the SSH client — it's both a security requirement and a practical necessity.

---

## Phase 3 — Launch EC2 Instances ✅

**Date completed:** March 11, 2026  
**Status:** ✅ Done

### What was done
Launched **2 EC2 instances** in `us-east-1`:

| Setting | Staging | Production |
|---|---|---|
| Name tag | `ceren-staging` | `ceren-production` |
| AMI | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| Instance type | `t3.micro` | `t3.small` |
| Key pair | `ceren-staging-key` | `ceren-production-key` |
| Security Group | ports 22/80/443 | ports 22/80/443 |
| Storage | 20 GiB gp3 | 30 GiB gp3 |

**Instance details:**

| | Staging | Production |
|---|---|---|
| Instance ID | `i-01bd58c0d3bab9757` | `i-04b23565a43286ed5` |
| Elastic IP | `54.165.194.161` | `3.222.212.40` |
| Private IPv4 | `172.31.26.63` | `172.31.65.112` |

```bash
# Connect to staging
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@54.165.194.161

# Connect to production
ssh -i ~/.ssh/ceren-production-key.pem ubuntu@3.222.212.40
```

### Why
**Two separate instances:** Staging lets us test deployments safely before pushing to production. If a migration or config change breaks the app, it breaks staging — not the live system used by wholesalers.

**Ubuntu 24.04 LTS:** Long-Term Support release — 5 years of security patches, wide community support, and compatibility with Node.js, Nginx, MySQL, and Certbot.

**`t3.micro` for staging:** The free tier supports up to 750 hrs/month of `t3.micro`. Staging gets less resources since it handles test traffic only.

**`t3.small` for production:** Provides 2 GiB RAM instead of 1 GiB — enough headroom for Node.js + PM2 + Nginx + MySQL concurrently under real load.

**Security Group (ports 22/80/443):** Port 22 for SSH access (deploy & debug), port 80 for HTTP (Nginx redirects to HTTPS), port 443 for HTTPS (the actual app traffic).

**20 GiB staging / 30 GiB production:** Production needs more headroom for database growth, application logs, and temporary files during deployments.

---

## Phase 4 — Bootstrap Both Servers ✅

**Date completed:** March 11, 2026  
**Status:** ✅ Done

### What was done

SSH'd into both servers and ran a non-interactive bootstrap script. The following was installed on **both** `ceren-staging` and `ceren-production`:

| Component | Version |
|---|---|
| Node.js | v20.20.1 |
| npm | 10.8.2 |
| PM2 | 6.0.14 |
| Nginx | 1.24.0 |
| MySQL | 8.0.45 |
| Git | 2.43.0 |

PM2 startup was configured via `pm2 startup systemd` so the process manager survives server reboots.

### Why
**Node.js 20 LTS:** Matches the development environment. Using NodeSource ensures we get the latest stable v20, not the older version in Ubuntu's default apt repo.

**PM2:** Production process manager for Node.js. It keeps the app running after crashes (auto-restart), starts on server reboot (`pm2 startup`), and provides cluster mode for multi-core utilization.

**Nginx:** Acts as a reverse proxy in front of Node.js. Handles HTTPS termination, serves static files efficiently, and lets us run multiple apps on one server. Node.js alone does not handle HTTPS as elegantly.

**MySQL on EC2 (not RDS):** For the initial migration, self-managed MySQL on EC2 avoids RDS costs. We can migrate to RDS later if needed for managed backups and replication.

---

## Phase 5 — Domain + Nginx + SSL ✅ (Complete)

**Date completed:** March 16, 2026  
**Status:** ✅ Done — DNS propagated, certificates issued, HTTPS active

### What was done (March 11–16, 2026)

#### 5a. DNS Records — ✅ Done
GoDaddy (or your registrar) now points to Route 53 nameservers, and the Route 53 hosted zone contains these A records:

| Subdomain | Type | Value | TTL |
|---|---|---|---|
| `api-staging.cerenmobile.com` | A | `54.165.194.161` | 300 |
| `api.cerenmobile.com` | A | `3.222.212.40` | 300 |

> The DNS records now resolve globally (verified via `dig`).

#### 5b. Certbot / HTTPS — ✅ Done
Certbot successfully issued and deployed certificates for both domains.

- **Production:** `https://api.cerenmobile.com` (Cert expiry 2026-06-14)
- **Staging:** `https://api-staging.cerenmobile.com` (Cert expiry 2026-06-14)

Certbot auto-renewal is enabled, and `sudo certbot renew --dry-run` succeeds.

#### 5c. Nginx Config — ✅ Done
Nginx reverse proxy is configured on both servers and now serves HTTPS for both subdomains.

- **Staging** (`ceren-staging`): `/etc/nginx/sites-enabled/ceren-backend`, `server_name api-staging.cerenmobile.com`
- **Production** (`ceren-production`): same config with `server_name api.cerenmobile.com`

Security headers are applied on both (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection).
Nginx reverse proxy is configured and active on both servers:

- **Staging** (`ceren-staging`): `/etc/nginx/sites-available/ceren-backend` → proxies `http://localhost:3000`
  - `server_name api-staging.cerenmobile.com`
- **Production** (`ceren-production`): same config → `server_name api.cerenmobile.com`

Security headers applied on both: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`.

#### 5c. Certbot — ✅ Installed (SSL pending DNS)

Certbot 2.9.0 installed on both servers via `apt`. SSL certificate issuance is waiting for DNS records to propagate before running.

### Why
**Nginx reverse proxy:** Node.js runs on port 3000 (internal). Nginx sits in front on port 443, handles HTTPS, and forwards traffic. This means Node.js doesn't need root privileges (to bind to port 443), and Nginx can handle connection pooling and rate limiting.

**Certbot / Let's Encrypt:** Free, automated, trusted SSL certificates. HTTPS is non-negotiable — without it, mobile app API calls fail on modern iOS/Android (ATS/Network Security Config requirements). Certbot auto-renews every 90 days.

**Separate subdomains per environment:** Clear separation — the mobile app's staging build points to `api-staging.*` and production build to `api.*`. No risk of staging traffic hitting production.

---

## Phase 6 — PM2 Ecosystem File ⏳

**Date completed:** *(pending)*  
**Status:** ⏳ Not started

### What needs to be done

Create `ecosystem.config.js` in the backend deploy directory on each server:

```js
// ecosystem.config.js (on staging server)
module.exports = {
  apps: [
    {
      name: 'ceren-backend-staging',
      script: './build/app.js',
      env: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
    },
  ],
};
```

```js
// ecosystem.config.js (on production server)
module.exports = {
  apps: [
    {
      name: 'ceren-backend-production',
      script: './build/app.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 'max',   // uses all CPU cores
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '700M',
    },
  ],
};
```

```bash
# Register PM2 startup hook (run once per server)
pm2 startup
# Follow the printed command (e.g., sudo env PATH=... pm2 startup systemd ...)

# Start the app
pm2 start ecosystem.config.js

# Save so PM2 restarts on reboot
pm2 save
```

### Why
**`ecosystem.config.js`:** Centralizes PM2 configuration so deployments are consistent and repeatable — no ad-hoc `pm2 start` commands.

**`cluster` mode on production:** Node.js is single-threaded. Cluster mode spawns one PM2 worker per CPU core, allowing the backend to handle parallel requests without being blocked by one request's I/O. On `t3.small` (2 vCPUs) this effectively doubles throughput.

**`autorestart: true`:** If Node.js crashes (unhandled exception, OOM), PM2 restarts it automatically — no manual intervention needed at 3 AM.

**`pm2 startup` + `pm2 save`:** Registers PM2 as a systemd service. After a server reboot (e.g., AWS maintenance, OS patch), the app starts automatically without any manual action.

---

## Phase 7 — GitHub Actions CI/CD ⏳

**Date completed:** *(pending)*  
**Status:** ⏳ Not started

### What needs to be done

#### 7a. Add GitHub Secrets
Go to: **GitHub → WebStride/CerenMobile → Settings → Secrets and variables → Actions**

Add these secrets:

| Secret Name | Value | Notes |
|---|---|---|
| `STAGING_HOST` | Staging EC2 public IP | Fill after Phase 3 |
| `STAGING_SSH_KEY` | Full contents of `~/.ssh/ceren-staging-key.pem` | Multi-line secret |
| `STAGING_SSH_USER` | `ubuntu` | Default Ubuntu AMI user |
| `PRODUCTION_HOST` | Production EC2 public IP | Fill after Phase 3 |
| `PRODUCTION_SSH_KEY` | Full contents of `~/.ssh/ceren-production-key.pem` | Multi-line secret |
| `PRODUCTION_SSH_USER` | `ubuntu` | Default Ubuntu AMI user |
| `AWS_ACCESS_KEY_ID` | IAM user access key ID | From Phase 2 CSV |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret access key | From Phase 2 CSV |

To copy the PEM file contents into a GitHub secret:
```bash
cat ~/.ssh/ceren-staging-key.pem | pbcopy
# Then paste into the GitHub secret field
```

#### 7b. GitHub Actions Workflow (`deploy.yml`)
Workflow file location: `.github/workflows/deploy.yml`

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - develop    # → deploys to staging
      - main       # → deploys to production

jobs:
  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies & build
        run: |
          cd backend
          npm ci
          npm run build

      - name: Deploy to Staging via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_SSH_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd ~/ceren-backend
            git pull origin develop
            npm ci --omit=dev
            npm run build
            npx prisma migrate deploy
            pm2 reload ecosystem.config.js --update-env

  deploy-production:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies & build
        run: |
          cd backend
          npm ci
          npm run build

      - name: Deploy to Production via SSH
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_SSH_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd ~/ceren-backend
            git pull origin main
            npm ci --omit=dev
            npm run build
            npx prisma migrate deploy
            pm2 reload ecosystem.config.js --update-env
```

### Why
**Branch-based deployments:** `develop` → staging, `main` → production. This enforces the discipline that only code reviewed and merged into `main` goes live. No one accidentally deploys half-finished features to production.

**`npm ci` instead of `npm install`:** `ci` is faster (uses `package-lock.json` exactly), never modifies `node_modules` unexpectedly, and is the correct command for CI environments.

**`prisma migrate deploy`:** Runs pending database migrations automatically on every deploy. This ensures the DB schema is always in sync with the code. `migrate deploy` (vs `migrate dev`) is the safe production command — it never auto-generates new migrations, only applies existing ones.

**`pm2 reload` (not restart):** `reload` performs a rolling restart with zero downtime — PM2 starts a new process, waits for it to be ready, then kills the old one. `restart` causes a brief period where the app is unavailable.

**GitHub Secrets (not env files):** Secrets are encrypted at rest in GitHub, never logged in CI output, and not visible in the repo. This is the correct way to handle credentials in CI/CD.

---

## Phase 8 — Migrate from Render + Go Live ⏳

**Date completed:** *(pending)*  
**Status:** ⏳ Not started

### What needs to be done

#### 8a. Export database from Render
```bash
# On your local machine (requires Render DB connection string)
mysqldump -h <RENDER_DB_HOST> -u <USER> -p<PASSWORD> <DB_NAME> > ceren_backup_$(date +%Y%m%d).sql
```

#### 8b. Import to EC2 MySQL
```bash
# Copy dump to server
scp -i ~/.ssh/ceren-production-key.pem ceren_backup_*.sql ubuntu@<PRODUCTION_IP>:~/

# SSH in and import
ssh -i ~/.ssh/ceren-production-key.pem ubuntu@<PRODUCTION_IP>
mysql -u root -p ceren_production < ~/ceren_backup_*.sql
```

#### 8c. Switch mobile app API_BASE_URL
In `MobileAppUI/.env.production`:
```
EXPO_PUBLIC_API_URL=https://api.cerenmobile.com
```

Also update the matching `production`, `preview`, and `testflight` profile values in `MobileAppUI/eas.json` before building.

Rebuild and release the app via EAS.

#### 8d. DNS Cutover
Update the A record for `api.cerenmobile.com` to point to the Production EC2 IP (if not already done in Phase 5).

Wait for DNS propagation (usually < 5 minutes with Cloudflare, up to 48 hours with other providers).

#### 8e. Cleanup
- Delete the Render service (after confirming production is stable for 24–48 hours)
- Revoke any Render-specific API keys or tokens

### Why
**Data export before cutover:** We never cut over DNS before migrating the data. DNS changes are fast — if we flip DNS first, the app points to the new server but the new server has no data yet. Always data first, DNS second.

**24–48 hour monitoring window before deleting Render:** Give production traffic time to stabilize on EC2. If something goes wrong, Render is still running and we can revert DNS in minutes.

**`scp` for file transfer:** Secure Copy Protocol uses SSH encryption — the only correct way to transfer sensitive files (database dumps) to the server without exposing them in transit.

---

## Key Credentials Reference

> ⚠️ **This section should NOT contain actual secrets.** Use it as a checklist to verify you have everything before starting Phases 3–8.

- [ ] `AWS_ACCESS_KEY_ID` — stored in GitHub Secrets
- [ ] `AWS_SECRET_ACCESS_KEY` — stored in GitHub Secrets  
- [ ] `~/.ssh/ceren-staging-key.pem` — on local machine, `chmod 400` ✅
- [ ] `~/.ssh/ceren-production-key.pem` — on local machine, `chmod 400` ✅
- [ ] Staging EC2 Public IP — *(fill in after Phase 3)*
- [ ] Production EC2 Public IP — *(fill in after Phase 3)*
- [ ] MySQL root password (staging) — stored in staging server's `.env`
- [ ] MySQL root password (production) — stored in production server's `.env`
- [ ] Backend `.env` file contents — stored in each server's `~/ceren-backend/.env`

---

## Quick SSH Reference

```bash
# Connect to staging
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@13.220.56.26

# Connect to production
ssh -i ~/.ssh/ceren-production-key.pem ubuntu@44.211.24.238

# Check PM2 status (run on server)
pm2 list
pm2 logs ceren-backend-staging --lines 50

# Check Nginx status (run on server)
sudo systemctl status nginx
sudo nginx -t

# Reload Nginx config
sudo systemctl reload nginx
```

---

*Last updated: March 23, 2026 — added verified mobile app runbook for staging, local, Expo Go, dev client, and production builds.*
