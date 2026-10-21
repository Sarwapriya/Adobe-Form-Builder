import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

/** Thin wrapper around MUI X's `DatePicker`, speaking the same plain
 * `""` | `"YYYY-MM-DD"` string every admin date field in this app already
 * stores and sends to the backend (ProjectCodeManager, etc.) — callers never
 * need to import dayjs or handle a `Dayjs` value themselves. Swaps out the
 * plain `<TextField type="date">` native browser date input (inconsistent
 * look across browsers/OSes) for a real, theme-colored calendar popup. */
export function AppDatePicker({
  label,
  value,
  onChange,
  size = "small",
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  size?: "small" | "medium";
  disabled?: boolean;
}) {
  return (
    <DatePicker
      label={label}
      value={value ? dayjs(value) : null}
      onChange={(next) => onChange(next && next.isValid() ? next.format("YYYY-MM-DD") : "")}
      format="DD/MM/YYYY"
      disabled={disabled}
      slotProps={{ textField: { size, sx: { minWidth: 170 } } }}
    />
  );
}
