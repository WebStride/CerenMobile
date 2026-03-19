# Nginx + SSL Configuration

## Prerequisites

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Nginx site config

Create `/etc/nginx/sites-available/ceren-backend` (same template on both servers — just change the domain):

```nginx
# /etc/nginx/sites-available/ceren-backend

# Rate limiting zone (prevent abuse)
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=30r/s;

server {
    listen 80;
    server_name api-staging.yourdomain.com;   # Change to api.yourdomain.com on production

    # Redirect all HTTP → HTTPS (Certbot will add this automatically, but good to have)
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name api-staging.yourdomain.com;   # Change to api.yourdomain.com on production

    # SSL certs (managed by Certbot)
    ssl_certificate     /etc/letsencrypt/live/api-staging.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api-staging.yourdomain.com/privkey.pem;
    include             /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam         /etc/letsencrypt/ssl-dhparams.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_types application/json text/plain application/javascript;
    gzip_min_length 1000;

    # Proxy to Node.js app
    location / {
        limit_req zone=api_limit burst=50 nodelay;

        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts (increase for long-running requests like PDF generation)
        proxy_read_timeout    60s;
        proxy_connect_timeout 10s;
        proxy_send_timeout    60s;
    }

    # Larger body size for file uploads
    client_max_body_size 20M;
}
```

## Enable the site

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/ceren-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test config syntax
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Issue SSL certificate with Certbot

```bash
# Staging server
sudo certbot --nginx -d api-staging.yourdomain.com

# Production server
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will:
1. Verify domain ownership via HTTP challenge
2. Issue the certificate
3. Automatically modify the Nginx config to add SSL blocks

## Verify auto-renewal

```bash
# Test renewal (dry run — no actual renewal)
sudo certbot renew --dry-run

# Check renewal timer
sudo systemctl status certbot.timer
```

Certificates renew automatically via the `certbot.timer` systemd service every 12 hours (when within 30 days of expiry).

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| `nginx: [emerg] unknown directive` | Config typo | Run `sudo nginx -t` for details |
| Certbot `Connection refused` | Nginx not running or port 80 blocked | Start Nginx, open SG port 80 |
| Certbot `DNS problem` | DNS hasn't propagated yet | Wait, then verify with `dig api-staging.yourdomain.com` |
| `502 Bad Gateway` | App not running on port 4000 | `pm2 list` → start app |
| SSL cert shows expired | Auto-renewal failed | Run `sudo certbot renew --force-renewal` |
