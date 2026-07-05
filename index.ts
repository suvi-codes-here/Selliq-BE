import express from "express";
import { initializeDataBase } from "./src/configurations/database";
import apiRouter from "./src/controller/index";
import cors from "cors";
import { compareDocs } from "./src/getUpdates";

const initialization = async () => {
  await initializeDataBase();
  const app = express();

  app.use(express.json());

  app.use(
    cors({
      origin: "http://localhost:5173", // Replace with frontend URL
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    })
  );

  app.use("/api/v1", apiRouter);

  app.get("/", async (_req, res) => {
    console.log(await compareDocs());
    res.status(200).json({ message: "connection established", live: true });
  });

  app.listen(8080, () => {
    console.log("listening to port 8080");
  });
};
initialization();
