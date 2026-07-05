import { Router } from "express";
import { Request, Response } from "express";
import { PythonShell } from "python-shell";
import path from "path";
import fs from "fs";

const investorRouter = Router();

// Define the path to your venv Python
const VENV_PYTHON = path.join(__dirname, "../../.venv/bin/python3");

investorRouter.get("/", async (req: Request, res: Response) => {
  try {
    const options = {
      mode: "text" as const,
      pythonPath: VENV_PYTHON, // ✅ This is the key fix!
      pythonOptions: ["-u"], // Unbuffered output
      scriptPath: "", // Leave empty if providing full path below
    };

    const results: any[] = await PythonShell.run(
      "src/investorScrape.py",
      options
    ).then((output) => JSON.parse(output.join("")));

    const filePath = path.join(
      __dirname,
      "../investorData/complete_results_Revolte.json"
    );

    // Read the file
    const fileData = fs.readFileSync(filePath, "utf-8");

    // Parse JSON
    const investors = JSON.parse(fileData);

    res.status(200).json({
      investors,
    });
  } catch (error: any) {
    console.error("Python error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default investorRouter;
