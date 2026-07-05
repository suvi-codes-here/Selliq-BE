import { ChromaClient, EmbeddingFunction } from "chromadb";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

// --- Setup OpenAI client ---
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// const client = new ChromaClient();
// const collection = await client.getOrCreateCollection({ name: "product_info" });

// --- Define custom embedding function ---
const embeddingFn: EmbeddingFunction = {
  generate: async (texts: string[]) => {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  },
};

// --- Initialize Chroma client ---
const client = new ChromaClient({
  path: "./chroma_data", // optional: makes it persistent between runs
});

// --- Create or get collection ---
const collection = client.getOrCreateCollection({
  name: "product_info",
  embeddingFunction: embeddingFn,
});

// scrape your product site
async function scrapePage(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);
  let text: string = "";
  $("p, h1, h2, h3, li").each((_, el) => {
    text += $(el).text() + " ";
  });
  return text;
}

// initialize once
export async function loadProductData() {
  const urls = [
    "https://revolte.ai/pricing",
    // "https://yourproduct.com/pricing",
  ];

  const docs: { url: string; content: string }[] = [];
  for (const url of urls) {
    const content = await scrapePage(url);
    docs.push({ url, content });
  }

  await (await collection).add({
    ids: docs.map((d: any) => d.url),
    documents: docs.map((d: any) => d.content),
    metadatas: docs.map((d) => ({ source: d.url })),
  });
}

// query ChromaDB
export async function getRelevantProductInfo(query: string) {
  const results = await (await collection).query({
    queryTexts: [query],
    nResults: 2,
  });

  if (!results.documents || results.documents.length === 0) {
    return "No relevant product info found.";
  }

  return results.documents[0].join(" ");
}
