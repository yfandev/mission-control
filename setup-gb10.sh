#!/usr/bin/env bash
# One-shot setup for Mission Control on the Dell Pro Max GB10 (Ubuntu, ARM64).
#   bash setup-gb10.sh                 # full setup, then start Mission Control
#   MODEL=nemotron-3.5-super:120b bash setup-gb10.sh
#   SKIP_COPY=1 bash setup-gb10.sh     # models already on the GB10
#   COPY_ALL=1 bash setup-gb10.sh      # copy every model on the drive, not just MODEL
# Safe to re-run: finished steps are skipped.
set -euo pipefail

MODEL="${MODEL:-nemotron-3-super:120b}"
MIN_OLLAMA="0.40.5"
PORT="${PORT:-8080}"
HERE="$(cd "$(dirname "$0")" && pwd)"

step() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓ %s\033[0m\n' "$*"; }
warn() { printf '    \033[33m! %s\033[0m\n' "$*"; }
die()  { printf '    \033[31m✗ %s\033[0m\n' "$*"; exit 1; }
ask()  { read -rp "    $1 [y/N] " a; [[ "$a" =~ ^[Yy] ]]; }
version_ge() { [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -1)" = "$2" ]; }

step "Administrator access (asked once)"
sudo -v
while true; do sudo -n true; sleep 50; kill -0 "$$" 2>/dev/null || exit; done 2>/dev/null &
ok "sudo ready"

# ---------------------------------------------------------------- 1. Ollama
step "Ollama"
if ! command -v ollama >/dev/null; then
  warn "Ollama is not installed."
  ask "Install it now from ollama.com (needs internet)?" || die "Install Ollama, then re-run."
  curl -fsSL https://ollama.com/install.sh | sh
fi
OV="$(ollama --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | tail -1)"
if ! version_ge "$OV" "$MIN_OLLAMA"; then
  warn "Ollama $OV is older than $MIN_OLLAMA (needed for Nemotron 3.5)."
  if ask "Update Ollama now (needs internet)?"; then curl -fsSL https://ollama.com/install.sh | sh; else warn "Continuing with $OV"; fi
fi
ok "Ollama $(ollama --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | tail -1)"

MODELS_DIR="$(systemctl show ollama -p Environment 2>/dev/null | grep -oE 'OLLAMA_MODELS=[^ ]+' | cut -d= -f2 || true)"
MODELS_DIR="${MODELS_DIR:-/usr/share/ollama/.ollama/models}"
ok "models folder: $MODELS_DIR"

# ---------------------------------------------------------------- 2. Copy models from LLMDRIVE
if [ "${SKIP_COPY:-0}" != 1 ]; then
  step "Copy models from the USB drive"
  DRIVE="${DRIVE:-$(ls -d /media/*/LLMDRIVE /media/*/*/LLMDRIVE /mnt/LLMDRIVE 2>/dev/null | head -1 || true)}"
  [ -n "$DRIVE" ] && [ -d "$DRIVE/ollama/models" ] || die "LLMDRIVE not found. Plug it in (USB-C adapter if needed) or set DRIVE=/path."
  SRC="$DRIVE/ollama/models"
  ok "drive: $DRIVE"

  if [ "${COPY_ALL:-0}" = 1 ]; then
    MANIFESTS=$(find "$SRC/manifests" -type f ! -name '._*')
  else
    NAME="${MODEL%%:*}"; TAG="${MODEL##*:}"
    MANIFESTS="$SRC/manifests/registry.ollama.ai/library/$NAME/$TAG"
    [ -f "$MANIFESTS" ] || die "$MODEL is not on the drive."
  fi

  sudo mkdir -p "$MODELS_DIR/blobs"
  for MAN in $MANIFESTS; do
    REL="${MAN#"$SRC/"}"
    DIGESTS=$(python3 -c "import json,sys;m=json.load(open(sys.argv[1]));print('\n'.join([m['config']['digest']]+[l['digest'] for l in m['layers']]).replace('sha256:','sha256-'))" "$MAN")
    COUNT=$(echo "$DIGESTS" | wc -l)
    echo "    $REL ($COUNT files)"
    echo "$DIGESTS" | sed 's|^|blobs/|' > /tmp/mc-files.txt
    echo "$REL" >> /tmp/mc-files.txt
    sudo rsync -a --size-only --info=progress2 --files-from=/tmp/mc-files.txt "$SRC/" "$MODELS_DIR/"
  done
  sudo chown -R ollama:ollama "$MODELS_DIR" 2>/dev/null || true
  ok "models copied"
fi

# ---------------------------------------------------------------- 3. Multi-agent settings
step "Ollama settings for parallel agents"
CONF=/etc/systemd/system/ollama.service.d/mission-control.conf
sudo mkdir -p "$(dirname "$CONF")"
sudo tee "$CONF" >/dev/null <<EOF
[Service]
Environment="OLLAMA_NUM_PARALLEL=4"
Environment="OLLAMA_CONTEXT_LENGTH=16384"
Environment="OLLAMA_KEEP_ALIVE=-1"
EOF
sudo systemctl daemon-reload
sudo systemctl restart ollama
for i in $(seq 1 60); do curl -sf http://127.0.0.1:11434/api/version >/dev/null && break; sleep 1; done
curl -sf http://127.0.0.1:11434/api/version >/dev/null || die "Ollama did not come back up (journalctl -u ollama)."
ok "4 parallel requests, 16K context, model kept loaded"

ollama list | grep -q "^$MODEL" || die "$MODEL not visible to Ollama. Check 'ollama list'."
ok "$MODEL is installed"

# ---------------------------------------------------------------- 4. Load + speed test
step "Loading $MODEL and measuring speed (first load can take a minute)"
RESULT=$(curl -s http://127.0.0.1:11434/api/generate -d "{\"model\":\"$MODEL\",\"prompt\":\"A supplier just failed. In 3 bullet points, what should procurement do?\",\"stream\":false,\"think\":false,\"keep_alive\":-1}")
python3 - "$RESULT" <<'EOF'
import json,sys
d=json.loads(sys.argv[1])
if 'error' in d: sys.exit(f"    ✗ {d['error']}")
tps=d['eval_count']/(d['eval_duration']/1e9)
print(f"    ✓ load {d.get('load_duration',0)/1e9:.1f}s · prompt {d['prompt_eval_count']} tok · generate {tps:.1f} tokens/sec")
EOF

# ---------------------------------------------------------------- 5. Node.js
step "Node.js"
if ! command -v node >/dev/null || ! version_ge "$(node -v | tr -d v)" "18.0.0"; then
  warn "Node.js 18+ is required."
  ask "Install Node.js with apt (needs internet)?" && sudo apt-get update -qq && sudo apt-get install -y -qq nodejs || die "Install Node 18+, then re-run."
fi
ok "node $(node -v)"

# ---------------------------------------------------------------- 6. Telegram (optional)
step "Telegram (optional)"
if [ -z "${TELEGRAM_BOT_TOKEN:-}" ]; then
  read -rsp "    Paste the Telegram bot token (input hidden), or press Enter to skip: " TELEGRAM_BOT_TOKEN; echo
fi
[ -n "$TELEGRAM_BOT_TOKEN" ] && ok "Telegram enabled" || warn "Telegram skipped"
export TELEGRAM_BOT_TOKEN

# ---------------------------------------------------------------- 7. Start
step "Starting Mission Control on http://localhost:$PORT"
echo "    Open it in the browser on the GB10. Ctrl-C to stop."
cd "$HERE"
MODEL="$MODEL" PORT="$PORT" exec node server/server.js
