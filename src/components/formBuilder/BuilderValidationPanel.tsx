import { Alert, Box } from "@mui/material";
import type { Issue } from "@formbuilder/shared";
import { useFormBuilderStore } from "../../store/formBuilderStore";

function IssueList({ issues }: { issues: Issue[] }) {
  return (
    <ul style={{ margin: 0, paddingLeft: 20 }}>
      {issues.map((issue, i) => (
        <li key={i}>{issue.message}</li>
      ))}
    </ul>
  );
}

/** Live client-side validation feedback, fed by validateFormDefinition on every
 * edit (see formBuilderStore.updateDefinition) — the same function the backend
 * runs at publish time, so what's shown here never diverges from what
 * actually blocks publishing. */
export function BuilderValidationPanel() {
  const validation = useFormBuilderStore((s) => s.validation);
  if (validation.errors.length === 0 && validation.warnings.length === 0) return null;

  return (
    <Box sx={{ mb: 2 }}>
      {validation.errors.length > 0 && (
        <Alert severity="error" sx={{ mb: 1, borderRadius: 2 }}>
          <IssueList issues={validation.errors} />
        </Alert>
      )}
      {validation.warnings.length > 0 && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <IssueList issues={validation.warnings} />
        </Alert>
      )}
    </Box>
  );
}
