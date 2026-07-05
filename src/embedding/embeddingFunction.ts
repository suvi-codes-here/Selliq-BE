import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const embeddingFn = {
  generate: async (texts: string[]) => {
    const CHUNK_SIZE = 50; // adjust based on token length
    const embeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
      const chunk = texts.slice(i, i + CHUNK_SIZE);
      const response = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: chunk,
      });
      embeddings.push(...response.data.map(d => d.embedding));
    }

    return embeddings;
  },
};


// export function chunkText(text: string, chunkSize = 500) {
//     const paragraphs = text.split("\n").filter(p => p.trim() !== "");
//     const chunks: string[] = [];
//     let current = "";
  
//     for (const p of paragraphs) {
//       if ((current + p).length > chunkSize) {
//         chunks.push(current);
//         current = "";
//       }
//       current += p + "\n";
//     }
  
//     if (current) chunks.push(current);
  
//     return chunks;
//   }
  
//   import { collection } from "./chromaClient";
// import { embeddingFn } from "./embeddingFunction";

