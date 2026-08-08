#!/usr/bin/env bash

# Prepare the media subset served from the production R2 bucket.
# WebP derivatives are public media; JPEG originals stay in the repository
# unless a page still directly references the listed JPEG file.
set -euo pipefail

repo_dir="$(cd "$(dirname "$0")/.." && pwd)"
output_dir="$repo_dir/.cloudflare-media"

rm -rf "$output_dir"
mkdir -p "$output_dir"

while IFS= read -r -d '' source_path; do
  relative_path="${source_path#"$repo_dir/"}"
  mkdir -p "$output_dir/$(dirname "$relative_path")"
  cp "$source_path" "$output_dir/$relative_path"
done < <(find "$repo_dir/assets" "$repo_dir/photos_1" -type f -iname '*.webp' -print0)

direct_jpegs=(
  'assets/images/reading/chat-work-codex-boundaries/illustration.jpg'
  "assets/images/ai/裴多菲诗意/4-warm1-j2'3-2160-mz.jpg"
  'assets/images/tools/yingke-exif.jpg'
  'assets/images/tools/yingji-exif-v1-1.jpg'
  'photos_1/路.jpg'
  'photos_1/独处一隅.jpg'
  'assets/images/reading/prague-cemetery/old-jewish-cemetery.jpg'
)

for relative_path in "${direct_jpegs[@]}"; do
  mkdir -p "$output_dir/$(dirname "$relative_path")"
  cp "$repo_dir/$relative_path" "$output_dir/$relative_path"
done

printf 'Prepared %s public media files in %s\n' \
  "$(find "$output_dir" -type f | wc -l | tr -d ' ')" \
  "$output_dir"
