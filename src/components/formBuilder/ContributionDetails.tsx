import { Box, Stack, Typography } from "@mui/material";
import type { ContributionContent, FormDefinition, TranslationTarget } from "@formbuilder/shared";
import { CONTROL_TYPE_LABEL } from "./formBuilderHelpers";

function describeTarget(target: TranslationTarget): string {
  switch (target.kind) {
    case "profileLabel":
      return target.field;
    case "privacyPolicyText":
      return "Privacy Policy text";
    case "privacyPolicyLink":
      return "Privacy Policy link URL";
    case "privacyPolicyLinkText":
      return "Privacy Policy link text";
    case "termsAndConditionsText":
      return "Terms and Conditions text";
    case "termsAndConditionsUrl":
      return "Terms and Conditions link URL";
    case "consentText":
      return `Consent "${target.consentId}" text`;
    case "consentLink":
      return `Consent "${target.consentId}" link URL`;
    case "questionHeading":
      return `Question "${target.questionId}" heading`;
    case "questionSubheading":
      return `Question "${target.questionId}" subheading`;
    case "answerText":
      return `Question "${target.questionId}" option "${target.answerId}"`;
    case "campaignHeading":
      return "Campaign heading (One-Click)";
    case "campaignSubheading":
      return "Campaign subheading (One-Click)";
    case "campaignHeadingFullForm":
      return "Campaign heading (Full Form)";
    case "campaignSubheadingFullForm":
      return "Campaign subheading (Full Form)";
    case "submitButtonLabel":
      return "Submit button label";
  }
}

/**
 * Full, human-readable breakdown of a contribution's content — every translated
 * field with its exact new text, every proposed question's heading/options across
 * every locale it was given, every proposed consent's text/link — as opposed to
 * `describeContent`'s one-line count. Lets a reviewer see exactly what they're
 * approving/rejecting without opening the merge preview dialog first.
 */
export function ContributionDetails({ content, base }: { content: ContributionContent; base?: FormDefinition | null }) {
  const hasAnything =
    content.translations.length > 0 ||
    content.newQuestions.length > 0 ||
    content.newConsents.length > 0 ||
    content.autoPopulateToggles.length > 0 ||
    content.deletedQuestionIds.length > 0 ||
    content.newAnswers.length > 0 ||
    content.deletedAnswerIds.length > 0;
  if (!hasAnything) {
    return (
      <Typography variant="caption" color="text.secondary">
        No changes.
      </Typography>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ mt: 0.5 }}>
      {content.translations.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block" }}>
            Translations
          </Typography>
          <Stack spacing={0.25}>
            {content.translations.map((t, i) => (
              <Typography key={i} variant="caption" sx={{ display: "block" }}>
                {describeTarget(t.target)} ({t.locale}): "{t.value}"
              </Typography>
            ))}
          </Stack>
        </Box>
      )}

      {content.newQuestions.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block" }}>
            New questions
          </Typography>
          <Stack spacing={1}>
            {content.newQuestions.map((q, i) => (
              <Box key={i} sx={{ pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
                <Typography variant="caption" sx={{ display: "block" }}>
                  {CONTROL_TYPE_LABEL[q.controlType]} · {q.required ? "required" : "optional"}
                </Typography>
                {Object.entries(q.headingByLocale).map(([locale, text]) => (
                  <Typography key={locale} variant="caption" sx={{ display: "block" }}>
                    {locale}: "{text}"
                  </Typography>
                ))}
                {q.answers.map((a) => (
                  <Typography key={a.id} variant="caption" color="text.secondary" sx={{ display: "block", pl: 1.5 }}>
                    {Object.entries(a.textByLocale)
                      .map(([locale, text]) => `${locale}: "${text}"`)
                      .join(" · ")}
                  </Typography>
                ))}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {content.deletedQuestionIds.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="error.main" sx={{ display: "block" }}>
            Questions to remove
          </Typography>
          <Stack spacing={0.25}>
            {content.deletedQuestionIds.map((id) => {
              const question = base?.questions.find((q) => q.id === id);
              const heading = question ? Object.values(question.headingByLocale)[0] : undefined;
              return (
                <Typography key={id} variant="caption" color="error.main" sx={{ display: "block", textDecoration: "line-through" }}>
                  {id}
                  {heading ? `: "${heading}"` : ""}
                </Typography>
              );
            })}
          </Stack>
        </Box>
      )}

      {content.newAnswers.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block" }}>
            New answer options
          </Typography>
          <Stack spacing={0.5}>
            {content.newAnswers.map((entry, i) => (
              <Box key={i} sx={{ pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  On {entry.questionId}:
                </Typography>
                <Typography variant="caption" sx={{ display: "block", pl: 1.5 }}>
                  {Object.entries(entry.answer.textByLocale)
                    .map(([l, text]) => `${l}: "${text}"`)
                    .join(" · ")}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {content.deletedAnswerIds.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="error.main" sx={{ display: "block" }}>
            Answer options to remove
          </Typography>
          <Stack spacing={0.25}>
            {content.deletedAnswerIds.map((entry, i) => {
              const question = base?.questions.find((q) => q.id === entry.questionId);
              const answer = question?.answers.find((a) => a.id === entry.answerId);
              const text = answer ? Object.values(answer.textByLocale)[0] : undefined;
              return (
                <Typography key={i} variant="caption" color="error.main" sx={{ display: "block", textDecoration: "line-through" }}>
                  {entry.questionId} · {entry.answerId}
                  {text ? `: "${text}"` : ""}
                </Typography>
              );
            })}
          </Stack>
        </Box>
      )}

      {content.newConsents.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block" }}>
            New consents
          </Typography>
          <Stack spacing={1}>
            {content.newConsents.map((c, i) => (
              <Box key={i} sx={{ pl: 1, borderLeft: "2px solid", borderColor: "divider" }}>
                {Object.entries(c.textByLocale).map(([locale, text]) => (
                  <Typography key={locale} variant="caption" sx={{ display: "block" }}>
                    {locale}: "{text}"
                  </Typography>
                ))}
                {c.linkUrlByLocale &&
                  Object.entries(c.linkUrlByLocale).map(([locale, url]) => (
                    <Typography key={locale} variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Link ({locale}): {url}
                    </Typography>
                  ))}
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      {content.autoPopulateToggles.length > 0 && (
        <Box>
          <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: "block" }}>
            Auto-populate (One-Click)
          </Typography>
          <Stack spacing={0.25}>
            {content.autoPopulateToggles.map((t, i) => (
              <Typography key={i} variant="caption" sx={{ display: "block" }}>
                {t.questionId}: {t.enabled ? "enabled" : "disabled"}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
}
