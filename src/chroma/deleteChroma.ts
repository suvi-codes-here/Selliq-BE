import dotenv from "dotenv";
import { ChromaClient } from "chromadb";
dotenv.config();

export const client = new ChromaClient({ path: undefined });
client.deleteCollection({ name: "product_info" });
