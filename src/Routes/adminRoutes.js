import express from "express";
import auth from "../Middlewares/auth.js";
import adminController from "../Controllers/adminController.js";

const router = express.Router();

router.get(
  "/partnerships",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  adminController.getAllPartnerships
);

export default router;