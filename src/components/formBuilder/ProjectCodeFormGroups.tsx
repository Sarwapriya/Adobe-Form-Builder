import { useState, type ReactNode } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Stack, Typography } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import FolderIcon from "@mui/icons-material/Folder";
import { groupFormsByProjectCode, NO_PROJECT_CODE_LABEL } from "./groupFormsByProjectCode";

/**
 * The admin-side HR / Ad-hoc form lists, grouped project code first: each
 * project code is a collapsible card, and opening it shows that project's forms
 * split by subsidiary. Row rendering stays with the caller (`renderForm`), so
 * each page keeps its own chips and actions.
 */
export function ProjectCodeFormGroups<T extends { id: string; subsidiaryId: string; projectCode: string | null }>({
  forms,
  renderForm,
}: {
  forms: T[];
  renderForm: (form: T) => ReactNode;
}) {
  const groups = groupFormsByProjectCode(forms);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  return (
    <Stack spacing={1.5}>
      {groups.map((group) => {
        const key = group.projectCode ?? "";
        // A lone project code has nothing to be picked out from, so start it open.
        const isOpen = expanded[key] ?? groups.length === 1;
        const label = group.projectCode ?? NO_PROJECT_CODE_LABEL;
        return (
          <Accordion
            key={key || "__none__"}
            expanded={isOpen}
            onChange={(_, open) => setExpanded((prev) => ({ ...prev, [key]: open }))}
            disableGutters
            sx={{ "&:before": { display: "none" }, borderRadius: 2, overflow: "hidden" }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-label={`Project code ${label}`}>
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0, flexGrow: 1 }}>
                <FolderIcon color={group.projectCode ? "primary" : "disabled"} />
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {label}
                </Typography>
                <Chip label={`${group.formCount} ${group.formCount === 1 ? "form" : "forms"}`} size="small" />
                <Chip
                  label={`${group.subsidiaries.length} ${group.subsidiaries.length === 1 ? "subsidiary" : "subsidiaries"}`}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }}>
              <Stack spacing={2}>
                {group.subsidiaries.map((sub) => (
                  <Box key={sub.subsidiaryId}>
                    <Typography
                      variant="overline"
                      color="text.secondary"
                      sx={{ display: "block", fontWeight: 700, letterSpacing: 0.8, mb: 0.5 }}
                    >
                      {sub.subsidiaryId} · {sub.forms.length}
                    </Typography>
                    <Stack spacing={1}>
                      {sub.forms.map((form) => (
                        <Box key={form.id}>{renderForm(form)}</Box>
                      ))}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Stack>
  );
}
