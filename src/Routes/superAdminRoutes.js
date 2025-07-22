// routes/superAdminRouter.js
import express from "express";
import { check } from "express-validator";
import auth from "../Middlewares/auth.js";
import superAdminController from "../Controllers/superAdminController.js";

const router = express.Router();

router.post(
  "/assign-admin",
  auth.authenticateToken,
  auth.authorizeRoles("SuperAdmin"),
  [
    check("email").isEmail().withMessage("Valid email is required"),
    check("firstName").notEmpty().withMessage("First name is required"),
    check("lastName").notEmpty().withMessage("Last name is required"),
    check("campusId").notEmpty().withMessage("Campus ID is required"),
    check("role")
      .isIn(["SuperAdmin", "Admin"])
      .withMessage("Role must be SuperAdmin or Admin"),
  ],
  superAdminController.assignAdmin
);

router.get(
  "/partnerships",
  auth.authenticateToken,
  auth.authorizeRoles("SuperAdmin"),
  superAdminController.getAllPartnerships
);

router.get(
  "/users",
  auth.authenticateToken,
  auth.authorizeRoles("SuperAdmin"),
  superAdminController.getUsers
);

router.put(
  "/users/:id",
  auth.authenticateToken,
  auth.authorizeRoles("SuperAdmin"),
  [
    check("email").optional().isEmail().withMessage("Valid email is required"),
    check("firstName").optional().notEmpty().withMessage("First name is required"),
    check("lastName").optional().notEmpty().withMessage("Last name is required"),
    check("role")
      .optional()
      .isIn(["SuperAdmin", "Admin"])
      .withMessage("Role must be SuperAdmin or Admin"),
  ],
  superAdminController.updateUser
);

router.delete(
  "/users/:id",
  auth.authenticateToken,
  auth.authorizeRoles("SuperAdmin"),
  superAdminController.deleteUser
);

export default router;