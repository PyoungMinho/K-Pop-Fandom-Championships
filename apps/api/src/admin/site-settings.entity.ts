import { Entity, Column } from "typeorm";
import { BaseEntity } from "../common/entities/base.entity";

@Entity("site_settings")
export class SiteSettings extends BaseEntity {
  @Column({ type: "varchar", length: 100, unique: true })
  key!: string;

  @Column({ type: "text" })
  value!: string;
}
