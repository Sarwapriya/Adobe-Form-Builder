import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

/**
 * The admin-managed master list of which locale codes a subsidiary's users may
 * pick from — both in admin's own Form Initiator (a convenience picker alongside
 * free-text entry, see LocaleManagerPanel.tsx) and, restricted with no free text,
 * in a subsidiary user's own ad-hoc form builder (see SubsidiaryLocalePicker.tsx).
 *
 * `subsidiaryName` is a plain text snapshot, not a foreign key — same convention
 * as SubsidiaryProjectBlock.subsidiaryName. Exactly one row per subsidiary should
 * have `isFallback: true` (enforced in subsidiaryLocaleService.ts, not the DB) —
 * that's the locale a brand-new ad-hoc form starts with and the one
 * migrateDefaultLocale falls back to, mirroring LocaleManagerPanel's own
 * "first locale = fallback" convention.
 */
@Entity("SubsidiaryLocales")
@Index("UQ_SubsidiaryLocales_pair", ["subsidiaryName", "code"], { unique: true })
export class SubsidiaryLocale {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "nvarchar", length: 100 })
  subsidiaryName!: string;

  @Column({ type: "nvarchar", length: 20 })
  code!: string;

  @Column({ type: "nvarchar", length: 10 })
  langSubtag!: string;

  @Column({ type: "bit" })
  isRtl!: boolean;

  @Column({ type: "nvarchar", length: 100 })
  label!: string;

  @Column({ type: "bit", default: false })
  isFallback!: boolean;

  @Column({ type: "int", default: 0 })
  sortOrder!: number;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
