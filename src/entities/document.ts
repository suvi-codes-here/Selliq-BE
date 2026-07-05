import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { docTypeEnum } from "../enum/docType.enum";
import { Competitors } from "./competitor";

@Entity()
export class Documents {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  docType: docTypeEnum;

  @Column()
  fileName: string;

  @Column({ type: "varchar", length: 100 })
  mimeType: string; // e.g., "application/pdf", "image/png"

  @Column({ type: "bytea" })
  fileData: Buffer; // This stores the actual file content

  @Column({ type: "bigint" })
  fileSize: number; // File size in byte

  @ManyToOne(() => Competitors, (Competitor) => Competitor.documents, {
    onDelete: "CASCADE", // If competition is deleted, delete its documents
  })
  @JoinColumn({ name: "competitionId" })
  competitor: Competitors;
}
