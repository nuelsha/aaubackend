import express from "express";
import { login, logout, resetPassword } from "../Controllers/authController.js";
import { check } from "express-validator";
import { authenticateToken, verifyOwnership } from "../Middlewares/auth.js";

const router = express.Router();

router.post(
  "/login",
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("password").notEmpty().withMessage("Password is required"),
  ],
  login
);

router.post(
  "/reset-password",
  authenticateToken, // First verify the user is logged in
  verifyOwnership,   // Then verify they're resetting their own password
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("newPassword").isLength({ min: 8, max: 12 }).withMessage("Password must be atleast 8 characters"),
    check("confirmPassword").isLength({ min: 8, max: 12 }).withMessage("Confirm password must be atleast 8 characters"),
  ],
  resetPassword
);

router.post("/logout", logout);

export default router;