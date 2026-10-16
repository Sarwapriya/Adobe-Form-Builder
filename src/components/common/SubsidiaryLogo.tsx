import { Avatar } from "@mui/material";
import { resolveApiAssetUrl } from "../../api/apiClient";
import type { Subsidiary } from "../../api/subsidiariesApi";

/**
 * Circular subsidiary logo badge — either one of the nine originally
 * supplied PNGs or a dynamically generated circular flag-composite SVG (see
 * backend subsidiary_logo_service.py), both served from a backend-relative
 * `logoUrl` resolved via resolveApiAssetUrl(). Falls back to a plain
 * initial-letter avatar when a subsidiary has no logo yet (e.g. newly
 * created, no countries assigned). Follows AiPersonAvatar's shape (MUI
 * Avatar, size prop, thin outline ring) for visual consistency.
 */
export function SubsidiaryLogo({
  subsidiary,
  size = 28,
}: {
  subsidiary: Pick<Subsidiary, "name" | "logoUrl" | "logoAlt"> | null | undefined;
  size?: number;
}) {
  const src = subsidiary?.logoUrl ? resolveApiAssetUrl(subsidiary.logoUrl) : undefined;
  const alt = subsidiary?.logoAlt ?? subsidiary?.name ?? "Subsidiary logo";

  return (
    <Avatar
      src={src}
      alt={alt}
      sx={{
        width: size,
        height: size,
        fontSize: size * 0.45,
        outline: "1px solid",
        outlineColor: "divider",
        outlineOffset: "1px",
        bgcolor: src ? "transparent" : "action.selected",
        color: "text.secondary",
      }}
    >
      {!src && subsidiary?.name ? subsidiary.name.charAt(0).toUpperCase() : null}
    </Avatar>
  );
}
