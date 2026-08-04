import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export type UserRole = "admin" | "standard";

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

  @Column({ type: "bit", default: true })
  isActive!: boolean;

  @Column({ type: "datetimeoffset", default: () => "SYSDATETIMEOFFSET()" })
  createdAt!: Date;
}
