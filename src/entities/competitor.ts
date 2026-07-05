import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { Documents } from "./document";

@Entity()
export class Competitors {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  linkedInUrl: string;

  @Column()
  websiteUrl: string;

  @Column({ nullable: true })
  logo?: string | null;

  @Column({ nullable: true })
  updates?: string | null;

  @OneToMany(() => Documents, (document) => document.competitor)
  documents: Documents[];
}
