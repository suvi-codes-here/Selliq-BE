import { AppDataSource } from "../../dataSource";

export const initializeDataBase = async () => {
  await AppDataSource.initialize();
  console.log("Database initialization complete.");
};
