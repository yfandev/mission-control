#!/usr/bin/env bash
# Connect a NemoClaw/OpenClaw sandbox to Mission Control:
#   1. upload the mission-control skill into the sandbox workspace
#   2. add an OpenShell policy preset that allows ONLY the Mission Control API
# Usage: bash openclaw/install.sh [sandbox-name]      (default: my-assistant)
#   MC_HOST=192.168.1.42 MC_PORT=8080 bash openclaw/install.sh my-assistant
set -euo pipefail

SANDBOX="${1:-my-assistant}"
MC_PORT="${MC_PORT:-8080}"
MC_HOST="${MC_HOST:-$(hostname -I 2>/dev/null | awk '{print $1}')}"
HERE="$(cd "$(dirname "$0")" && pwd)"
MC_URL="http://${MC_HOST}:${MC_PORT}"

say() { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
die() { printf '    \033[31m✗ %s\033[0m\n' "$*"; exit 1; }

command -v nemoclaw >/dev/null || die "nemoclaw not found. Install NemoClaw first (docs/openclaw.md, step 2)."
[ -n "$MC_HOST" ] || die "Could not detect this machine's IP. Set MC_HOST=<ip>."

say "Checking Mission Control at $MC_URL"
curl -sf "$MC_URL/api/state" >/dev/null || die "Mission Control is not answering at $MC_URL. Start it first (bash setup-gb10.sh)."
echo "    ✓ reachable"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$TMP/mission-control"
sed "s|__MC_URL__|$MC_URL|g" "$HERE/skills/mission-control/SKILL.md" > "$TMP/mission-control/SKILL.md"
sed -e "s|__MC_HOST__|$MC_HOST|g" -e "s|__MC_PORT__|$MC_PORT|g" "$HERE/policy/mission-control.yaml.template" > "$TMP/mission-control.yaml"

say "Uploading the mission-control skill into sandbox '$SANDBOX'"
nemoclaw "$SANDBOX" upload "$TMP/mission-control" /sandbox/.openclaw/workspace/skills/
echo "    ✓ skill uploaded to /sandbox/.openclaw/workspace/skills/mission-control"

say "OpenShell policy: allow only $MC_HOST:$MC_PORT (GET /api/state, POST /api/inbound, POST /chaos/*)"
nemoclaw "$SANDBOX" policy add --from-file "$TMP/mission-control.yaml" --trusted-private-host "$MC_HOST" --dry-run
read -rp "    Apply this policy? [y/N] " ok
[[ "$ok" =~ ^[Yy] ]] || die "Policy not applied. The skill is installed but OpenShell will block its requests."
nemoclaw "$SANDBOX" policy add --from-file "$TMP/mission-control.yaml" --trusted-private-host "$MC_HOST" --yes
echo "    ✓ policy applied"

say "Done. In the ops bot's Telegram chat, send /new, then try:"
echo '    "How is Mission Control doing?"'
echo '    "What got blocked today?"'
echo '    "Ship 6 pallets of strawberries from Watsonville to Portland by Thursday for Fresh Farms"'
