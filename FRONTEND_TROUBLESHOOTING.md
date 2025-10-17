# Frontend Troubleshooting Guide

This guide addresses common stability issues with the GlassCode Academy frontend, particularly the `glasscode-frontend.service` timeouts and module loading errors.

## Common Issues and Solutions

### 1. Service Timeout Issues

**Problem**: `Job for glasscode-frontend.service failed because a timeout was exceeded`

**Root Causes**:
- Next.js build artifacts corruption
- Concurrent processes interfering with startup
- Insufficient startup time allocation
- Memory pressure during startup

**Solutions**:
1. Use the robust restart script: `./restart-frontend.sh`
2. For production: Use the improved update script: `./update-improved.sh`
3. Manual recovery steps (see below)

### 2. Module Loading Errors

**Problem**: `Error: Cannot find module './8548.js'`

**Root Causes**:
- Webpack chunk corruption during hot reloads
- Incomplete builds due to process interruption
- Cache inconsistencies between development and production builds
- Race conditions during concurrent builds

**Solutions**:
1. Clean rebuild with the restart script
2. Clear all build caches
3. Ensure no concurrent Next.js processes

### 3. Frequent Crashes

**Problem**: Application crashes frequently with various module errors

**Root Causes**:
- Memory leaks in development mode
- File system watchers overwhelming the system
- Incomplete dependency installations
- Conflicting Node.js versions

**Solutions**:
1. Use standalone mode for better stability
2. Regular process restarts
3. Monitor memory usage
4. Use the improved deployment scripts

## Quick Recovery Commands

### Immediate Fix (Development)
```bash
# Kill all Next.js processes
pkill -f "next-server|next dev" || true

# Use the robust restart script
cd /Users/veland/GlassCodeAcademy
./restart-frontend.sh
```

### Production Recovery
```bash
# Use the improved update script
cd /Users/veland/GlassCodeAcademy
sudo ./update-improved.sh
```

### Manual Recovery Steps
```bash
cd /Users/veland/GlassCodeAcademy/glasscode/frontend

# 1. Stop all processes
pkill -f "next-server|next dev" || true

# 2. Clean build artifacts
rm -rf .next/cache
rm -rf .next/server/chunks/*.js
rm -rf .next/standalone/.next/cache

# 3. Verify dependencies
if [ "package.json" -nt "node_modules/.package-lock.json" ]; then
    rm -rf node_modules package-lock.json
    npm install
fi

# 4. Clean rebuild
npm run build

# 5. Start in standalone mode
cd .next/standalone
nohup node server.js -p 3000 > ../frontend.log 2>&1 &
```

## Prevention Strategies

### 1. Use Improved Scripts
- **restart-frontend.sh**: For quick development restarts
- **update-improved.sh**: For production deployments
- Both scripts include proper cleanup and verification

### 2. Monitor Resource Usage
```bash
# Check memory usage
ps aux | grep -E "(next|node)" | awk '{print $4, $11}' | sort -nr

# Check file descriptors
lsof -p $(pgrep -f "next-server") | wc -l
```

### 3. Regular Maintenance
```bash
# Weekly cleanup (add to cron)
cd /Users/veland/GlassCodeAcademy/glasscode/frontend
rm -rf .next/cache
npm prune
```

## Script Features

### restart-frontend.sh Features
- ✅ Kills conflicting processes
- ✅ Cleans problematic build artifacts
- ✅ Verifies dependencies
- ✅ Performs clean rebuild
- ✅ Starts in stable standalone mode
- ✅ Health checks with timeout
- ✅ Detailed logging

### update-improved.sh Features
- ✅ Enhanced service monitoring
- ✅ Graceful shutdown handling
- ✅ Build artifact verification
- ✅ Improved timeout handling
- ✅ Better error diagnostics
- ✅ Health checks with retries
- ✅ Rollback capabilities

## Monitoring and Diagnostics

### Check Service Status
```bash
# For systemd environments
systemctl status glasscode-frontend
journalctl -u glasscode-frontend -n 50

# For development
ps aux | grep -E "(next|node.*3000)"
curl -s http://localhost:3000 >/dev/null && echo "OK" || echo "FAILED"
```

### Log Locations
- Development: `/Users/veland/GlassCodeAcademy/glasscode/frontend/.next/frontend.log`
- Production: `journalctl -u glasscode-frontend`

### Performance Monitoring
```bash
# Memory usage over time
while true; do
    ps aux | grep -E "(next|node.*3000)" | awk '{print strftime("%Y-%m-%d %H:%M:%S"), $4"% memory", $11}'
    sleep 30
done
```

## Configuration Recommendations

### For Development
- Use standalone mode for better stability
- Regular restarts (every few hours)
- Monitor memory usage
- Use the restart script for quick recovery

### For Production
- Use systemd service with proper timeouts
- Implement health checks
- Use the improved update script
- Monitor logs regularly

### Environment Variables
```bash
# Add to .env for better stability
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
NODE_OPTIONS="--max-old-space-size=4096"
```

## Emergency Contacts and Escalation

If issues persist after following this guide:

1. Check system resources (disk space, memory, CPU)
2. Verify Node.js and npm versions
3. Check for system-level issues (file descriptor limits, etc.)
4. Consider upgrading Next.js version
5. Review application code for memory leaks

## Version History

- v1.0: Initial troubleshooting guide
- v1.1: Added improved scripts and prevention strategies
- v1.2: Enhanced monitoring and diagnostics section