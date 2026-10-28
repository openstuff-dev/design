#!/usr/bin/env bash
# Stages every package version that isn't on npm yet. A maintainer then approves
# each one with 2FA (npm stage approve <id>, or on npmjs.com). Needs npm 12+.
# Usage: tools/stage-publish.sh [--dry-run]
set -euo pipefail

flags=(--access public)
[[ "${1:-}" == "--dry-run" ]] && flags+=(--dry-run)
# npm only creates provenance for public repositories.
[[ "${PROVENANCE:-false}" == "true" ]] && flags+=(--provenance)

for dir in packages/*/; do
  name=$(node -p "require('./${dir}package.json').name")
  version=$(node -p "require('./${dir}package.json').version")
  if [[ "$(node -p "require('./${dir}package.json').private === true")" == "true" ]]; then
    continue
  fi
  if npm view "${name}@${version}" version >/dev/null 2>&1; then
    echo "${name}@${version} is already on npm"
    continue
  fi
  echo "Staging ${name}@${version}"
  npm stage publish "./${dir}" "${flags[@]}"
done
