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

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
