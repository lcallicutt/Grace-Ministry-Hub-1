import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ministryRouter from "./ministry";

const router: IRouter = Router();

router.use(healthRouter);
router.use(ministryRouter);

export default router;
