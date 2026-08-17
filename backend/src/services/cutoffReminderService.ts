import type { FormDefinition } from "@formbuilder/shared";
import { AppDataSource } from "../config/data-source";
import { Form } from "../entities/Form";
import { FormVersion } from "../entities/FormVersion";
import { ProjectCode } from "../entities/ProjectCode";
import { Subsidiary } from "../entities/Subsidiary";
import { User } from "../entities/User";
import { getAdminSetting } from "./adminSettingsService";
import { listAdminNotificationEmails } from "./authService";
import { listContributionsForForm } from "./formContributionService";
import { sendAdminPendingItemsSummary, sendCutoffReminder, type AdminPendingItem } from "./emailService";

const DEFAULT_REMINDER_DAYS_BEFORE = 7;

function daysUntil(target: Date, from: Date): number {
  const targetMidnight = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const fromMidnight = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  return Math.round((targetMidnight.getTime() - fromMidnight.getTime()) / 86_400_000);
}

/** A form counts as "not yet finalized" for its subsidiary if it isn't even
 * published yet, or if its latest contribution (see FormContribution.ts) isn't
 * "approved" — covers "nobody has submitted anything yet," "still pending
 * admin review," and "was rejected and hasn't been fixed up and resubmitted."
 * Every contribution on a form is inherently from that form's own subsidiary
 * already (a contribution can only ever be submitted against a form the
 * submitting user's own subsidiary can see — see formAccessService.ts), so no
 * extra subsidiary filtering is needed here. */
async function isNotFinalized(form: Form): Promise<boolean> {
  if (form.status !== "published") return true;
  const contributions = await listContributionsForForm(form.id);
  return contributions[0]?.status !== "approved";
}

/** Whether this form's Terms & Conditions (see TermsAndConditionsMeta in
 * formDefinition.ts) is missing entirely, or incomplete for any of the form's
 * own locales — checked against the form's current *draft* version (always
 * present, even before a form is ever published, and reflects the latest
 * admin- or subsidiary-user edit) rather than its published version, so a
 * subsidiary user's own translation fix is picked up immediately without
 * needing an admin to republish first. */
async function hasTermsAndConditionsGap(form: Form): Promise<boolean> {
  if (!form.currentDraftVersionId) return true;
  const version = await AppDataSource.getRepository(FormVersion).findOne({ where: { id: form.currentDraftVersionId } });
  if (!version) return true;
  const definition = JSON.parse(version.definition) as FormDefinition;
  const termsAndConditions = definition.fields.termsAndConditions;
  if (!termsAndConditions) return true;
  return definition.locales.some(
    (l) => !termsAndConditions.textByLocale?.[l.code] || !termsAndConditions.urlByLocale?.[l.code],
  );
}

/** This subsidiary's own active standard users' emails, plus its two extra
 * notification addresses if set (see Subsidiary.notificationEmail1/2's own
 * doc comment) — deduplicated, since a user's email could coincidentally
 * match one of the extra addresses. */
async function resolveRecipients(subsidiaryName: string): Promise<string[]> {
  const [users, subsidiary] = await Promise.all([
    AppDataSource.getRepository(User).find({ where: { subsidiaryId: subsidiaryName, isActive: true } }),
    AppDataSource.getRepository(Subsidiary).findOne({ where: { name: subsidiaryName } }),
  ]);
  const emails = new Set(users.map((u) => u.email));
  if (subsidiary?.notificationEmail1) emails.add(subsidiary.notificationEmail1);
  if (subsidiary?.notificationEmail2) emails.add(subsidiary.notificationEmail2);
  return Array.from(emails);
}

/**
 * Runs once per calendar day (see startCutoffReminderScheduler in index.ts):
 * for every open project code with a cutoffDate within the configured
 * reminder window, finds every subsidiary that has at least one form under
 * that code with something still pending — either not yet approved, or its
 * Terms & Conditions not fully configured (see isNotFinalized/
 * hasTermsAndConditionsGap above) — and emails that subsidiary's users (plus
 * its two extra addresses) a reminder listing exactly which forms still need
 * attention and why. Separately, every pending item across the *entire* run
 * (every project code, every subsidiary) is also collected into one
 * consolidated summary email sent once to every admin/superadmin's own
 * notification email — a single digest rather than one email per form.
 * Silent no-op for a project code with no cutoffDate set — no reminder is
 * ever sent for those. Best-effort throughout: one subsidiary's (or the
 * admin summary's) email failing (see sendCutoffReminder/
 * sendAdminPendingItemsSummary, neither of which ever throws) never stops
 * the rest of the run.
 */
export async function runCutoffReminders(): Promise<void> {
  const daysBeforeSetting = await getAdminSetting("cutoffReminderDaysBefore");
  const daysBefore = daysBeforeSetting ? Number(daysBeforeSetting) || DEFAULT_REMINDER_DAYS_BEFORE : DEFAULT_REMINDER_DAYS_BEFORE;
  const today = new Date();

  // Collected across the whole run so the one admin summary email at the end
  // can cover every project code/subsidiary, not just the current loop
  // iteration — the per-subsidiary emails below are still sent inline, one
  // per (project code, subsidiary) pair, unchanged from before.
  const allPendingItems: AdminPendingItem[] = [];

  const codes = await AppDataSource.getRepository(ProjectCode).find({ where: { isOpen: true } });
  for (const code of codes) {
    if (!code.cutoffDate) continue;
    const remaining = daysUntil(new Date(code.cutoffDate), today);
    if (remaining < 0 || remaining > daysBefore) continue;

    const forms = await AppDataSource.getRepository(Form).find({ where: { projectCode: code.code, isDeleted: false } });
    if (forms.length === 0) continue;

    const formsBySubsidiary = new Map<string, Form[]>();
    for (const form of forms) {
      const bucket = formsBySubsidiary.get(form.subsidiaryId) ?? [];
      bucket.push(form);
      formsBySubsidiary.set(form.subsidiaryId, bucket);
    }

    for (const [subsidiaryId, subsidiaryForms] of formsBySubsidiary) {
      const pendingForSubsidiary: AdminPendingItem[] = [];
      for (const form of subsidiaryForms) {
        const reasons: string[] = [];
        if (await isNotFinalized(form)) reasons.push("Translation not yet approved");
        if (await hasTermsAndConditionsGap(form)) reasons.push("Terms & Conditions not configured");
        if (reasons.length === 0) continue;
        pendingForSubsidiary.push({ subsidiaryId, projectCode: code.code, formName: form.name, cutoffDate: code.cutoffDate, reasons });
      }
      if (pendingForSubsidiary.length === 0) continue;

      allPendingItems.push(...pendingForSubsidiary);

      const recipients = await resolveRecipients(subsidiaryId);
      if (recipients.length > 0) {
        await sendCutoffReminder(recipients, {
          subsidiaryId,
          projectCode: code.code,
          cutoffDate: code.cutoffDate,
          items: pendingForSubsidiary.map((p) => ({ formName: p.formName, reasons: p.reasons })),
        });
      }
    }
  }

  if (allPendingItems.length > 0) {
    const adminRecipients = await listAdminNotificationEmails();
    if (adminRecipients.length > 0) {
      await sendAdminPendingItemsSummary(adminRecipients, allPendingItems);
    }
  }
}

let lastRunDateKey: string | null = null;

async function runOnceForToday(): Promise<void> {
  const todayKey = new Date().toISOString().slice(0, 10);
  if (todayKey === lastRunDateKey) return;
  lastRunDateKey = todayKey;
  try {
    await runCutoffReminders();
  } catch (err) {
    console.error("Cutoff reminder run failed", err);
  }
}

/**
 * The first scheduled/recurring job in this backend — there's no job queue or
 * cron library here (same "accepted tradeoff for this feature's scope"
 * precedent as the QA-run feature's own fire-and-forget background call), so
 * this is a plain hourly check that only actually runs runCutoffReminders
 * once per calendar day (tracked in-memory via lastRunDateKey). Known
 * limitation: a server restart resets that in-memory guard, so restarting
 * more than once on the same day re-triggers that day's run — acceptable for
 * a best-effort reminder email, not worth a persistent lock for. Call once at
 * startup (see index.ts).
 */
export function startCutoffReminderScheduler(): void {
  void runOnceForToday();
  setInterval(() => void runOnceForToday(), 60 * 60 * 1000);
}
