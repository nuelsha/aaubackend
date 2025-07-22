import express from "express";
import { check } from "express-validator";
import auth from "../Middlewares/auth.js";
import userController from "../Controllers/userController.js";

const router = express.Router();

router.get(
  "/",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check().custom(() => true)], // Placeholder for validation if needed
  userController.getUsers
);

export default router;