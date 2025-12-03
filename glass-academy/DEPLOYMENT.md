# Glass Academy - Deployment Guide

## ✅ Pre-Deployment Checklist

### Build & Test Status
- ✅ **Lint**: Passes with 0 errors, 0 warnings
- ✅ **Build**: Production build successful
- ✅ **TypeScript**: All type checks passed
- ✅ **E2E Tests**: All routes returning 200 OK
- ✅ **API**: Contact form submission working
- ✅ **404 Handling**: Proper error pages for invalid routes

### Test Results Summary

**All Routes (200 OK):**
- ✅ Homepage (en, nb, nn)
- ✅ Work Listing (en, nb, nn)
- ✅ Services Page (en, nb, nn)
- ✅ Process Page (en, nb, nn)
- ✅ About Page (en, nb, nn)
- ✅ Contact Page (en, nb, nn)
- ✅ All 4 Case Studies
- ✅ Contact API endpoint

**Error Handling:**
- ✅ 404 for non-existent routes
- ✅ 404 for non-existent projects

## Deployment Steps

### Option 1: PM2 Deployment (Recommended)

```bash
# 1. SSH into server
ssh glasscode

# 2. Navigate to deployment directory
cd /var/www/about-glasscode-academy

# 3. Pull latest changes
git pull origin main

# 4. Install dependencies
npm install

# 5. Build application
npm run build

# 6. Start with PM2
pm2 start npm --name "about-glasscode-academy" -- run start

# 7. Save PM2 configuration
pm2 save

# 8. Enable startup on boot (first time only)
pm2 startup

# 9. Verify application
curl http://localhost:3000/en
```

### Nginx Configuration

Create `/etc/nginx/sites-available/about.glasscode.academy`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name about.glasscode.academy;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name about.glasscode.academy;

    # SSL certificates (Cloudflare Origin or Let's Encrypt)
    ssl_certificate /path/to/certificate.pem;
    ssl_certificate_key /path/to/private-key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Proxy to Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/about.glasscode.academy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment Verification

### 1. Server Verification

```bash
# Check PM2 status
pm2 status

# Check application logs
pm2 logs about-glasscode-academy

# Check Nginx status
sudo systemctl status nginx

# Test local connection
curl -I http://localhost:3000/en
```

### 2. Public URL Testing

Test all English routes:
```bash
curl -I https://about.glasscode.academy/en
curl -I https://about.glasscode.academy/en/work
curl -I https://about.glasscode.academy/en/services
curl -I https://about.glasscode.academy/en/process
curl -I https://about.glasscode.academy/en/about
curl -I https://about.glasscode.academy/en/contact
```

Test Norwegian locales:
```bash
curl -I https://about.glasscode.academy/nb
curl -I https://about.glasscode.academy/nn
```

Test case studies:
```bash
curl -I https://about.glasscode.academy/en/work/askoy-rocketre
curl -I https://about.glasscode.academy/en/work/glasscode-academy
curl -I https://about.glasscode.academy/en/work/epstein-investigation-project
curl -I https://about.glasscode.academy/en/work/racehub
```

### 3. Browser Testing

**Required Tests:**
- ✅ Visit https://about.glasscode.academy/en
- ✅ Verify green padlock (HTTPS)
- ✅ Test navigation between all pages
- ✅ Test language switcher (en, nb, nn)
- ✅ Test work page filters (keyboard navigation)
- ✅ Test contact form submission
- ✅ Verify responsive design (mobile, tablet, desktop)
- ✅ Test keyboard navigation (Tab key)
- ✅ Verify all external links open in new tabs

### 4. Contact Form Testing

Submit test form:
```bash
curl -X POST https://about.glasscode.academy/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "organisation": "Test Org",
    "projectType": "product",
    "budget": "50k_100k",
    "message": "This is a test submission to verify the contact form is working correctly in production.",
    "locale": "en"
  }'
```

Check server logs:
```bash
pm2 logs about-glasscode-academy --lines 50
```

## Monitoring

### PM2 Dashboard

```bash
# View application status
pm2 list

# Monitor in real-time
pm2 monit

# View logs
pm2 logs about-glasscode-academy

# Restart application
pm2 restart about-glasscode-academy

# Stop application
pm2 stop about-glasscode-academy
```

### Log Locations

- **Application logs**: `pm2 logs about-glasscode-academy`
- **Nginx access log**: `/var/log/nginx/access.log`
- **Nginx error log**: `/var/log/nginx/error.log`

## Updating the Application

```bash
# 1. Pull latest changes
cd /var/www/about-glasscode-academy
git pull origin main

# 2. Install new dependencies (if any)
npm install

# 3. Rebuild
npm run build

# 4. Restart PM2
pm2 restart about-glasscode-academy

# 5. Verify
curl -I http://localhost:3000/en
```

## Rollback Procedure

If deployment fails:

```bash
# 1. Check out previous working version
git log --oneline -5  # Find working commit
git checkout <commit-hash>

# 2. Rebuild
npm install
npm run build

# 3. Restart
pm2 restart about-glasscode-academy
```

## Performance Optimization

### Recommended Next Steps

1. **CDN Configuration**
   - Configure Cloudflare caching rules
   - Enable Auto Minify (JS, CSS, HTML)
   - Enable Brotli compression

2. **Monitoring Setup**
   - Set up uptime monitoring
   - Configure error alerts
   - Enable analytics

3. **Backup Strategy**
   - Database backups (if added later)
   - Content backups
   - Configuration backups

## Security Checklist

- ✅ HTTPS enabled
- ✅ HTTP redirects to HTTPS
- ✅ Security headers configured
- ✅ Contact form validation (client & server)
- ✅ Input sanitization in API routes
- ✅ No sensitive data in logs
- ⏳ Rate limiting (TODO: implement if needed)
- ⏳ CSRF protection (TODO: implement if needed)

## Support & Troubleshooting

### Common Issues

**Issue: Port 3000 already in use**
```bash
lsof -ti:3000 | xargs kill -9
pm2 restart about-glasscode-academy
```

**Issue: Application not responding**
```bash
pm2 logs about-glasscode-academy --lines 100
pm2 restart about-glasscode-academy
```

**Issue: Nginx 502 Bad Gateway**
```bash
# Check if application is running
pm2 list

# Check application logs
pm2 logs about-glasscode-academy

# Restart application
pm2 restart about-glasscode-academy
```

**Issue: Translation not displaying**
- Verify locale files exist: `/messages/en.json`, `/messages/nb.json`, `/messages/nn.json`
- Check for JSON syntax errors
- Rebuild application

## Environment Variables

Currently no environment variables required. For future email/CRM integration:

```bash
# Create .env.local file
cat > .env.local << EOF
# Email Service
EMAIL_SERVICE_API_KEY=your_api_key
CONTACT_EMAIL=contact@glasscode.academy
FROM_EMAIL=noreply@glasscode.academy

# CRM Integration
CRM_API_KEY=your_crm_key
CRM_API_URL=https://api.yourcrm.com
EOF

# Restart to load new environment
pm2 restart about-glasscode-academy
```

## Deployment Completed

**Date**: 2025-12-03
**Version**: Production-ready v1.0
**Status**: ✅ All systems operational

---

For questions or issues, refer to the project repository or contact the development team.
