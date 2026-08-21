import { Paper, Stack, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { SectionHeader } from "../common/SectionHeader";
import { ClaudeProviderPanel } from "./ClaudeSettingsManager";

/**
 * Fallback AI providers — used automatically only when FabriX (the primary
 * provider, configured in the section above) can't be reached, per backend
 * aiProviderService.ts's fixed priority-with-fallback dispatch. There's no
 * provider picker here — the order is fixed (FabriX first, then whichever
 * of these is configured), so there's nothing to switch.
 *
 * Each provider gets its own bordered subsection below (currently just
 * Claude — see ClaudeProviderPanel). Pasting a key into a subsection is what
 * "adds" that provider; the panel itself both identifies the key's shape and
 * is the grouping, so a future provider is just one more <XProviderPanel />
 * added to the Stack below, not a new page or a routing decision.
 */
export function OtherAiProvidersManager() {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<SwapHorizIcon fontSize="small" color="primary" />} title="Other AI Providers" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Used automatically as a fallback whenever FabriX can't be reached — there's nothing to switch here. Add an
        API key below and it's identified and grouped under its provider automatically.
      </Typography>
      <Stack spacing={2}>
        <ClaudeProviderPanel />
      </Stack>
    </Paper>
  );
}
