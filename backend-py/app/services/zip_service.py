"""Port of `backend/src/services/zipService.ts`, using Python's stdlib
`zipfile` instead of `fflate` — same "read every entry's bytes from disk,
zip them into one in-memory buffer" behavior."""

from __future__ import annotations

import zipfile
from dataclasses import dataclass
from io import BytesIO


@dataclass
class ZipEntry:
    """`zipPath`: path/name the file should have inside the zip archive.
    `absoluteFilePath`: absolute filesystem path to read the file's bytes
    from."""

    zipPath: str
    absoluteFilePath: str


def build_zip(entries: list[ZipEntry]) -> bytes:
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for entry in entries:
            with open(entry.absoluteFilePath, "rb") as f:
                zf.writestr(entry.zipPath, f.read())
    return buffer.getvalue()
