import Notification from "../Models/notificationModel.js";
import { validationResult } from "express-validator";
import mongoose from "mongoose";
import NotificationSettings from "../Models/notificationSettingsModel.js";

// Helper: build filter based on query and user role
function buildNotificationFilter(req) {
  const { type, isRead } = req.query;
  let filter = {};
  if (type && ["Partnerships", "System", "Alerts"].includes(type)) {
    filter.type = type;
  }
  if (isRead === "true") filter.isRead = true;
  if (isRead === "false") filter.isRead = false;
  // Only SuperAdmin sees all, Admin sees own
  if (req.user.role !== "SuperAdmin") {
    filter.userId = req.user.userId;
  }
  return filter;
}

// GET /api/notifications
export const getNotifications = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { limit = 10, page = 1 } = req.query;
    const filter = buildNotificationFilter(req);
    const total = await Notification.countDocuments(filter);
    const notifications = await Notification.find(filter)
      .sort({ timestamp: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    res.status(200).json({
      notifications,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/unread
export const getUnreadNotifications = async (req, res) => {
  try {
    const filter = buildNotificationFilter(req);
    filter.isRead = false;
    const notifications = await Notification.find(filter).sort({ timestamp: -1 });
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications
export const createNotification = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { title, message, type, userId } = req.body;
    const notification = new Notification({
      title,
      message,
      type,
      userId: userId || undefined,
      isRead: false,
      timestamp: new Date(),
    });
    await notification.save();
    res.status(201).json({ message: "Notification created", notification });
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/notifications/:id/read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    if (req.user.role !== "SuperAdmin") {
      filter.userId = req.user.userId;
    }
    const notification = await Notification.findOneAndUpdate(
      filter,
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json({ message: "Notification marked as read", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// PATCH /api/notifications/read-all
export const markAllAsRead = async (req, res) => {
  try {
    const filter = buildNotificationFilter(req);
    await Notification.updateMany(filter, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE /api/notifications/:id
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const filter = { _id: id };
    if (req.user.role !== "SuperAdmin") {
      filter.userId = req.user.userId;
    }
    const notification = await Notification.findOneAndDelete(filter);
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// GET /api/notifications/settings
export const getSettings = async (req, res) => {
  try {
    let settings = await NotificationSettings.findOne({ userId: req.user.userId });
    if (!settings) {
      settings = new NotificationSettings({ userId: req.user.userId });
      await settings.save();
    }
    res.status(200).json({ settings });
  } catch (error) {
    console.error("Error fetching notification settings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// POST /api/notifications/settings
export const updateSettings = async (req, res) => {
  try {
    const { preferences } = req.body;
    let settings = await NotificationSettings.findOneAndUpdate(
      { userId: req.user.userId },
      { preferences },
      { new: true, upsert: true }
    );
    res.status(200).json({ message: "Settings updated", settings });
  } catch (error) {
    console.error("Error updating notification settings:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export default {
  getNotifications,
  getUnreadNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getSettings,
  updateSettings,
}; 