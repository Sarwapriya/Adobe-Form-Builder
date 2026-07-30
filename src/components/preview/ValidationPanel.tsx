import { useBuilderStore } from "../../store/builderStore.ts";

export function ValidationPanel() {
  const validation = useBuilderStore((s) => s.validation);
  if (!validation) return null;

  if (validation.errors.length === 0 && validation.warnings.length === 0) {
    return <p style={{ color: "#2a8a3a" }}>No issues found — ready to generate.</p>;
  }

  return (
    <div>
      {validation.errors.length > 0 && (
        <>
          <strong>Blocking errors (must fix before generating):</strong>
          <ul className="issue-list">
            {validation.errors.map((e, i) => (
              <li key={i} className="issue-item error">
                {e.sheet ? `[${e.sheet}${e.row ? ` row ${e.row}` : ""}] ` : ""}
                {e.message}
              </li>
            ))}
          </ul>
        </>
      )}
      {validation.warnings.length > 0 && (
        <>
          <strong>Warnings:</strong>
          <ul className="issue-list">
            {validation.warnings.map((w, i) => (
              <li key={i} className="issue-item warning">
                {w.sheet ? `[${w.sheet}${w.row ? ` row ${w.row}` : ""}] ` : ""}
                {w.message}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
