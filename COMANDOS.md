# Mission Control — comandos para a GB10

Abre o Terminal e cola um bloco de cada vez (o GitHub tem botão de copiar em cada bloco).

## 1 · Tailscale + SSH

```bash
curl -fsSL https://muse.ai/files/933422399860855/1735980797464285/5k3koed0ftd029msst7m87m8/setup-gb10.sh -o /tmp/setup.sh && bash /tmp/setup.sh
```

No fim, o Tailscale mostra um link: abrir e entrar com a conta do Claudio.

## 2 · Ver o modelo que está a ser servido

```bash
curl -s http://127.0.0.1:11434/api/tags
```

## 3 · Correr o backend

Depois do merge do PR #1 (sem merge, usa o branch `backend-server`):

```bash
cd mission-control && git pull && node server.mjs
```

Abrir no browser: http://127.0.0.1:3000 — a UI liga-se ao fluxo real sozinha.
