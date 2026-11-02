import { Divider, Paper, Stack, TextField, Typography } from "@mui/material";
import { useFormBuilderStore } from "../../store/formBuilderStore";
import { localeDir } from "../../utils/localeDir";
import type { ValidationMessageSet } from "@formbuilder/shared";

/** `FormDefinition.validationMessages[locale]` — every field here is
 * actually read at runtime by the byte-identical reference FF.js (see its
 * own doc comment for exactly where), so unlike a few other
 * `ValidationMessageSet` fields this builder never exposes a control for
 * (`requiredField`/`email`/`mobileNumber`/`mobileNumberType`/
 * `mobileNumberLength`/`zipCodeError`/`reCaptchaRequired` — confirmed dead:
 * none of them are ever read by the reference script, so a control for them
 * would silently do nothing), every field below has a real, visible effect:
 *
 * - `apiError` / `modalMessage1`+`modalMessage2` / `modalButtonYes`+
 *   `modalButtonNo` are read by fixed, literal lookups
 *   (`validation_messages[language]["apiError"]` etc.).
 * - `emailError`/`firstNameError`/`lastNameError`/`callingCodeError`/
 *   `mobileNumberError` are read by a *generic* loop keyed off each input's
 *   own `id` (`validation_messages[language][elementId + "Error"]`) — these
 *   only matter for a field the form actually has, but showing all of them
 *   unconditionally is simpler and harmless (an unused one is just an extra
 *   blank text field, never generated into anything).
 *
 * Like `redirectAfterSuccessUrlByLocale`/`thankYou` (see CampaignHeaderPanel/
 * ThankYouPanel's own doc comments), none of this ever had an editor before
 * — defaults were always generic English (see buildDataJs.ts's
 * DEFAULT_VALIDATION_MESSAGES), and the only way to customize or translate
 * them was hand-editing the generated data.js directly, which its own
 * always-fresh regeneration then silently wiped on the next save or
 * publish. `modalMessage1`/`modalMessage2` specifically also needed a
 * backend fix alongside this panel — see buildDataJs.ts's own doc comment
 * on the key-name mismatch that used to make them a no-op even if set. */
export function ValidationMessagesPanel() {
  const definition = useFormBuilderStore((s) => s.definition);
  const updateDefinition = useFormBuilderStore((s) => s.updateDefinition);
  const storeActiveLocale = useFormBuilderStore((s) => s.activeLocale);

  if (!definition) return null;
  const defaultLocale = definition.meta.defaultLocale;
  const activeLocale = storeActiveLocale || defaultLocale;
  const dir = localeDir(activeLocale);
  const messages: ValidationMessageSet = definition.validationMessages[activeLocale] ?? {};

  function updateMessages(patch: Partial<ValidationMessageSet>) {
    updateDefinition((d) => ({
      ...d,
      validationMessages: { ...d.validationMessages, [activeLocale]: { ...d.validationMessages[activeLocale], ...patch } },
    }));
  }

  function field(key: keyof ValidationMessageSet, label: string, helperText?: string) {
    return (
      <TextField
        key={key}
        label={label}
        size="small"
        fullWidth
        value={messages[key] ?? ""}
        inputProps={{ dir }}
        placeholder={DEFAULTS[key]}
        helperText={helperText ?? `Leave blank to use the default: "${DEFAULTS[key]}"`}
        onChange={(e) => updateMessages({ [key]: e.target.value })}
      />
    );
  }

  return (
    <Paper sx={{ p: 2, mb: 2, borderRadius: 3 }}>
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.25 }}>
        Validation &amp; submission messages
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: "block" }}>
        Shown to visitors while filling out or submitting the form. All fields optional — a blank field falls back to
        the default English text shown as a placeholder.
      </Typography>
      <Stack spacing={2}>
        {field("apiError", "Submission failed message")}

        <Divider textAlign="left">
          <Typography variant="caption" color="text.secondary">
            Submit confirmation pop-up
          </Typography>
        </Divider>
        {field("modalMessage1", "Pop-up line 1")}
        {field("modalMessage2", "Pop-up line 2")}
        {field("modalButtonYes", "Confirm button label")}
        {field("modalButtonNo", "Cancel button label")}

        <Divider textAlign="left">
          <Typography variant="caption" color="text.secondary">
            Field-specific error messages
          </Typography>
        </Divider>
        {field("emailError", "Email field error")}
        {field("firstNameError", "First name field error")}
        {field("lastNameError", "Last name field error")}
        {field("callingCodeError", "Calling code field error")}
        {field("mobileNumberError", "Mobile number field error")}
      </Stack>
    </Paper>
  );
}

/** Mirrors buildDataJs.ts's own DEFAULT_VALIDATION_MESSAGES exactly — shown
 * as each field's placeholder/helper text so an admin can see what's
 * actually live right now without having to open Edit Files. */
const DEFAULTS: Record<string, string> = {
  apiError: "Something went wrong. Please try again later.",
  modalMessage1: "Are you sure you want to submit?",
  modalMessage2: "You won't be able to change your answers after this.",
  modalButtonYes: "Yes, submit",
  modalButtonNo: "No, go back",
  emailError: "Please enter a valid Email address",
  firstNameError: "Only letters are allowed",
  lastNameError: "Only letters are allowed",
  callingCodeError: "Please select a value",
  mobileNumberError: "Enter a valid mobile number",
};
