import { ChromaClient } from "chromadb";
import { embeddingFn } from "../embedding/embeddingFunction";

export const client = new ChromaClient({ path: undefined }); // in-memory

// Use a new collection name to avoid old schema conflicts
export const collection =  client.getOrCreateCollection({
  name: "product_info",
  embeddingFunction: embeddingFn,
});
