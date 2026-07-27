import { Router } from "express";
import { generateCards, refineCards } from "../controllers/cardSetController.js";

const router = Router();

router.post("/generate-cards", generateCards);
router.post("/refine-cards", refineCards);

export default router;
