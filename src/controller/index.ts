import { Router } from "express";
import competitorRouter from "./competitorController";
import investorRouter from "./investorController";
import emailInsightRouter from "./emailInsightController";

const apiRouter = Router();

apiRouter.use("/competitors", competitorRouter);

apiRouter.use("/investors", investorRouter);

apiRouter.use("/emailInsight", emailInsightRouter);

export default apiRouter;
