import fs, { readFile } from "fs/promises";
import OpenAI from "openai";
import dotenv from "dotenv";
import path from 'path'

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function compareDocs() {
  try {

    const tempDir = path.join(__dirname, "");
    // if (!fs.existsSync(tempDir)) {
    //   fs.mkdirSync(tempDir, { recursive: true });
    // }

    const previous = await readFile(path.join(__dirname, "../oldDoc"), "utf8");
    const updated = await readFile(path.join(__dirname, "../newDoc"), "utf8");

    // const doc1 = await fs.readFile("../oldDoc.txt", "utf8");
    // const doc2 = await fs.readFile("../newDoc.txt", "utf8");

    console.log("Comparing with OpenAI...");

    const prompt = `
           You are an expert text comparison AI. You are given two web scraped input: ${previous} and ${updated}. Both represent similar content (e.g., pricing plans, features, or specifications). Your task is to:
 
           Strictly - Don't provide **Summary of Changes**. Don't use name like 'documents'

            Identify all differences between previous and updated. Differences may include:
 
            Wording or phrasing changes (e.g., "user" vs "member")
 
            Stylistic or formatting differences (e.g., punctuation, dash vs colon)
 
            Content differences (added, removed, or modified items)
 
            Cost changes (monthly, annual, or other pricing variations)
 
            Classify differences as:
 
            Cosmetic – stylistic or wording changes that do not alter the meaning
 
            Material – actual content changes, including features added/removed or cost changes

          
           
          `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or "gpt-4-turbo"
      messages: [
        {
          role: "system",
          content: "You are an AI assistant that compares",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
    });

    console.log("\nComparison Result:\n");
    console.log(response.choices[0].message.content);

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error comparing documents:", error);
  }
}

