#!/bin/bash
set -euo pipefail
curl -s http://127.0.0.1:3000/api/health || { echo "upstream health failed"; exit 1; }
pm2 status >/dev/null 2>&1 || { echo "pm2 missing or app not managed"; exit 1; }
ss -ltnp | grep ':3000' >/dev/null 2>&1 || { echo "port 3000 not listening"; exit 1; }
echo "upstream ok"
