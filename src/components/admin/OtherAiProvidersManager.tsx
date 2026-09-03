import { Paper, Stack, Typography } from "@mui/material";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import { SectionHeader } from "../common/SectionHeader";
import { AiProviderPanel } from "./OtherAiProviderPanel";

/**
 * Fallback AI provider — used automatically whenever FabriX (the primary
 * provider, configured in the section above) is disabled or unreachable, per
 * backend aiProviderService.py's fixed priority-with-fallback dispatch: with
 * both enabled, FabriX is always tried first. Each provider's own "Enabled"
 * switch (this section's, and FabriX's above) is the entire "which API
 * should use" control — there's no separate priority setting to configure.
 *
 * Currently just one subsection (see AiProviderPanel). Its heading stays
 * generic ("Provider") rather than naming a vendor outright — pasting a key
 * is what identifies and labels it, so a future provider is just one more
 * panel added to the Stack below, not a new page or a routing decision.
 */
export function OtherAiProvidersManager() {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <SectionHeader icon={<SwapHorizIcon fontSize="small" color="primary" />} title="Other AI Providers" />
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
        Used automatically as a fallback whenever FabriX is disabled or unreachable. Add an API key below and it's
        identified and labeled automatically; use its own "Enabled" switch to turn it off.
      </Typography>
      <Stack spacing={2}>
        <AiProviderPanel />
      </Stack>
    </Paper>
  );
}
