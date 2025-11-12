# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
# Alert Runbooks - GlassCode Academy

This document provides detailed troubleshooting steps for each alert defined in our monitoring system.

## Table of Contents
- [Critical Alerts](#critical-alerts)
  - [ServiceDown](#servicedown)
  - [HighErrorRate](#higherrorrate)
  - [DatabaseConnectionPoolExhausted](#databaseconnectionpoolexhausted)
  - [MemoryUsageCritical](#memoryusagecritical)
- [Warning Alerts](#warning-alerts)
  - [HighLatency](#highlatency)
  - [SlowDatabaseQueries](#slowdatabasequeries)
  - [LowCacheHitRate](#lowcachehitrate)
  - [CPUUsageHigh](#cpuusagehigh)
  - [DiskSpaceLow](#diskspacelow)
  - [HighRequestRate](#highrequestrate)

---

## Critical Alerts

### ServiceDown

**Alert Trigger**: Service has been down for more than 2 minutes

**Impact**: Complete service outage - all users affected

**Immediate Actions**:
1. Check service status:
   ```bash
   systemctl status glasscode-backend
   # or for Docker
   docker ps | grep glasscode-backend
   ```

2. Check if process is running:
   ```bash
   ps aux | grep node
   ```

3. Check recent logs:
   ```bash
   # Systemd
   journalctl -u glasscode-backend -n 100 --no-pager
   
   # Docker
   docker logs glasscode-backend --tail 100
   ```

4. If service crashed, restart it:
   ```bash
   # Systemd
   sudo systemctl restart glasscode-backend
   
   # Docker
   docker restart glasscode-backend
   ```

**Root Cause Investigation**:
- Check for OOM kills: `dmesg | grep -i oom`
- Review application error logs
- Check disk space: `df -h`
- Verify port is not in use: `netstat -tulpn | grep 8080`
- Check network connectivity to dependencies (database, Redis)

**Prevention**:
- Implement health checks with automatic restarts
- Set up resource limits and monitoring
- Configure proper logging and log rotation

---

### HighErrorRate

**Alert Trigger**: 5xx error rate > 5% for 5 minutes

**Impact**: Significant user impact - many requests failing

**Immediate Actions**:
1. Check error distribution:
   ```bash
   # Check recent error logs
   tail -f /var/log/glasscode/error.log | grep "500\|502\|503"
   ```

2. Identify error patterns:
   ```bash
   # Group errors by type
   grep "ERROR" /var/log/glasscode/app.log | awk '{print $NF}' | sort | uniq -c | sort -rn
   ```

3. Check database connectivity:
   ```bash
   # Test database connection
   psql -h localhost -U glasscode_user -d glasscode_db -c "SELECT 1"
   ```

4. Check external service status:
   - Verify Redis is accessible
   - Check Sentry for error clustering
   - Review recent deployments

**Common Causes & Fixes**:
- **Database connection issues**: Restart database connection pool
- **Recent deployment bug**: Rollback to previous version
- **External API failures**: Implement circuit breaker, check API status
- **Memory leak**: Restart service, investigate with memory profiler

**Root Cause Investigation**:
```bash
# Analyze error frequency by endpoint
grep "ERROR" app.log | grep -oP '/api/[^ ]+' | sort | uniq -c | sort -rn

# Check for specific error messages
grep "ERROR" app.log | tail -100 | grep -oP 'Error: [^"]+' | sort | uniq -c
```

**Prevention**:
- Implement comprehensive error handling
- Add retry logic for transient failures
- Monitor error rates per endpoint
- Regular code reviews for error handling

---

### DatabaseConnectionPoolExhausted

**Alert Trigger**: Connection pool usage > 90% for 5 minutes

**Impact**: Application may start rejecting requests

**Immediate Actions**:
1. Check current pool status:
   ```bash
   # Query active connections
   psql -c "SELECT count(*) FROM pg_stat_activity WHERE datname='glasscode_db';"
   ```

2. Identify long-running queries:
   ```bash
   psql -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
            FROM pg_stat_activity 
            WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '1 minute'
            ORDER BY duration DESC;"
   ```

3. Kill problematic queries if necessary:
   ```bash
   psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity 
            WHERE pid != pg_backend_pid() AND query_start < now() - interval '5 minutes';"
   ```

4. Temporary fix - increase pool size:
   ```bash
   # Update environment variable
   export DB_POOL_MAX=10  # Increase from default 5
   # Restart service
   ```

**Common Causes**:
- Connection leaks (connections not properly released)
- Long-running transactions
- Deadlocks
- N+1 query problems
- Missing connection timeout configuration

**Root Cause Investigation**:
```javascript
// Add connection pool monitoring
const pool = sequelize.connectionManager.pool;
console.log({
  size: pool.size,
  available: pool.available,
  using: pool.using,
  waiting: pool.waiting
});
```

**Prevention**:
- Always use try/finally to release connections
- Set query timeouts
- Monitor connection pool metrics
- Use connection pooler (pgBouncer) for large-scale deployments

---

### MemoryUsageCritical

**Alert Trigger**: Memory usage > 85% for 5 minutes

**Impact**: Risk of OOM kill, severe performance degradation

**Immediate Actions**:
1. Check current memory usage:
   ```bash
   free -h
   ps aux --sort=-%mem | head -10
   ```

2. Generate heap snapshot (Node.js):
   ```bash
   # Send SIGUSR2 to trigger heap dump
   kill -USR2 <pid>
   # or use Node.js inspector
   node --inspect=9229 server.js
   ```

3. Identify memory consumers:
   ```bash
   # Check process memory
   pmap -x <pid> | tail -1
   
   # Monitor in real-time
   top -p <pid>
   ```

4. Restart service if critical:
   ```bash
   systemctl restart glasscode-backend
   ```

**Common Causes**:
- Memory leaks (event listeners, global variables)
- Large data structures in memory
- Unclosed database cursors
- File descriptors not closed
- Cache growing unbounded

**Root Cause Investigation**:
```javascript
// Add memory monitoring
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${Math.round(mem.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(mem.external / 1024 / 1024)}MB`
  });
}, 60000);
```

**Prevention**:
- Use memory profiling tools (clinic.js, heapdump)
- Implement proper pagination
- Set max cache sizes
- Use streams for large data processing
- Monitor memory metrics continuously

---

## Warning Alerts

### HighLatency

**Alert Trigger**: p95 latency > 500ms for 10 minutes

**Impact**: Poor user experience, slow page loads

**Immediate Actions**:
1. Check slow endpoints:
   ```bash
   # Analyze access logs for slow requests
   awk '$10 > 500 {print $7, $10}' /var/log/nginx/access.log | sort -k2 -rn | head -20
   ```

2. Check cache hit rate:
   ```bash
   # Redis stats
   redis-cli INFO stats | grep hit
   ```

3. Identify slow database queries:
   ```bash
   # PostgreSQL slow query log
   tail -f /var/log/postgresql/postgresql-slow.log
   ```

4. Check for N+1 queries:
   ```bash
   # Enable Sequelize logging temporarily
   SEQUELIZE_LOGGING=true npm start
   ```

**Common Causes & Fixes**:
- **Low cache hit rate**: Review cache strategy, increase TTLs
- **Slow DB queries**: Add indexes, optimize queries
- **External API delays**: Implement timeouts, use async operations
- **High server load**: Scale horizontally, optimize code

---

### SlowDatabaseQueries

**Alert Trigger**: p95 query latency > 500ms for 5 minutes

**Impact**: Database bottleneck affecting all operations

**Immediate Actions**:
1. Identify slow queries:
   ```sql
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements
   ORDER BY mean_time DESC
   LIMIT 10;
   ```

2. Check for missing indexes:
   ```sql
   SELECT schemaname, tablename, attname, n_distinct, correlation
   FROM pg_stats
   WHERE tablename IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public')
   ORDER BY correlation DESC;
   ```

3. Analyze query plan:
   ```sql
   EXPLAIN ANALYZE <slow_query>;
   ```

**Common Fixes**:
- Add indexes on frequently queried columns
- Update table statistics: `ANALYZE table_name;`
- Optimize joins and subqueries
- Use query result caching

---

### LowCacheHitRate

**Alert Trigger**: Cache hit rate < 70% for 15 minutes

**Impact**: Increased database load, higher latencies

**Immediate Actions**:
1. Check cache statistics:
   ```bash
   redis-cli INFO stats
   ```

2. Review cache configuration:
   ```bash
   # Check TTL distribution
   redis-cli --scan --pattern '*' | xargs -L 1 redis-cli TTL
   ```

3. Analyze cache misses:
   ```bash
   # Monitor cache operations
   redis-cli MONITOR | grep -E 'GET|SET'
   ```

**Common Causes**:
- TTLs too short
- Cache invalidation too aggressive
- Cache size too small
- Wrong caching strategy
- Cold cache after restart

**Fixes**:
- Increase TTLs for stable data
- Implement cache warming
- Review invalidation logic
- Increase cache memory limit

---

### CPUUsageHigh

**Alert Trigger**: CPU usage > 80% for 10 minutes

**Impact**: Performance degradation, slower response times

**Immediate Actions**:
1. Identify CPU-intensive processes:
   ```bash
   top -o %CPU
   pidstat 1 5
   ```

2. Profile application:
   ```bash
   # Node.js profiling
   node --prof server.js
   node --prof-process isolate-*-v8.log > processed.txt
   ```

3. Check for infinite loops or heavy computations:
   ```bash
   # Sample stack traces
   kill -USR1 <pid>  # Triggers stack trace in logs
   ```

**Common Causes**:
- Inefficient algorithms
- Regular expression catastrophic backtracking
- Synchronous blocking operations
- Missing query optimization
- High request volume

---

## Contact & Escalation

### On-Call Rotation
- **Primary**: Check PagerDuty schedule
- **Secondary**: DevOps team lead
- **Escalation**: CTO

### Communication Channels
- **Critical Issues**: #incidents (Slack)
- **Updates**: #devops (Slack)
- **Post-Mortem**: JIRA ticket + Google Doc

### Resources
- **Monitoring**: https://grafana.glasscode.academy
- **Logs**: https://kibana.glasscode.academy  
- **Status Page**: https://status.glasscode.academy

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
