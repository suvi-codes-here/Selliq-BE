import { Repository } from "typeorm";
import { AppDataSource } from "../../dataSource";
import { docTypeEnum } from "../enum/docType.enum";
import { Documents } from "../entities/document";

export const DocumentRepo: Repository<Documents> =
  AppDataSource.getRepository(Documents);

export const getDocByTypeAndCompetitorId = async (
  id: number,
  type: docTypeEnum
) => {
  return await DocumentRepo.findOne({
    where: { competitor: { id }, docType: type },
  });
};

export const saveDoc = async (doc: Documents) => {
  return await DocumentRepo.save(doc);
};

export const removeDoc = async (doc: Documents) => {
  return await DocumentRepo.remove(doc);
};
