import { useCallback, useRef, useState, type ReactNode } from "react";
import type { ButtonProps } from "@mui/material";
import { ConfirmDialog } from "../components/common/ConfirmDialog";

export interface ConfirmOptions {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  confirmColor?: ButtonProps["color"];
}

/**
 * A promise-based stand-in for `window.confirm()` that shows the app's own
 * ConfirmDialog. Render `confirmDialog` once in the component, then
 * `if (!(await confirm({ title, message }))) return;` wherever the native call was.
 */
export function useConfirm() {
  const [open, setOpen] = useState(false);
  // Kept after closing so the dialog's text doesn't blank out during its fade-out.
  const [options, setOptions] = useState<ConfirmOptions>({ title: "", message: "" });
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  function settle(confirmed: boolean) {
    setOpen(false);
    resolver.current?.(confirmed);
    resolver.current = null;
  }

  const confirmDialog = (
    <ConfirmDialog
      open={open}
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      confirmColor={options.confirmColor}
      onConfirm={() => settle(true)}
      onCancel={() => settle(false)}
    />
  );

  return { confirm, confirmDialog };
}
