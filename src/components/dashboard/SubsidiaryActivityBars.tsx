import { Box, Stack, Typography, useTheme } from "@mui/material";

export interface SubsidiaryActivityRow {
  subsidiaryId: string;
  count: number;
}

/** A single-measure ranking chart (which subsidiaries have the most
 * campaigns in whichever status is currently selected) — one hue, no legend
 * needed since the card's own title already says what's plotted (see
 * dataviz's categorical-vs-single-series rule). The caller derives `rows`
 * from the full per-subsidiary/per-status breakdown (see
 * AdminOverviewDashboardPage.tsx) — this component only ever draws one
 * already-resolved measure. */
export function SubsidiaryActivityBars({ rows }: { rows: SubsidiaryActivityRow[] }) {
  const theme = useTheme();
  const max = Math.max(1, ...rows.map((r) => r.count));

  return (
    <Stack spacing={1.75} sx={{ mt: 0.5 }}>
      {rows.map((r) => (
        <Stack key={r.subsidiaryId} direction="row" alignItems="center" spacing={1.5}>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ width: 170, flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {r.subsidiaryId}
          </Typography>
          <Box sx={{ flexGrow: 1, height: 14, borderRadius: "7px", bgcolor: "action.hover", position: "relative" }}>
            <Box
              sx={{
                position: "absolute",
                left: 0,
                top: 0,
                height: 14,
                borderRadius: "7px",
                width: `${(r.count / max) * 100}%`,
                bgcolor: theme.palette.primary.main,
              }}
            />
          </Box>
          <Typography variant="body2" fontWeight={700} sx={{ width: 32, textAlign: "right", flexShrink: 0 }}>
            {r.count}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}
