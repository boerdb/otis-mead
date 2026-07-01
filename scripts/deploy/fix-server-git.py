#!/usr/bin/env python3
"""Reset otis-mead op de server naar origin/main (bij git-conflicten)."""
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

    for label, cmd in [
        ("fetch + reset", f"cd {APP} && git fetch origin && git reset --hard origin/main && git clean -fd"),
        ("status", f"cd {APP} && git status -sb && git log -1 --oneline"),
        ("build", f"cd {APP} && npm ci && npm run build"),
        ("restart", f"cd {APP} && pm2 restart {PM2_NAME} --update-env"),
    ]:
        print(f"\n=== {label} ===")
        print(run(cmd))

    time.sleep(3)
    print(run("curl -s -m 10 -I http://127.0.0.1:3015/ | head -5"))
    c.close()


if __name__ == "__main__":
    main()
