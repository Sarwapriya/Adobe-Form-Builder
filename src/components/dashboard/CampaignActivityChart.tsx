import { Box, Stack, Typography, useTheme } from "@mui/material";
import type { MonthlyActivity } from "../../api/formBuilderApi";

const WIDTH = 700;
const HEIGHT = 250;
const MARGIN = { top: 10, right: 20, bottom: 30, left: 34 };
const PLOT_W = WIDTH - MARGIN.left - MARGIN.right;
const PLOT_H = HEIGHT - MARGIN.top - MARGIN.bottom;
const BASELINE_Y = MARGIN.top + PLOT_H;

/** Rounds a max value up to a "clean" axis top (1/2/5/10 × a power of ten) —
 * dataviz's "round to clean numbers" rule, computed against whatever the
 * real data's peak happens to be rather than a fixed scale like the mockup. */
function niceMax(value: number): number {
  if (value <= 0) return 10;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return step * magnitude;
}

/**
 * Campaigns created (bars) vs. first-published (line), last 6 months — one
 * shared count axis (never a dual-axis chart), inline SVG, colors from the
 * MUI theme so this reads correctly in both Admin's maroon/gold and
 * Subsidiary's blue/teal palette.
 */
export function CampaignActivityChart({ data }: { data: MonthlyActivity[] }) {
  const theme = useTheme();
  const barColor = theme.palette.primary.main;
  const lineColor = theme.palette.secondary.main;
  const gridColor = theme.palette.divider;
  const axisColor = theme.palette.text.disabled;
  const labelColor = theme.palette.text.secondary;

  const maxValue = Math.max(1, ...data.map((d) => Math.max(d.created, d.published)));
  const yMax = niceMax(maxValue);
  const yToPixel = (v: number) => BASELINE_Y - (v / yMax) * PLOT_H;

  const bandWidth = data.length > 0 ? PLOT_W / data.length : PLOT_W;
  const barWidth = Math.min(24, bandWidth * 0.4);
  const xCenter = (i: number) => MARGIN.left + bandWidth * (i + 0.5);

  const linePoints = data.map((d, i) => `${xCenter(i)},${yToPixel(d.published)}`).join(" ");
  const lastIndex = data.length - 1;

  return (
    <Box>
      <Box component="svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={210} preserveAspectRatio="xMidYMid meet">
        <line x1={MARGIN.left} y1={BASELINE_Y} x2={WIDTH - MARGIN.right} y2={BASELINE_Y} stroke={axisColor} strokeWidth={1} />
        <line x1={MARGIN.left} y1={yToPixel(yMax / 2)} x2={WIDTH - MARGIN.right} y2={yToPixel(yMax / 2)} stroke={gridColor} strokeWidth={1} />
        <line x1={MARGIN.left} y1={yToPixel(yMax)} x2={WIDTH - MARGIN.right} y2={yToPixel(yMax)} stroke={gridColor} strokeWidth={1} />
        <text x={MARGIN.left - 8} y={BASELINE_Y + 4} textAnchor="end" fontSize={10.5} fill={labelColor}>
          0
        </text>
        <text x={MARGIN.left - 8} y={yToPixel(yMax / 2) + 4} textAnchor="end" fontSize={10.5} fill={labelColor}>
          {Math.round(yMax / 2)}
        </text>
        <text x={MARGIN.left - 8} y={yToPixel(yMax) + 4} textAnchor="end" fontSize={10.5} fill={labelColor}>
          {Math.round(yMax)}
        </text>

        {data.map((d, i) => {
          const height = (d.created / yMax) * PLOT_H;
          return (
            <rect
              key={`bar-${d.month}-${i}`}
              x={xCenter(i) - barWidth / 2}
              y={BASELINE_Y - height}
              width={barWidth}
              height={height}
              rx={4}
              fill={barColor}
            />
          );
        })}
        {data.length > 0 && <polyline points={linePoints} fill="none" stroke={lineColor} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />}
        {data.map((d, i) => (
          <circle key={`dot-${d.month}-${i}`} cx={xCenter(i)} cy={yToPixel(d.published)} r={4} fill={lineColor} stroke={theme.palette.background.paper} strokeWidth={2} />
        ))}

        {lastIndex >= 0 && (
          <text x={xCenter(lastIndex)} y={BASELINE_Y - (data[lastIndex].created / yMax) * PLOT_H - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill={theme.palette.text.primary}>
            {data[lastIndex].created}
          </text>
        )}

        {data.map((d, i) => (
          <text key={`label-${d.month}-${i}`} x={xCenter(i)} y={HEIGHT - 2} textAnchor="middle" fontSize={11} fill={labelColor}>
            {d.month}
          </text>
        ))}
      </Box>
      <Stack direction="row" spacing={2.25} sx={{ mt: 0.75 }}>
        <Stack direction="row" alignItems="center" spacing={0.9}>
          <Box sx={{ width: 8, height: 8, borderRadius: "2px", bgcolor: barColor }} />
          <Typography variant="body2" color="text.secondary">
            Created
          </Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.9}>
          <Box sx={{ width: 14, height: 2, borderRadius: "1px", bgcolor: lineColor }} />
          <Typography variant="body2" color="text.secondary">
            Published
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
