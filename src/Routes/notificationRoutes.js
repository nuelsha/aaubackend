import express from "express";
import { check } from "express-validator";
import auth from "../Middlewares/auth.js";
import notificationController from "../Controllers/notificationController.js";

const router = express.Router();

// GET /api/notifications (with filters, pagination)
router.get(
  "/",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [
    check("limit").optional().isInt({ min: 1, max: 100 }),
    check("page").optional().isInt({ min: 1 }),
    check("type").optional().isIn(["Partnerships", "System", "Alerts"]),
    check("isRead").optional().isBoolean(),
  ],
  notificationController.getNotifications
);

// GET /api/notifications/unread
router.get(
  "/unread",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  notificationController.getUnreadNotifications
);

// PATCH /api/notifications/:id/read
router.patch(
  "/:id/read",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid notification ID")],
  notificationController.markAsRead
);

// PATCH /api/notifications/read-all
router.put(
  "/read-all",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  notificationController.markAllAsRead
);

// POST /api/notifications
router.post(
  "/",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [
    check("title").notEmpty().withMessage("Title is required"),
    check("message").notEmpty().withMessage("Message is required"),
    check("type")
      .isIn(["Partnerships", "System", "Alerts"])
      .withMessage("Invalid type"),
    check("userId").optional().isMongoId(),
  ],
  notificationController.createNotification
);

// DELETE /api/notifications/:id
router.delete(
  "/:id",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  [check("id").isMongoId().withMessage("Invalid notification ID")],
  notificationController.deleteNotification
);

// Notification settings endpoints
router.get(
  "/settings",
  auth.authenticateToken,
  notificationController.getSettings
);
router.patch(
  "/settings",
  auth.authenticateToken,
  notificationController.updateSettings
);


// GET /api/notifications/all - all notifications
router.get(
  "/all",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  (req, res, next) => {
    req.query = { ...req.query }; // no filter, get all
    next();
  },
  notificationController.getNotifications
);

// GET /api/notifications/partnerships - all partnership notifications
router.get(
  "/partnerships",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  (req, res, next) => {
    req.query = { ...req.query, type: "Partnerships" };
    next();
  },
  notificationController.getNotifications
);

// GET /api/notifications/system-read - all read system notifications
router.get(
  "/system-read",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  (req, res, next) => {
    req.query = { ...req.query, type: "System", isRead: "true" };
    next();
  },
  notificationController.getNotifications
);

// GET /api/notifications/alerts - all alert notifications
router.get(
  "/alerts",
  auth.authenticateToken,
  auth.authorizeRoles("Admin", "SuperAdmin"),
  (req, res, next) => {
    req.query = { ...req.query, type: "Alerts" };
    next();
  },
  notificationController.getNotifications
);

export default router;
