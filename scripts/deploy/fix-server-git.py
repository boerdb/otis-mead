#!/usr/bin/env python3
"""Reset otis-mead op de server naar origin/main (bij git-conflicten)."""
from __future__ import annotations

import os
import sys
import time

import paramiko

HOST = os.environ.get("DEPLOY_HOST", "192.168.1.32")
USER = os.environ.get("DEPLOY_USER", "root")
# Inloggen met de SSH-sleutel, niet met een wachtwoord (zelfde als brotherdruk).
SSH_KEY_PATH = os.path.expanduser(os.environ.get("SSH_KEY_PATH", "~/.ssh/id_ed25519_homelab"))
SSH_KEY_PASSPHRASE = os.environ.get("SSH_KEY_PASSPHRASE") or None
APP = "/var/www/otis-mead"
PM2_NAME = "otis-mead"


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(
        HOST,
        username=USER,
        key_filename=SSH_KEY_PATH,
        passphrase=SSH_KEY_PASSPHRASE,
        allow_agent=False,
        look_for_keys=False,
        timeout=15,
    )

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
