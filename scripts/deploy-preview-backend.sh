#!/usr/bin/env bash
set -euo pipefail

# Inputs from GitHub Actions env:
#   RAILWAY_TOKEN   (Actions secret)
#   RAILWAY_SERVICE (your backend service name, e.g., sniffr-staging)
#   RAILWAY_ENV     (per-PR env name, e.g., pr-123)

# 0) CLI sanity
railway --version >/dev/null 2>&1 || { echo "Railway CLI missing"; exit 1; }

# 1) Create the per-PR environment (idempotent if it exists)
railway environment create --name "$RAILWAY_ENV" >/dev/null 2>&1 || true

# 2) Deploy repository root as the service
railway up --service "$RAILWAY_SERVICE" --root . --environment "$RAILWAY_ENV" -y

# 3) Get the public URL for this service+environment
API_URL=$(railway domain --service "$RAILWAY_SERVICE" --environment "$RAILWAY_ENV" | tail -n1 | tr -d '[:space:]')

echo "api_url=$API_URL" >> "$GITHUB_OUTPUT"
