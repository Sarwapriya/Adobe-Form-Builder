import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity("AdminSettings")
export class AdminSetting {
  @PrimaryColumn({ type: "nvarchar", length: 50, name: "key" })
  key!: string;

  @Column({ type: "nvarchar", length: 255 })
  value!: string;
}
