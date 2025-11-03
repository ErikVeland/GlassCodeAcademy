# Monitoring & Alerting Deployment Guide

This guide explains how to deploy and configure the monitoring and alerting stack for GlassCode Academy.

## Overview

**Stack Components**:
- **Prometheus**: Metrics collection and storage
- **Alertmanager**: Alert routing and notification  
- **Grafana**: Visualization and dashboards
- **Node Exporter**: System metrics (CPU, memory, disk)
- **Application**: Custom application metrics

## Prerequisites

- Docker and Docker Compose installed
- Slack webhook URL for notifications
- SMTP credentials for email alerts (optional)
- Domain names configured (monitoring.glasscode.academy)

## Quick Start

### 1. Set Environment Variables

Create `.env.monitoring` file:
```bash
# Alertmanager Configuration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SMTP_PASSWORD=your-app-specific-password

# Grafana Configuration
GF_SECURITY_ADMIN_PASSWORD=secure_admin_password
GF_SERVER_ROOT_URL=https://grafana.glasscode.academy

# Prometheus Configuration  
PROMETHEUS_RETENTION=30d
```

### 2. Deploy with Docker Compose

```bash
cd backend-node
docker-compose -f docker-compose.monitoring.yml up -d
```

### 3. Verify Deployment

```bash
# Check services are running
docker-compose -f docker-compose.monitoring.yml ps

# Expected output:
# prometheus     Up      9090/tcp
# alertmanager   Up      9093/tcp  
# grafana        Up      3000/tcp
# node-exporter  Up      9100/tcp
```

### 4. Access Dashboards

- **Prometheus**: http://localhost:9090
- **Alertmanager**: http://localhost:9093
- **Grafana**: http://localhost:3000 (admin/password from .env)

## Detailed Configuration

### Prometheus Setup

**Configuration File**: `prometheus.yml`

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.rules"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: 'glasscode-backend'
    static_configs:
      - targets: ['host.docker.internal:9464']
    
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']
```

**Alert Rules**: See `alerts.rules` for comprehensive alert definitions

**Testing Alerts**:
```bash
# Check alert rules are loaded
curl http://localhost:9090/api/v1/rules | jq .

# Check current alerts
curl http://localhost:9090/api/v1/alerts | jq .
```

### Alertmanager Setup

**Configuration File**: `alertmanager.yml`

**Key Features**:
- Severity-based routing (critical/warning/info)
- Multi-channel notifications (Slack + Email)
- Alert grouping and deduplication
- Inhibition rules to prevent alert storms

**Testing Alertmanager**:
```bash
# Send test alert
curl -X POST http://localhost:9093/api/v1/alerts -d '[{
  "labels": {
    "alertname": "TestAlert",
    "severity": "warning"
  },
  "annotations": {
    "summary": "Test alert",
    "description": "This is a test"
  }
}]'
```

**Verify Slack Integration**:
1. Send test alert (above)
2. Check #alerts-warning Slack channel
3. Verify message format and content

### Grafana Setup

**Initial Configuration**:
1. Login with admin credentials
2. Add Prometheus data source:
   - URL: `http://prometheus:9090`
   - Access: Server (default)
   - Save & Test

**Import Dashboards**:
```bash
# Use pre-configured dashboard
cp grafana-dashboard.json /var/lib/grafana/dashboards/

# Or import via UI:
# 1. Click + icon → Import
# 2. Upload grafana-dashboard.json
# 3. Select Prometheus data source
# 4. Import
```

**Key Dashboards**:
1. **Application Overview**: Request rates, error rates, latencies
2. **System Metrics**: CPU, memory, disk usage
3. **Database Performance**: Query times, connection pool
4. **Cache Performance**: Hit rates, memory usage

## Alert Configuration

### Slack Setup

1. Create Slack App:
   - Go to https://api.slack.com/apps
   - Create New App → From scratch
   - Name: "GlassCode Alerts"

2. Enable Incoming Webhooks:
   - Activate Incoming Webhooks: ON
   - Add New Webhook to Workspace
   - Select channels: #alerts-critical, #alerts-warning, #alerts-info
   - Copy webhook URLs

3. Update `alertmanager.yml`:
   ```yaml
   slack_configs:
   - api_url: 'YOUR_WEBHOOK_URL_HERE'
   ```

4. Restart Alertmanager:
   ```bash
   docker-compose -f docker-compose.monitoring.yml restart alertmanager
   ```

### Email Setup

1. Generate App-Specific Password (Gmail):
   - Go to Google Account → Security
   - 2-Step Verification → App passwords
   - Generate new app password
   - Copy password

2. Set environment variable:
   ```bash
   export SMTP_PASSWORD='your-app-specific-password'
   ```

3. Configure recipients in `alertmanager.yml`:
   ```yaml
   email_configs:
   - to: 'devops@glasscode.academy,oncall@glasscode.academy'
   ```

### PagerDuty Integration (Optional)

```yaml
receivers:
- name: 'critical-alerts'
  pagerduty_configs:
  - service_key: 'YOUR_PAGERDUTY_SERVICE_KEY'
    description: '{{ .GroupLabels.alertname }}'
    severity: '{{ .GroupLabels.severity }}'
```

## Application Metrics

### Exposing Metrics

The application exposes metrics on port 9464 via `/metrics` endpoint.

**Key Metrics Exported**:
```
# HTTP metrics
http_requests_total
http_request_duration_seconds
http_requests_in_flight

# Database metrics
db_query_duration_seconds
db_connection_pool_active
db_connection_pool_max

# Cache metrics
cache_hits_total
cache_misses_total

# System metrics (via Node Exporter)
node_cpu_seconds_total
node_memory_MemTotal_bytes
node_filesystem_avail_bytes
```

### Adding Custom Metrics

```javascript
const promClient = require('prom-client');

// Counter example
const orderCounter = new promClient.Counter({
  name: 'orders_total',
  help: 'Total number of orders',
  labelNames: ['status']
});

orderCounter.inc({ status: 'completed' });

// Histogram example
const requestDuration = new promClient.Histogram({
  name: 'custom_request_duration_seconds',
  help: 'Request duration in seconds',
  buckets: [0.1, 0.5, 1, 2, 5]
});

requestDuration.observe(duration);
```

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check target status:
   ```bash
   curl http://localhost:9090/api/v1/targets | jq .
   ```

2. Verify application metrics endpoint:
   ```bash
   curl http://localhost:9464/metrics
   ```

3. Check network connectivity:
   ```bash
   # From Prometheus container
   docker exec prometheus wget -O- http://host.docker.internal:9464/metrics
   ```

### Alerts Not Firing

1. Check alert rules syntax:
   ```bash
   promtool check rules alerts.rules
   ```

2. Verify alert conditions in Prometheus UI:
   - Go to Alerts page
   - Check "Pending" and "Firing" alerts
   - Review alert expression

3. Check Alertmanager is receiving alerts:
   ```bash
   curl http://localhost:9093/api/v1/alerts | jq .
   ```

### Notifications Not Received

1. Check Alertmanager logs:
   ```bash
   docker logs alertmanager
   ```

2. Test webhook manually:
   ```bash
   curl -X POST ${SLACK_WEBHOOK_URL} -d '{
     \"text\": \"Test notification\"
   }'
   ```

3. Verify routing configuration:
   ```bash
   # Check routing tree
   curl http://localhost:9093/api/v1/status | jq .config.route
   ```

### High Memory Usage

Prometheus stores all metrics in memory. If memory usage is high:

1. Reduce retention period:
   ```yaml
   # prometheus.yml
   global:
     retention: 15d  # Reduce from 30d
   ```

2. Reduce scrape frequency:
   ```yaml
   global:
     scrape_interval: 30s  # Increase from 15s
   ```

3. Limit metric cardinality:
   ```javascript
   // Don't use high-cardinality labels
   // BAD: labelNames: ['user_id']
   // GOOD: labelNames: ['status', 'method']
   ```

## Production Deployment

### Security

1. **Enable Authentication**:
   ```yaml
   # prometheus.yml
   basic_auth:
     username: admin
     password_file: /etc/prometheus/password
   ```

2. **Use HTTPS**:
   ```nginx
   # nginx config
   server {
     listen 443 ssl;
     server_name prometheus.glasscode.academy;
     
     ssl_certificate /etc/ssl/certs/glasscode.crt;
     ssl_certificate_key /etc/ssl/private/glasscode.key;
     
     location / {
       proxy_pass http://localhost:9090;
     }
   }
   ```

3. **Restrict Access**:
   ```yaml
   # docker-compose.yml
   prometheus:
     ports:
       - "127.0.0.1:9090:9090"  # Only accessible from localhost
   ```

### High Availability

1. **Prometheus HA**:
   ```yaml
   # Run multiple Prometheus instances
   prometheus-1:
     image: prom/prometheus
   prometheus-2:
     image: prom/prometheus
   ```

2. **Alertmanager Cluster**:
   ```yaml
   alertmanager:
     command:
       - '--cluster.peer=alertmanager-2:9094'
   ```

3. **Grafana HA**:
   - Use external PostgreSQL database
   - Share dashboards via JSON files
   - Use load balancer

### Backup & Restore

**Backup Prometheus Data**:
```bash
# Create snapshot
curl -X POST http://localhost:9090/api/v1/admin/tsdb/snapshot

# Backup snapshot directory
tar -czf prometheus-backup-$(date +%Y%m%d).tar.gz \
  /var/lib/prometheus/snapshots/
```

**Backup Grafana Dashboards**:
```bash
# Export all dashboards
curl -H \"Authorization: Bearer $GRAFANA_API_KEY\" \
  http://localhost:3000/api/search | jq -r '.[].uid' | \
  while read uid; do
    curl -H \"Authorization: Bearer $GRAFANA_API_KEY\" \
      http://localhost:3000/api/dashboards/uid/$uid > $uid.json
  done
```

## Maintenance

### Regular Tasks

**Weekly**:
- Review alert trends
- Check disk usage
- Verify backup success

**Monthly**:
- Review and update alert thresholds
- Clean old snapshots
- Update documentation

**Quarterly**:
- Review dashboard effectiveness
- Update retention policies
- Conduct alert drills

### Upgrades

```bash
# Backup current configuration
cp prometheus.yml prometheus.yml.backup
cp alertmanager.yml alertmanager.yml.backup

# Pull latest images
docker-compose -f docker-compose.monitoring.yml pull

# Restart with new images
docker-compose -f docker-compose.monitoring.yml up -d

# Verify services
docker-compose -f docker-compose.monitoring.yml ps
```

## Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Alertmanager Guide](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Grafana Tutorials](https://grafana.com/tutorials/)
- [Alert Runbooks](./ALERT_RUNBOOKS.md)

## Support

For monitoring-related issues:
- **Slack**: #devops
- **Email**: devops@glasscode.academy
- **On-Call**: Check PagerDuty schedule

---

**Last Updated**: November 2025  
**Maintained By**: DevOps Team
