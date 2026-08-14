import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type UserRole = "admin" | "standard" | "superadmin";

/** "admin" and "superadmin" both get full admin-panel access (requireAdmin,
 * ownership-check bypasses, etc.) — "superadmin" is a strict superset, adding
 * the ability to provision other admins/superadmins (see admin.router.ts's
 * POST /users, the only place the two roles are treated differently). */
export function isAdminRole(role: UserRole): boolean {
  return role === "admin" || role === "superadmin";
}

@Entity("Users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100, unique: true })
  username!: string;

  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: string;

  @Column({ type: "nvarchar", length: 255 })
  passwordHash!: string;

  @Column({ type: "nvarchar", length: 20, default: "standard" })
  role!: UserRole;

  /** Scopes a standard user to one subsidiary — the upload form auto-fills
   * and locks the Subsidiary field to this value for them (see
   * upload.router.ts, which also overrides whatever the client sends with
   * this value server-side, never trusting the request body alone). Null for
   * admins (who may upload under any subsidiary) and for standard users not
   * tied to one. */
  @Column({ type: "nvarchar", length: 50, nullable: true })
  subsidiaryId!: string | null;

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  /** Up to two separate addresses for notification purposes, distinct from
   * `email` (the login identity) — mainly meant for admin/superadmin
   * accounts, since that's who receives the site's admin-facing notification
   * emails; mirrors Subsidiary.notificationEmail1/2's own two-slot shape. Any
   * user may set their own; only a superadmin may set someone else's — see
   * admin.router.ts's PATCH /users/:id/notification-email. Null means "not
   * set" (not currently wired into where notifications actually get sent —
   * see emailService.ts's own doc comments for what is). */
  @Column({ type: "nvarchar", length: 255, nullable: true })
  notificationEmail!: string | null;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  notificationEmail2!: string | null;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
