import { Alert, Snackbar } from "@mui/material";
import { useToastStore } from "../../store/toastStore";

/** Mounted once at the app root (see App.tsx) — every `showToast(...)` call
 * anywhere in the app surfaces here as a bottom-right snackbar. */
export function GlobalToast() {
  const open = useToastStore((s) => s.open);
  const message = useToastStore((s) => s.message);
  const severity = useToastStore((s) => s.severity);
  const close = useToastStore((s) => s.close);

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={(_, reason) => {
        if (reason !== "clickaway") close();
      }}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={close} severity={severity} variant="filled" sx={{ width: "100%", borderRadius: 2 }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
