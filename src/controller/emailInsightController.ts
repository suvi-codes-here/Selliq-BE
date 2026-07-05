import { Router } from "express";
import { Request, Response } from "express";
import { getLead, getLeads } from "../repository/lead.repository";
import { emailExtract } from "../utils/emailExtract";
import { getEmailInsight } from "../utils/getEmailInsight";

const emailInsightRouter = Router();

emailInsightRouter.get("/:id", async (req: Request, res: Response) => {
  try {
    const leadId = parseInt(req.params.id);
    const lead = await getLead(leadId);

    if (!lead) {
      return res.status(404).json({ error: "No lead found" });
    }

    const thread = await emailExtract(lead.email);

    const result = await getEmailInsight(
      thread,
      lead.email,
      lead.name,
      lead.description
    );
    res.status(200).json({
      result,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

emailInsightRouter.get("/", async (req: Request, res: Response) => {
  try {
    const leads = await getLeads();

    if (!leads) {
      return res.status(404).json({ error: "No lead found" });
    }

    const results = [];
    for (const lead of leads) {
      const thread = await emailExtract(lead.email);

      const result = await getEmailInsight(
        thread,
        lead.email,
        lead.name,
        lead.description
      );
      results.push(JSON.parse(result?.slice(7)?.replace('```','')));
    }

    res.status(200).json({
      results,
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

export default emailInsightRouter;
