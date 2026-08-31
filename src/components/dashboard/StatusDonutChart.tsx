import { Box, Stack, Typography } from "@mui/material";

export interface DonutSegment {
  label: string;
  value: number;
  /** A literal color (theme token resolved by the caller) — a segment's
   * identity comes from its swatch + legend label, never from the segment's
   * size alone, so this always renders with the legend below/beside it. */
  color: string;
}

/**
 * The campaign-status donut both dashboards use — a plain CSS conic-gradient
 * (no charting library, see the approved dashboard-implementation plan). Each
 * segment is separated by a small transparent gap (rather than a stroke) so
 * touching segments still read as distinct, matching the mark spacing every
 * other chart in this app's design review followed. Segments are expected to
 * already be a full partition of `total` (see backend's dashboardService.ts
 * bucketing rule) — this component doesn't re-derive or validate that.
 */
export function StatusDonutChart({ segments, total, centerLabel = "Total" }: { segments: DonutSegment[]; total: number; centerLabel?: string }) {
  const GAP_PCT = 0.4;
  let cursor = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    const pct = total > 0 ? (seg.value / total) * 100 : 0;
    const start = cursor;
    const end = Math.min(start + Math.max(pct - GAP_PCT, 0), 100);
    stops.push(`${seg.color} ${start}% ${end}%`);
    const gapEnd = Math.min(end + GAP_PCT, 100);
    stops.push(`transparent ${end}% ${gapEnd}%`);
    cursor = gapEnd;
  }
  if (cursor < 100) stops.push(`transparent ${cursor}% 100%`);
  const background = total > 0 ? `conic-gradient(${stops.join(", ")})` : undefined;

  return (
    <Stack direction="row" spacing={2.5} alignItems="center">
      <Box
        sx={{
          width: 152,
          height: 152,
          borderRadius: "50%",
          flexShrink: 0,
          position: "relative",
          background: background ?? "action.hover",
          bgcolor: background ? undefined : "action.hover",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            inset: 26,
            bgcolor: "background.paper",
            borderRadius: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="h5" fontWeight={700} letterSpacing={-0.5} lineHeight={1}>
            {total}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mt: 0.25 }}>
            {centerLabel}
          </Typography>
        </Box>
      </Box>
      <Stack spacing={1.25} sx={{ minWidth: 0, flexGrow: 1 }}>
        {segments.map((seg) => (
          <Stack key={seg.label} direction="row" alignItems="center" spacing={1.1}>
            <Box sx={{ width: 9, height: 9, borderRadius: "3px", bgcolor: seg.color, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }} noWrap>
              {seg.label}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {seg.value}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
}
