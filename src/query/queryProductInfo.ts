import { collection } from "../chroma/chromaClient";

export async function getRelevantProductInfo(question: string, nResults = 3) {
  const res = await (await collection).query({
    queryTexts: [question],
    nResults,
  });

  if (!res.documents?.length) return "No relevant info found.";
  return res.documents.flat().join("\n\n"); // combine top chunks
}
