import { Router } from "express";
import { Request, Response } from "express";
import {
  getAllCompetitors,
  getCompetitor,
  saveCompetitor,
} from "../repository/competitor.repository";
import { fetchPost } from "../utils/fetchPost";
import {
  getDocByTypeAndCompetitorId,
  removeDoc,
  saveDoc,
} from "../repository/document.repository";
import { docTypeEnum } from "../enum/docType.enum";
import { Documents } from "../entities/document";
import * as fs from "fs";
import mime from "mime";
import path from "path";
import { compareDocs } from "../getUpdates";
import { websiteScrape } from "../utils/runPythonScript";

const competitorRouter = Router();

competitorRouter.get("/", async (req: Request, res: Response) => {
  try {
    const competitors = await getAllCompetitors();

    if (!competitors || competitors.length === 0) {
      return res.status(404).json({ error: "No competitors found" });
    }

    // Fetch posts for all competitors in parallel
    const competitorsWithPosts = await Promise.all(
      competitors.map(async (comp) => {
        const linkedInPosts = await fetchPost(comp.linkedInUrl);
        return { ...comp, linkedInPosts };
      })
    );
    res.status(200).json({
      competitors: competitorsWithPosts,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

competitorRouter.post("/updateInfo", async (req: Request, res: Response) => {
  try {
    const competitorId = parseInt(req.body.id);

    const competitor = await getCompetitor(competitorId);

    if (!competitor) {
      return res.status(404).json({ error: "No competitor found" });
    }

    const file = await websiteScrape(competitor.websiteUrl);

    console.log("sdjhfgakdshgf", file.filename);

    const existingNew = await getDocByTypeAndCompetitorId(
      competitorId,
      docTypeEnum.NEW
    );

    const existingOld = await getDocByTypeAndCompetitorId(
      competitorId,
      docTypeEnum.OLD
    );

    if (existingNew && !existingOld) {
      existingNew.docType = docTypeEnum.OLD;
      await saveDoc(existingNew);
    } else if (existingNew && existingOld) {
      await removeDoc(existingOld);
      existingNew.docType = docTypeEnum.OLD;
      await saveDoc(existingNew);
    }

    if (typeof file.filename === "string") {
      const filePath = `newDoc`;

      const fileBuffer = fs.readFileSync(filePath);
      const fileStat = fs.statSync(filePath);

      const mimeType = mime.lookup(file.filename) || "text/plain";
      const fileSize = fileStat.size;

      const newDoc = new Documents();
      newDoc.docType = docTypeEnum.NEW;
      newDoc.fileName = file.filename;
      newDoc.mimeType = mimeType;
      newDoc.fileData = fileBuffer;
      newDoc.fileSize = fileSize;
      newDoc.competitor = competitor;

      await saveDoc(newDoc);
    }

    const oldDoc = await getDocByTypeAndCompetitorId(
      competitorId,
      docTypeEnum.OLD
    );

    if (oldDoc) {
      const tempDir = path.join(__dirname, "");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // 3. Set file path
      const tempFilePath = path.join(tempDir, "../../oldDoc");
      console.log(tempDir,'tempDir')
      console.log(tempFilePath,'tempFilePath')

      // 4. Write file to disk (Buffer → file)
      fs.writeFileSync(tempFilePath, oldDoc.fileData);

      const updates = await compareDocs();

      competitor.updates = updates;
      await saveCompetitor(competitor);
    }

    res.status(201).json({ message: "Successfully updated" });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default competitorRouter;
