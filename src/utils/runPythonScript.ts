import Firecrawl from "@mendable/firecrawl-js";
import { OpenAI } from "openai";
import fs from "fs";
import path from "path";

export const websiteScrape = async (baseUrl: string) => {
  try {
    console.log(baseUrl);
    // Firecrawl init
    const firecrawl = new Firecrawl({
      apiKey: process.env.FIRECRAWL_API_KEY,
    });

    // 1. Scrape links
    const linkResp = await firecrawl.scrape(baseUrl, { formats: ["links"] });
    const listOfLinks = linkResp.links || [];

    let pricingUrl = baseUrl;

    console.log(listOfLinks, "listOfLinks");

    // 2. If links exist, use OpenAI to pick best pricing link
    if (listOfLinks.length > 1) {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const prompt = `Kindly get the link from this list which most aptly suits for pricing: ${JSON.stringify(
        listOfLinks
      )}. Return ONLY the link.`;

      const aiResp = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Return only a URL." },
          { role: "user", content: prompt },
        ],
      });

      pricingUrl = aiResp.choices[0].message.content?.trim() || baseUrl;
    } else {
      pricingUrl = baseUrl;
    }

    // 3. Crawl pricing page
    const docs = await firecrawl.crawl(pricingUrl, { limit: 10 });

    let content = "";

    for (const doc of docs.data) {
      if (doc.markdown) content += doc.markdown + "\n\n";
      else if (doc.html) content += doc.html + "\n\n";
    }

    // 4. Generate filename with safe timestamp
    const safeTimestamp = new Date()
      .toISOString()
      .replace(/[:]/g, "-")
      .replace(/\..+/, "");

    const filename = `output_${safeTimestamp}.txt`;

    // 5. Save file to disk
    const savePath = path.join(process.cwd(), filename);
    fs.writeFileSync('newDoc', content, "utf-8");

    console.log("✓ Created file:", filename);

    return { filename, path: savePath };
  } catch (err) {
    console.error("❌ Scrape Error:", err);
    throw err;
  }
};
