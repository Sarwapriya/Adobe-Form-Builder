"""Port of `backend/src/services/sftpService.ts`.

Pushes a just-published form's generated output files to the currently
active SFTP deployment target (Configuration > Deployment — see
`sftp_settings_service.py` for the staging/production config this reads).
Never raises — always returns a result, matching
`form_builder_service.publish_form`'s "a deployment failure never fails the
publish itself" contract. Never logs the private key's path or contents —
only host/username/remote path/file count.

The configured host is normally only reachable from the office network/VPN
— a failure here (timeout, connection refused, unknown host) is expected
and non-fatal.
"""

from __future__ import annotations

import os
import socket
from dataclasses import dataclass

import paramiko
from sqlalchemy.orm import Session

from app.services.sftp_settings_service import get_active_sftp_target

# Matches `ssh2-sftp-client`'s `readyTimeout: 15000` in the Node original —
# this host is normally only reachable from the office network/VPN, so a
# connection attempt from anywhere else must fail fast rather than hang the
# background thread indefinitely (paramiko.Transport applies NO timeout of
# its own to the initial TCP connect unless handed an already-bound,
# already-timed-out socket, which is what this does).
_CONNECT_TIMEOUT_SECONDS = 15


@dataclass
class SftpDeployFile:
    """Absolute local path of an already-generated file on disk, plus the
    file name to use on the remote server."""

    absolutePath: str
    remoteFileName: str


@dataclass
class SftpDeployResult:
    ok: bool
    filesDeployed: int = 0
    error: str | None = None


def _mkdir_p(sftp: paramiko.SFTPClient, remote_directory: str) -> None:
    """Best-effort recursive remote mkdir — mirrors `ssh2-sftp-client`'s
    `mkdir(path, true)`, silently tolerating a directory that already
    exists."""
    remote_directory = remote_directory.rstrip("/")
    if not remote_directory:
        return
    parts = [p for p in remote_directory.split("/") if p]
    current = "" if remote_directory.startswith("/") else None
    path = "/" if remote_directory.startswith("/") else ""
    for part in parts:
        path = f"{path.rstrip('/')}/{part}" if path else f"/{part}"
        try:
            sftp.stat(path)
        except FileNotFoundError:
            try:
                sftp.mkdir(path)
            except OSError:
                pass


def deploy_generated_files(db: Session, files: list[SftpDeployFile]) -> SftpDeployResult:
    """Best-effort push of a just-published form's generated output files to
    the active SFTP deployment target. Never raises."""
    target = get_active_sftp_target(db)
    if target is None:
        return SftpDeployResult(ok=False, error="SFTP deployment is not configured for the active environment (Configuration > Deployment)")
    if not os.path.isfile(target.privateKeyPath):
        return SftpDeployResult(ok=False, error="SFTP private key file not found at the configured local path")
    if not files:
        return SftpDeployResult(ok=True, filesDeployed=0)

    log_context = {"host": target.host, "username": target.username, "remotePath": target.remotePath, "fileCount": len(files)}
    sock: socket.socket | None = None
    transport: paramiko.Transport | None = None
    try:
        private_key = _load_private_key(target.privateKeyPath)

        sock = socket.create_connection((target.host, target.port), timeout=_CONNECT_TIMEOUT_SECONDS)
        sock.settimeout(None)  # blocking mode for the rest of the (already-established) session

        transport = paramiko.Transport(sock)
        transport.banner_timeout = _CONNECT_TIMEOUT_SECONDS
        transport.auth_timeout = _CONNECT_TIMEOUT_SECONDS
        transport.connect(username=target.username, pkey=private_key)
        sftp = paramiko.SFTPClient.from_transport(transport)
        assert sftp is not None

        _mkdir_p(sftp, target.remotePath)

        remote_base = target.remotePath.rstrip("/")
        for file in files:
            remote_file_path = f"{remote_base}/{file.remoteFileName}"
            sftp.put(file.absolutePath, remote_file_path)

        sftp.close()
        print(f"[sftp_service] deploy succeeded {log_context}")
        return SftpDeployResult(ok=True, filesDeployed=len(files))
    except Exception as err:  # noqa: BLE001 — normalized into the same {ok, error} shape as every other best-effort sender
        message = str(err) or "Unknown SFTP error"
        print(f"[sftp_service] deploy failed {({**log_context, 'error': message})}")
        return SftpDeployResult(ok=False, error=message)
    finally:
        if transport is not None:
            transport.close()
        elif sock is not None:
            sock.close()


def _load_private_key(path: str) -> paramiko.PKey:
    """Tries each key type paramiko supports in turn, matching
    `ssh2-sftp-client`'s auto-detection (the Node side never requires the
    admin to specify a key format)."""
    last_error: Exception | None = None
    for loader in (paramiko.Ed25519Key, paramiko.RSAKey, paramiko.ECDSAKey, paramiko.DSSKey):
        try:
            return loader.from_private_key_file(path)
        except Exception as err:  # noqa: BLE001
            last_error = err
    raise last_error or ValueError("Unsupported private key format")
