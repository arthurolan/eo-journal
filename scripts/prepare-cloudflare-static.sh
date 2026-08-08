#!/usr/bin/env bash

# Prepare the exact public static-site tree for Workers Static Assets.
# This only writes the ignored local .cloudflare-static/ directory.
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
output_dir="$repo_dir/.cloudflare-static"

rsync -a --delete \
  --exclude='.DS_Store' \
  --exclude='.git/' \
  --exclude='.cloudflare-static/' \
  --exclude='.gitignore' \
  --exclude='AGENTS.md' \
  --exclude='HANDOFF.md' \
  --exclude='README.md' \
  --exclude='docs/' \
  --exclude='scripts/' \
  --exclude='wrangler.jsonc' \
  "$repo_dir/" "$output_dir/"

printf 'Prepared %s public files in %s\n' \
  "$(find "$output_dir" -type f | wc -l | tr -d ' ')" \
  "$output_dir"
