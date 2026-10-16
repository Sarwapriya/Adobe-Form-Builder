"""Dynamic circular flag-composite logo generator for subsidiaries that don't
have one of the nine originally-supplied PNG badges (`Subsidiary.logoSource
== "generated"`) — every subsidiary created after this feature shipped, or
any of the original nine an admin explicitly chose to regenerate from its
current country assignment (see `app/routers/admin.py`'s
`.../logo/regenerate`).

Builds a single self-contained `.svg`: equal pie-wedge sections (or one full
circle for a single-country subsidiary), each clipped to a local flag asset
embedded as a base64 data URI, with thin white separators and an outer ring
— no raster image library needed (stdlib only), so the output is crisp at
any display size and trivial to cache/version.

Pure functions only (no DB session) except `regenerate_subsidiary_logo`,
which is the one orchestrator that also persists the result — called from
`subsidiary_service.set_subsidiary_countries` is deliberately NOT done here;
editing a subsidiary's countries must never silently replace a hand-authored
"upload" logo, so regeneration is always a separate, explicit admin action.
"""

from __future__ import annotations

import base64
import hashlib
import math
import mimetypes
from pathlib import Path

SIZE = 512
RING_FRAC = 0.05
SEPARATOR_WIDTH_FRAC = 0.012


def compute_logo_hash(iso_codes: list[str]) -> str:
    """Order-sensitive — reordering a subsidiary's countries changes the
    wedge arrangement, so it must also bust the cache."""
    joined = "|".join(code.upper() for code in iso_codes)
    return hashlib.sha256(joined.encode("utf-8")).hexdigest()[:12]


def build_alt_text(country_names: list[str]) -> str:
    if not country_names:
        return "Subsidiary logo"
    if len(country_names) == 1:
        return f"Flag of {country_names[0]}"
    return "Flags of " + ", ".join(country_names[:-1]) + f" and {country_names[-1]}"


def _point_on_circle(cx: float, cy: float, r: float, angle_deg: float) -> tuple[float, float]:
    rad = math.radians(angle_deg)
    return (cx + r * math.sin(rad), cy - r * math.cos(rad))


def _wedge_path(cx: float, cy: float, r: float, a0: float, a1: float) -> str:
    x0, y0 = _point_on_circle(cx, cy, r, a0)
    x1, y1 = _point_on_circle(cx, cy, r, a1)
    large_arc = 1 if (a1 - a0) > 180 else 0
    return f"M {cx},{cy} L {x0},{y0} A {r},{r} 0 {large_arc},1 {x1},{y1} Z"


def _wedge_bbox(cx: float, cy: float, r: float, a0: float, a1: float) -> tuple[float, float, float, float]:
    points = [(cx, cy), _point_on_circle(cx, cy, r, a0), _point_on_circle(cx, cy, r, a1)]
    points += [_point_on_circle(cx, cy, r, deg) for deg in (0, 90, 180, 270) if a0 <= deg <= a1]
    xs = [p[0] for p in points]
    ys = [p[1] for p in points]
    return min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)


def _flag_data_uri(flag_path: Path) -> str:
    mime, _ = mimetypes.guess_type(flag_path.name)
    mime = mime or "image/svg+xml"
    data = base64.b64encode(flag_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{data}"


def _flag_image_tag(flag_path: Path, *, x: float, y: float, w: float, h: float, preserve: str, clip_id: str) -> str:
    href = _flag_data_uri(flag_path)
    return (
        f'<g clip-path="url(#{clip_id})">'
        f'<image href="{href}" x="{x}" y="{y}" width="{w}" height="{h}" '
        f'preserveAspectRatio="{preserve}"/>'
        f"</g>"
    )


def generate_subsidiary_logo_svg(iso_codes: list[str], flag_dir: Path, size: int = SIZE) -> str:
    """Builds the circular flag-composite SVG markup for these ISO codes (in
    the given order). Deterministic function of `iso_codes` + the on-disk
    flag assets only — never touches the DB."""
    if not iso_codes:
        raise ValueError("generate_subsidiary_logo_svg requires at least one ISO code")

    cx = cy = size / 2
    r = size / 2 * (1 - RING_FRAC)
    n = len(iso_codes)
    parts: list[str] = [f'<svg viewBox="0 0 {size} {size}" xmlns="http://www.w3.org/2000/svg">']
    parts.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#fff"/>')

    if n == 1:
        flag_path = flag_dir / f"{iso_codes[0].lower()}.svg"
        parts.append(f'<clipPath id="c0"><circle cx="{cx}" cy="{cy}" r="{r}"/></clipPath>')
        parts.append(
            _flag_image_tag(
                flag_path, x=cx - r, y=cy - r, w=2 * r, h=2 * r, preserve="xMidYMid slice", clip_id="c0"
            )
        )
    else:
        for i, iso in enumerate(iso_codes):
            a0, a1 = i * 360 / n, (i + 1) * 360 / n
            path = _wedge_path(cx, cy, r, a0, a1)
            bx, by, bw, bh = _wedge_bbox(cx, cy, r, a0, a1)
            clip_id = f"c{i}"
            parts.append(f'<clipPath id="{clip_id}"><path d="{path}"/></clipPath>')
            flag_path = flag_dir / f"{iso.lower()}.svg"
            parts.append(
                _flag_image_tag(
                    flag_path, x=bx, y=by, w=bw, h=bh, preserve="xMidYMid meet", clip_id=clip_id
                )
            )
        separator_width = size * SEPARATOR_WIDTH_FRAC
        for i in range(n):
            a0 = i * 360 / n
            x1, y1 = _point_on_circle(cx, cy, r, a0)
            parts.append(f'<line x1="{cx}" y1="{cy}" x2="{x1}" y2="{y1}" stroke="#fff" stroke-width="{separator_width}"/>')

    ring_width = size * RING_FRAC
    parts.append(
        f'<circle cx="{cx}" cy="{cy}" r="{size / 2 - ring_width / 2}" '
        f'fill="none" stroke="#e5e5e5" stroke-width="{ring_width}"/>'
    )
    parts.append("</svg>")
    return "\n".join(parts)


def regenerate_subsidiary_logo(
    db, subsidiary, iso_codes: list[str], *, upload_dir: Path, flag_dir: Path
):
    """Writes the generated SVG to `{upload_dir}/subsidiary-logos/{id}-{hash}.svg`,
    flips the subsidiary to `logoSource="generated"`, and persists the new
    `logoAssetPath`/`logoVersion`. `iso_codes` must already reflect the
    subsidiary's current country assignment (caller's responsibility — see
    the admin router's `.../logo/regenerate` endpoint)."""
    logo_hash = compute_logo_hash(iso_codes)
    relative_path = f"subsidiary-logos/{subsidiary.id}-{logo_hash}.svg"
    absolute_path = upload_dir / relative_path
    absolute_path.parent.mkdir(parents=True, exist_ok=True)
    if not absolute_path.exists():
        svg = generate_subsidiary_logo_svg(iso_codes, flag_dir)
        absolute_path.write_text(svg, encoding="utf-8")

    subsidiary.logoSource = "generated"
    subsidiary.logoAssetPath = relative_path
    subsidiary.logoVersion = logo_hash
    db.add(subsidiary)
    db.commit()
    db.refresh(subsidiary)
    return subsidiary
