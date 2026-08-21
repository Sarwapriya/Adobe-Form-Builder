import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("AdminSettings")
export class AdminSetting {
  @PrimaryColumn({ type: "nvarchar", length: 50, name: "key" })
  key!: string;

  /** NVARCHAR(MAX) — most settings are short (a URL, a flag, an email), but a
   * few (e.g. FABRIX_OPENAPI_TOKEN's encrypted value) are large signed tokens
   * that would silently overflow a fixed-length column. See migration
   * 1960000000000-WidenAdminSettingValue for the column widen. */
  @Column({ type: "nvarchar", length: "MAX" })
  value!: string;
}
