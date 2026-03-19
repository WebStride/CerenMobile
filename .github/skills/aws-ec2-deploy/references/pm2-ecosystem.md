# PM2 Ecosystem Configuration

Save this file as `ecosystem.config.js` in `/var/www/ceren-backend/` on each EC2 server.

## ecosystem.config.js

```js
module.exports = {
  apps: [
    {
      name: 'ceren-backend',
      script: './build/app.js',
      cwd: '/var/www/ceren-backend',

      // Run 2 instances in cluster mode for production (use 1 for staging)
      instances: process.env.NODE_ENV === 'production' ? 2 : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

      // Auto-restart on crash
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',

      // Environment-specific config
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 4000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4000,
      },

      // Logging
      output: '/var/log/pm2/ceren-backend-out.log',
      error: '/var/log/pm2/ceren-backend-err.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Graceful shutdown
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true,
    },
  ],
};
```

## Commands

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

# Start for staging
pm2 start ecosystem.config.js --env staging

# Start for production
pm2 start ecosystem.config.js --env production

# Zero-downtime reload (use after deployments)
pm2 reload ceren-backend

# Persist across reboots
pm2 save
pm2 startup
# Then run the printed `sudo env PATH=...` command

# Update after code change
pm2 reload ecosystem.config.js --env staging   # or production
```

## Log rotation (optional but recommended)

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

## Health check endpoint

Make sure your Express app exposes a `/health` route that returns `200 OK`:

```ts
// src/app.ts
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV });
});
```

Nginx can use this for upstream health checks.
