/**
 * PM2 Ecosystem Configuration
 * Used by GitHub Actions CI/CD to manage the Node.js process on EC2.
 *
 * Staging:    pm2 start ecosystem.config.js --env staging
 * Production: pm2 start ecosystem.config.js --env production
 */

module.exports = {
  apps: [
    {
      name: 'ceren-backend',
      script: './build/app.js',
      interpreter: 'node',

      // ── environment-specific overrides ──────────────────────────────────
      // NOTE: `instances` and `exec_mode` are PM2 app-level properties and
      // cannot be set per-env via env_* blocks — PM2 reads them at config
      // parse time, before env_staging / env_production are applied.
      // The previous ternaries on process.env.NODE_ENV always resolved to
      // the else branch (fork / 1 instance) because NODE_ENV is not set
      // until AFTER the config is parsed. Both envs now use cluster mode.
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ── process management ──────────────────────────────────────────────
      // cluster mode: one worker per vCPU — handles concurrent requests in
      // parallel and survives individual worker crashes without downtime.
      // t3.micro (staging) = 2 vCPUs; t3.small (production) = 2 vCPUs.
      instances: 2,
      exec_mode: 'cluster',

      autorestart: true,
      watch: false,
      max_memory_restart: '500M',

      // ── logging ─────────────────────────────────────────────────────────
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // ── graceful shutdown ────────────────────────────────────────────────
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],
};
