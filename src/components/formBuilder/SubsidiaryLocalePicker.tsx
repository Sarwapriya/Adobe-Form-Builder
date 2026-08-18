import { useEffect, useState } from "react";
import { Alert, Chip, Paper, Stack, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { listSubsidiaryLocales, type SubsidiaryLocale } from "../../api/subsidiaryLocalesApi";

/**
 * The ad-hoc builder's restricted locale picker — unlike admin's
 * LocaleManagerPanel, a subsidiary user can't free-type any code, only toggle
 * on/off from their own subsidiary's admin-managed master list (see
 * subsidiaryLocaleService.ts). The designated fallback is always included and
 * can't be removed. A brand-new ad-hoc form starts with the generic "en_GB"
 * placeholder every Form is created with (see
 * formBuilderService.emptyFormDefinition) — this component swaps that for the
 * subsidiary's real fallback as soon as the master list loads, one time only
 * (no subsidiary's master fallback is ever literally "en_GB", so the swap can't
 * misfire against an already-configured form).
 *
 * Enable/disable only — every text field in the ad-hoc builder is always
 * edited in the form's single default (fallback) locale, so there's no
 * per-locale "editing" selector here.
 */
export function SubsidiaryLocalePicker({ subsidiaryName }: { subsidiaryName: string }) {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const [masterLocales, setMasterLocales] = useState<SubsidiaryLocale[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listSubsidiaryLocales(subsidiaryName)
      .then((rows) => {
        if (!cancelled) setMasterLocales(rows);
      })
      .catch(() => {
        if (!cancelled) setMasterLocales([]);
      });
    return () => {
      cancelled = true;
    };
  }, [subsidiaryName]);

  const fallback = masterLocales?.find((l) => l.isFallback) ?? null;

  useEffect(() => {
    if (!definition || !fallback) return;
    if (definition.locales.length === 1 && definition.locales[0].code === "en_GB") {
      updateDefinition((d) => ({
        ...d,
        meta: { ...d.meta, defaultLocale: fallback.code },
        locales: [
          { code: fallback.code, langSubtag: fallback.langSubtag, isRtl: fallback.isRtl, sourceColumn: "builder" as const, label: fallback.label },
        ],
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition, fallback]);

  if (!definition) return null;

  const selectedCodes = new Set(definition.locales.map((l) => l.code));

  function toggle(master: SubsidiaryLocale) {
    if (master.isFallback || !definition) return; // always on, can't be removed
    if (selectedCodes.has(master.code)) {
      updateDefinition((d) => ({ ...d, locales: d.locales.filter((l) => l.code !== master.code) }));
    } else {
      updateDefinition((d) => ({
        ...d,
        locales: [
          ...d.locales,
          { code: master.code, langSubtag: master.langSubtag, isRtl: master.isRtl, sourceColumn: "builder" as const, label: master.label },
        ],
      }));
    }
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Locales
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Choose which of {subsidiaryName}&apos;s approved locales this form should include.
        {fallback ? ` "${fallback.code}" is the required fallback and can't be removed.` : ""}
      </Typography>
      {masterLocales !== null &&
        (masterLocales.length === 0 ? (
          <Alert severity="warning" sx={{ borderRadius: 2 }}>
            No locales are configured for {subsidiaryName} yet — contact an admin.
          </Alert>
        ) : (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {masterLocales.map((m) => (
              <Chip
                key={m.code}
                label={m.isFallback ? `${m.code} (fallback)` : m.code}
                color={selectedCodes.has(m.code) ? "primary" : "default"}
                variant={selectedCodes.has(m.code) ? "filled" : "outlined"}
                onClick={() => toggle(m)}
              />
            ))}
          </Stack>
        ))}
    </Paper>
  );
}
