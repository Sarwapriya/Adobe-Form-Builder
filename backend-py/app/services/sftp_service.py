"""Stub port of `backend/src/services/sftpService.ts`.

# TODO(phase: SFTP+email): implement the real paramiko push (host/port/
# username/private-key-file, mkdir -p the remote directory, put every file),
# reading the active deployment target the same way
# `sftp_settings_service.get_sftp_deployment_settings` already exposes it —
# see the real `deployGeneratedFiles` in `backend/src/services/sftpService.ts`
# for the exact behavior/error-shape to reproduce (never throws; normalizes
# every failure into `{ok: False, error}`; never logs the private key's path
# or contents).

For now this always returns a "not configured" failure result and never
throws — matching the real function's "best-effort, never fails publish"
contract so `form_builder_service.publish_form`'s call site doesn't need to
change when the real implementation lands.
"""

from __future__ import annotations

from dataclasses import dataclass


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


def deploy_generated_files(files: list[SftpDeployFile]) -> SftpDeployResult:
    """Best-effort push of a just-published form's generated output files to
    the active SFTP deployment target. Never raises — always returns a
    result, matching `formBuilderService.publishForm`'s "a deployment
    failure never fails the publish itself" contract.

    # TODO(phase: SFTP+email): swap this stub for a real paramiko-based
    # push once that phase lands.
    """
    return SftpDeployResult(
        ok=False,
        error="SFTP deployment is not implemented yet in this port (see TODO(phase: SFTP+email))",
    )
