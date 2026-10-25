# Mission Control — GB10 commands

Open a terminal and paste one block at a time (GitHub has a copy button on each block).

## 1 · Tailscale + SSH (so Muse can log in and work on this machine)

```bash
curl -fsSL https://tailscale.com/install.sh | sh
sudo systemctl enable --now ssh
sudo tailscale up
```

`tailscale up` prints a link: open it and sign in with Claudio's Tailscale account.

## 2 · Check which model is being served

```bash
curl -s http://127.0.0.1:11434/api/tags
```

## 3 · Run the backend

After PR #1 is merged (without the merge, use the `backend-server` branch):

```bash
cd mission-control && git pull && node server.mjs
```

Then open in the browser: http://127.0.0.1:3000 — the UI connects to the live stream by itself.
