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
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },

      // ── process management ──────────────────────────────────────────────
      // staging: 1 instance (t3.micro — 1 vCPU)
      // production: 'max' spawns one worker per vCPU (t3.small — 2 vCPUs)
      instances: process.env.NODE_ENV === 'production' ? 'max' : 1,
      exec_mode: process.env.NODE_ENV === 'production' ? 'cluster' : 'fork',

      autorestart: true,
      watch: false,
      max_memory_restart: process.env.NODE_ENV === 'production' ? '700M' : '450M',

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
