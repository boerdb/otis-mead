# Deploy otis-mead

| Item | Waarde |
|------|--------|
| Server | **192.168.1.32** |
| Pad | `/var/www/otis-mead` |
| PM2 | `otis-mead` |
| Poort | **3015** |
| GitHub | `git@github.com:boerdb/otis-mead.git` |

Inloggen met SSH-sleutel `~/.ssh/id_ed25519_homelab` als `root` (zelfde als brotherdruk). Overschrijfbaar met `SSH_KEY_PATH`, `SSH_KEY_PASSPHRASE`, `DEPLOY_HOST` en `DEPLOY_USER`.

## Normale deploy

```powershell
python scripts/deploy/deploy-otis-mead.py
```

Stappen op de server: `git fetch` → `reset --hard origin/main` → `npm ci` → `npm run build` → `pm2 restart otis-mead`.

## Git-conflict / versie verschil

Als `git pull` faalt of de server lokale wijzigingen heeft (bijv. `next-env.d.ts`):

```powershell
python scripts/deploy/fix-server-git.py
```

## Handmatig op de server

```bash
cd /var/www/otis-mead
git fetch origin
git reset --hard origin/main
git clean -fd
npm ci
npm run build
pm2 restart otis-mead --update-env
curl -I http://127.0.0.1:3015/
```

## Node-versie

Server gebruikt Node **24.x** (npm 11). Lokaal hetzelfde houden voorkomt lockfile-problemen; commit altijd `package-lock.json` na dependency-wijzigingen.
