import { Router, type IRouter } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import inventoryRouter from "./inventory";
import customersRouter from "./customers";
import usersRouter from "./users";
import ordersRouter from "./orders";
import quotationsRouter from "./quotations";
import billingRouter from "./billing";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(inventoryRouter);
router.use(customersRouter);
router.use(usersRouter);
router.use(ordersRouter);
router.use(quotationsRouter);
router.use(billingRouter);
router.use(dashboardRouter);

export default router;
