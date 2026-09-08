import { useEffect } from "react";

/** Binds Ctrl+S / Cmd+S to `onSave`, pre-empting the browser's native "Save
 * Page" dialog — shared by every Form Builder editor action bar
 * (BuilderActionBar/AdHocActionBar) so the shortcut behaves the same way
 * across the HR and ad-hoc flows. `preventDefault` always fires on the combo
 * (so the browser dialog never appears while an editor is mounted); `onSave`
 * itself only fires when `enabled` — callers pass `dirty && !saving` so a
 * repeated Ctrl+S with nothing new to save, or one while a save is already in
 * flight, doesn't trigger a redundant network call. */
export function useSaveShortcut(onSave: () => void, enabled: boolean) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      if (enabled) onSave();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onSave, enabled]);
}
