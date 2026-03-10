# GitHub Actions Deploy Workflow

Save this file as `.github/workflows/deploy.yml` in your repository.

## Required GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret Name              | Value                                    |
|--------------------------|------------------------------------------|
| `STAGING_HOST`           | Staging EC2 public IPv4                  |
| `STAGING_SSH_KEY`        | Full contents of `ceren-staging-key.pem` |
| `STAGING_SSH_USER`       | `ubuntu`                                 |
| `PRODUCTION_HOST`        | Production EC2 public IPv4               |
| `PRODUCTION_SSH_KEY`     | Full contents of `ceren-production-key.pem` |
| `PRODUCTION_SSH_USER`    | `ubuntu`                                 |

## deploy.yml

```yaml
name: Deploy Backend

on:
  push:
    branches:
      - develop    # → Staging
      - main       # → Production
    paths:
      - 'backend/**'
      - '.github/workflows/deploy.yml'

jobs:
  # ─────────────────────────────────────────────
  # STAGING — triggered by push to `develop`
  # ─────────────────────────────────────────────
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Staging EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_SSH_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            set -e

            APP_DIR="/var/www/ceren-backend"
            cd "$APP_DIR"

            echo "=== Pulling latest code ==="
            git fetch origin develop
            git reset --hard origin/develop

            echo "=== Installing dependencies ==="
            npm ci --omit=dev

            echo "=== Building TypeScript ==="
            npm run build

            echo "=== Running Prisma migrations ==="
            npx prisma migrate deploy

            echo "=== Reloading PM2 (zero-downtime) ==="
            pm2 reload ceren-backend --update-env

            echo "=== Deploy to Staging complete ==="

  # ─────────────────────────────────────────────
  # PRODUCTION — triggered by push to `main`
  # ─────────────────────────────────────────────
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to Production EC2
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_SSH_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            set -e

            APP_DIR="/var/www/ceren-backend"
            cd "$APP_DIR"

            echo "=== Pulling latest code ==="
            git fetch origin main
            git reset --hard origin main

            echo "=== Installing dependencies ==="
            npm ci --omit=dev

            echo "=== Building TypeScript ==="
            npm run build

            echo "=== Running Prisma migrations ==="
            npx prisma migrate deploy

            echo "=== Reloading PM2 (zero-downtime) ==="
            pm2 reload ceren-backend --update-env

            echo "=== Deploy to Production complete ==="
```

## Notes

- `appleboy/ssh-action` SSHes into the EC2 and runs the deploy script remotely.
- `set -e` ensures the script aborts on any error (prevents partial deploys).
- `git reset --hard` is safe here because `.env` is never committed — it lives on disk.
- `pm2 reload` does a rolling restart (zero-downtime in cluster mode).
- The `environment:` key lets you add **manual approval gates** in GitHub for production (Settings → Environments → production → Required reviewers).

## First-time server setup (one-off)

Before GitHub Actions can deploy, the server must have the repo cloned:

```bash
# SSH into server
ssh -i ~/.ssh/ceren-staging-key.pem ubuntu@<STAGING_IP>

# Clone repo
cd /var/www
git clone https://github.com/WebStride/CerenMobile.git ceren-backend
cd ceren-backend/backend

# Create .env
cp .env.example .env
nano .env   # Fill in all values

# Initial build + start
npm ci --omit=dev
npm run build
npx prisma migrate deploy
pm2 start ecosystem.config.js --env staging
pm2 save
pm2 startup
```

After this, all future deploys happen automatically via GitHub Actions.

## Troubleshooting Actions failures

| Error | Cause | Fix |
|-------|-------|-----|
| `Permission denied (publickey)` | SSH key secret wrong | Paste full `.pem` content including `-----BEGIN RSA PRIVATE KEY-----` |
| `Host key verification failed` | First SSH connection | Add `script_stop: true` and pre-add host to known_hosts, or use `appleboy/ssh-action` with `host_key_fingerprint` |
| `npm: command not found` | Node not in PATH for non-interactive shells | Add `export PATH=$PATH:/usr/local/bin` to deploy script |
| `pm2: command not found` | Same PATH issue | Add `export PATH=$PATH:$(npm bin -g)` |
