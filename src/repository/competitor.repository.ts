import { Repository } from "typeorm";
import { Competitors } from "../entities/competitor";
import { AppDataSource } from "../../dataSource";
import { docTypeEnum } from "../enum/docType.enum";

export const competitorRepository: Repository<Competitors> =
  AppDataSource.getRepository(Competitors);

export const getAllCompetitors = async () => {
  return await competitorRepository.find();
};

export const getCompetitor = async (id: number) => {
  return await competitorRepository.findOne({ where: { id } });
};

export const saveCompetitor= async (data: Competitors) => {
  return await competitorRepository.save(data);
};