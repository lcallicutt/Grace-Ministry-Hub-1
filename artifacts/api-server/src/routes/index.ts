import { Router, type IRouter } from "express";
import healthRouter from "./health";
import ministryRouter from "./ministry";
import pilotRouter, { requirePilotAccess } from "./pilot";
import volunteersRouter from "./volunteers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(pilotRouter);
router.use(requirePilotAccess);
router.use(volunteersRouter);
router.use(ministryRouter);

export default router;
