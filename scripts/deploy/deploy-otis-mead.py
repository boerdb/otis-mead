#!/usr/bin/env python3
"""Deploy otis-mead naar 192.168.1.32 (git pull, build, pm2 restart)."""
from __future__ import annotations

import sys
import time
from pathlib import Path

import paramiko

HOST = "192.168.1.32"
APP = "/var/www/otis-mead"
PM2_NAME = "otis-mead"
SECRETS = Path(r"C:\DEV\dash-next-app\scripts\db-migration\.secrets.local")


def load_secrets() -> dict[str, str]:
    if not SECRETS.is_file():
        raise SystemExit(f"Geen secrets: {SECRETS}")
    out: dict[str, str] = {}
    for line in SECRETS.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            k, v = line.split("=", 1)
            out[k.strip()] = v.strip()
    return out


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    s = load_secrets()
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=s["SSH_USER"], password=s["SSH_PASS"], timeout=15)

    def run(cmd: str, timeout: int = 600) -> str:
        _, o, e = c.exec_command(cmd, timeout=timeout)
        return (o.read() + e.read()).decode("utf-8", errors="replace")

    steps = [
        ("status vóór", f"cd {APP} && git status -sb && git log -1 --oneline"),
        ("fetch", f"cd {APP} && git fetch origin"),
        ("reset naar origin/main", f"cd {APP} && git reset --hard origin/main"),
        ("clean", f"cd {APP} && git clean -fd"),
        ("npm install", f"cd {APP} && npm ci"),
        ("build", f"cd {APP} && npm run build"),
        ("pm2 restart", f"cd {APP} && pm2 restart {PM2_NAME} --update-env"),
    ]

    for label, cmd in steps:
        print(f"\n=== {label} ===")
        print(run(cmd))

    time.sleep(3)
    print("\n=== pm2 show ===")
    print(run(f"pm2 show {PM2_NAME} | head -35"))
    print("\n=== health check ===")
    print(run("curl -s -m 10 -I http://127.0.0.1:3015/ | head -5"))

    c.close()
    print("\nDeploy klaar.")


if __name__ == "__main__":
    main()
