import { AppDataSource } from "../config/data-source";
import { Subsidiary } from "../entities/Subsidiary";
import { User } from "../entities/User";

/** This subsidiary's own active standard users' emails, plus its two extra
 * notification addresses if set (see Subsidiary.notificationEmail1/2's own
 * doc comment) — deduplicated, since a user's email could coincidentally
 * match one of the extra addresses. Shared by every notification that's
 * scoped to one subsidiary's own people (cutoff reminders, project-locked) —
 * single source of truth instead of each caller re-deriving the same list. */
export async function resolveSubsidiaryRecipients(subsidiaryName: string): Promise<string[]> {
  const [users, subsidiary] = await Promise.all([
    AppDataSource.getRepository(User).find({ where: { subsidiaryId: subsidiaryName, isActive: true } }),
    AppDataSource.getRepository(Subsidiary).findOne({ where: { name: subsidiaryName } }),
  ]);
  const emails = new Set(users.map((u) => u.email));
  if (subsidiary?.notificationEmail1) emails.add(subsidiary.notificationEmail1);
  if (subsidiary?.notificationEmail2) emails.add(subsidiary.notificationEmail2);
  return Array.from(emails);
}
