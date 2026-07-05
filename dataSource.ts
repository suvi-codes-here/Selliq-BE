import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DBHOST,
    port: 5432,
    username: 'postgres',
    password: 'admin',
    database: 'selliq',
    synchronize: true,
    logging: false,
    entities: ["src/entities/*.ts"],
  });