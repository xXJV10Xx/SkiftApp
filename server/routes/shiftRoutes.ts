import { Router } from "oak";
import { ShiftController } from "../controllers/shiftController.ts";
import { requireAuth } from "../middleware/auth.ts";

const router = new Router();

// Kalendersynkronisering
router.get("/api/schedule/:userId", requireAuth(), ShiftController.getUserSchedule);

// Skiftbyten
router.post("/api/shifts/trade", requireAuth(), ShiftController.createTradeRequest);
router.post("/api/shifts/trade/interested", requireAuth(), ShiftController.showInterest);
router.get("/api/shifts/trade-requests", requireAuth(), ShiftController.getTeamTradeRequests);

// Skifttilldelning
router.put("/api/shifts/:shiftId/assign", requireAuth(), ShiftController.assignShift);

export default router;