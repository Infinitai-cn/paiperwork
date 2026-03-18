#!/usr/bin/env bash
set -euo pipefail

# Total-mirror deployment for Hugging Face Space.
# This script stages runtime files and performs a root upload with --delete,
# so remote state matches local staging exactly (including deletions).

SPACE_REPO="${1:-Infinitai/Paiperwork}"
COMMIT_MESSAGE="${2:-Mirror deploy from local build}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BUILD_DIR="$REPO_ROOT/dist/linux"

SERVER_BIN="$BUILD_DIR/Paiperwork-server"
APP_DIR="$BUILD_DIR/app"
DOCKERFILE_SRC="$REPO_ROOT/deployment/huggingface-space/Dockerfile"
README_SRC="$REPO_ROOT/deployment/huggingface-space/README.md"

if [[ ! -f "$SERVER_BIN" ]]; then
  echo "ERROR: Missing server binary at $SERVER_BIN"
  echo "Run build first:"
  echo "  cd $REPO_ROOT/dev/server && bash ./build.sh"
  exit 1
fi

if [[ ! -d "$APP_DIR" ]]; then
  echo "ERROR: Missing app folder at $APP_DIR"
  echo "Run build first:"
  echo "  cd $REPO_ROOT/dev/server && bash ./build.sh"
  exit 1
fi

if [[ ! -f "$DOCKERFILE_SRC" || ! -f "$README_SRC" ]]; then
  echo "ERROR: Missing deployment template files under deployment/huggingface-space"
  exit 1
fi

WORK_BASE="${TMPDIR:-/tmp}"
STAGE_DIR="$WORK_BASE/hf-space-stage-${SPACE_REPO//\//-}"

rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR"

# Stage the exact runtime payload we want in Space root.
cp "$DOCKERFILE_SRC" "$STAGE_DIR/Dockerfile"
cp "$README_SRC" "$STAGE_DIR/README.md"
cp "$SERVER_BIN" "$STAGE_DIR/Paiperwork-server"
rsync -a --delete "$APP_DIR/" "$STAGE_DIR/app/"

if ! command -v hf >/dev/null 2>&1; then
  echo "ERROR: 'hf' CLI not found. Install it first."
  exit 1
fi

# Mirror root by uploading staged folder to '.' and deleting everything else.
HF_UPLOAD_ARGS=(upload "$SPACE_REPO" "$STAGE_DIR" . --repo-type space --delete "*" --commit-message "$COMMIT_MESSAGE")

# Optional explicit token override for CI/multi-token setups.
if [[ -n "${HF_TOKEN:-}" ]]; then
  if [[ "${HF_TOKEN}" != hf_* ]]; then
    echo "ERROR: HF_TOKEN looks malformed. Hugging Face tokens must start with 'hf_'."
    echo "Create a new write-capable token at https://huggingface.co/settings/tokens and retry."
    exit 1
  fi
  HF_UPLOAD_ARGS+=(--token "$HF_TOKEN")
fi

if ! hf "${HF_UPLOAD_ARGS[@]}"; then
  echo "ERROR: hf upload failed."
  echo "If this is an authentication issue, run:"
  echo "  hf auth login"
  echo "  hf auth whoami"
  echo "  hf auth list"
  echo "Or pass an explicit write token for this run:"
  echo "  HF_TOKEN=hf_xxx ./deployment/huggingface-space/deploy-mirror.sh $SPACE_REPO \"$COMMIT_MESSAGE\""
  echo "And ensure the selected token has write access to ${SPACE_REPO}."
  exit 1
fi

echo "Mirror deploy completed via hf upload: ${SPACE_REPO}"
