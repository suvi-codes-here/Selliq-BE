import { Repository } from "typeorm";
import { Competitors } from "../entities/competitor";
import { AppDataSource } from "../../dataSource";
import { Leads } from "../entities/lead";

export const leadRepository: Repository<Leads> =
  AppDataSource.getRepository(Leads);

export const getLead = async (leadId: number) => {
  return await leadRepository.findOne({ where: { id: leadId } });
};

export const getLeads = async () => {
  return await leadRepository.find();
};
