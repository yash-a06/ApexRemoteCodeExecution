import { Router, type IRouter } from "express";
import healthRouter from "./health";
import problemsRouter from "./problems";
import submissionsRouter from "./submissions";
import usersRouter from "./users";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(problemsRouter);
router.use(submissionsRouter);
router.use(usersRouter);
router.use(statsRouter);

export default router;
