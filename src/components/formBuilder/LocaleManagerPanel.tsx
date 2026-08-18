import { useEffect, useState } from "react";
import { Alert, Box, Chip, IconButton, Paper, Stack, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { migrateDefaultLocale } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { listSubsidiaryLocales, type SubsidiaryLocale } from "../../api/subsidiaryLocalesApi";

/**
 * Admin-managed list of the form's locales, entirely driven by what's added here —
 * every locale is equally addable/removable/reorderable, and the form is built from
 * whatever ends up in this list (no locale is specially protected). The first one
 * in the list is used as the fallback wherever a translation is missing; whenever
 * reordering or removing changes which locale that is, `migrateDefaultLocale`
 * (see localeMigration.ts) backfills the new fallback's text from the old one so
 * the form keeps rendering the same content instead of going blank.
 *
 * Locales are toggled on/off from that subsidiary's admin-managed master locale
 * list (SubsidiaryLocale, see subsidiaryLocaleService.ts) via a chip row, same
 * enable/disable interaction as the subsidiary side's own SubsidiaryLocalePicker
 * — no free-text entry. Once every master locale has been added, the row simply
 * shows every chip already filled — nothing more to add, so no separate "all
 * added" control is needed. If a subsidiary needs a locale that isn't in its
 * master list yet, add it there first (Configuration page), then it appears here.
 */
export function LocaleManagerPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const [masterLocales, setMasterLocales] = useState<SubsidiaryLocale[]>([]);

  const subsidiaryName = definition?.meta.subsidiary;
  useEffect(() => {
    if (!subsidiaryName) {
      setMasterLocales([]);
      return;
    }
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

  if (!definition) return null;
  const locales = definition.locales;
  const addedCodes = new Set(locales.map((l) => l.code));

  function addLocaleFromMaster(master: SubsidiaryLocale) {
    updateDefinition((d) => ({
      ...d,
      locales: [
        ...d.locales,
        { code: master.code, langSubtag: master.langSubtag, isRtl: master.isRtl, sourceColumn: "builder" as const, label: master.label },
      ],
    }));
  }

  function removeLocale(code: string) {
    if (locales.length <= 1) return;
    if (!window.confirm(`Remove "${code}"?`)) return;
    updateDefinition((d) => {
      const remaining = d.locales.filter((l) => l.code !== code);
      const wasDefault = d.meta.defaultLocale === code;
      const migrated = wasDefault ? migrateDefaultLocale(d, remaining[0].code, { removeOldLocale: true }) : d;
      return { ...migrated, locales: remaining };
    });
  }

  function toggleMasterLocale(master: SubsidiaryLocale) {
    if (addedCodes.has(master.code)) {
      removeLocale(master.code);
    } else {
      addLocaleFromMaster(master);
    }
  }

  function moveLocale(index: number, delta: number) {
    const toIndex = index + delta;
    if (toIndex < 0 || toIndex >= locales.length) return;
    updateDefinition((d) => {
      const reordered = [...d.locales];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(toIndex, 0, moved);
      const newDefaultCode = reordered[0].code;
      const migrated = newDefaultCode !== d.meta.defaultLocale ? migrateDefaultLocale(d, newDefaultCode) : d;
      return { ...migrated, locales: reordered };
    });
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Locales
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        The form is built from whichever locales you add here. The first one is used as the fallback wherever a
        translation is missing — reorder to change which one that is; content automatically follows so the form
        keeps showing the same text under the new fallback.
      </Typography>
      <Stack spacing={0.5} sx={{ mb: 1.5 }}>
        {locales.map((l, i) => (
          <Box key={l.code} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 0.25 }}>
            <Typography variant="body2">
              {l.code}
              {i === 0 && (
                <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  (fallback)
                </Typography>
              )}
            </Typography>
            <Stack direction="row" spacing={0}>
              <IconButton size="small" aria-label="Move up" disabled={i === 0} onClick={() => moveLocale(i, -1)}>
                <ArrowUpwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Move down" disabled={i === locales.length - 1} onClick={() => moveLocale(i, 1)}>
                <ArrowDownwardIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="Remove locale" disabled={locales.length <= 1} onClick={() => removeLocale(l.code)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Stack>
          </Box>
        ))}
      </Stack>
      {!subsidiaryName ? (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          Set the campaign's Subsidiary above to choose from its allowed locales.
        </Alert>
      ) : masterLocales.length === 0 ? (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          No locales are configured for {subsidiaryName} yet — add some on the Configuration page first.
        </Alert>
      ) : (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: "block" }}>
            {subsidiaryName}&apos;s allowed locales:
          </Typography>
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
            {masterLocales.map((m) => (
              <Chip
                key={m.code}
                size="small"
                label={m.isFallback ? `${m.code} (fallback)` : m.code}
                color={addedCodes.has(m.code) ? "primary" : "default"}
                variant={addedCodes.has(m.code) ? "filled" : "outlined"}
                disabled={addedCodes.has(m.code) && locales.length <= 1}
                onClick={() => toggleMasterLocale(m)}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Paper>
  );
}
