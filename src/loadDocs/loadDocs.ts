import fs from "fs-extra";
import textract from "textract";
import { collection } from "../chroma/chromaClient";
import { embeddingFn } from "../embedding/embeddingFunction";

async function extractText(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    textract.fromFileWithPath(filePath, (err, text) => {
      if (err) reject(err);
      else resolve(text || "");
    });
  });
}

function chunkText(text: string, chunkSize = 500) {
  const paragraphs = text.split("\n").filter((p) => p.trim() !== "");
  const chunks: string[] = [];
  let current = "";

  for (const p of paragraphs) {
    if ((current + p).length > chunkSize) {
      chunks.push(current);
      current = "";
    }
    current += p + "\n";
  }
  if (current) chunks.push(current);
  return chunks;
}

export async function loadDocsIntoChroma(folderPath: string) {
  const files = await fs.readdir(folderPath);

  console.log(files, "sdfd");
  for (const file of files) {
    const fullPath = `${folderPath}/${file}`;
    const text = await extractText(fullPath);
    const chunks = chunkText(text, 500).filter((c) => c && c.trim() !== "");
    const embeddings = await embeddingFn.generate(chunks);

    await (await collection).add({
      ids: chunks.map((_, i) => `${file}-chunk-${i}`),
      documents: chunks,
      embeddings,
    });

    console.log(`✅ Loaded ${file} into ChromaDB`);
  }
}

loadDocsIntoChroma("src/docs");
