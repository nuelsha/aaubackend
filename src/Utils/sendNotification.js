import Notification from "../Models/notificationModel.js";
import NotificationSettings from "../Models/notificationSettingsModel.js";
import User from "../Models/userModel.js";

/**
 * Send a notification, respecting user notification settings.
 * @param {Object} param0
 * @param {string} param0.title
 * @param {string} param0.message
 * @param {string} param0.type - "System" | "Partnerships" | "Alerts"
 * @param {string} [param0.userId] - If provided, send to this user only
 */
export async function sendNotification({ title, message, type, userId }) {
  if (!title || !message || !type) return;
  if (userId) {
    // User-specific notification
    const settings = await NotificationSettings.findOne({ userId });
    if (!settings || settings.preferences[type.toLowerCase()]) {
      await Notification.create({ title, message, type, userId });
    }
  } else {
    // System/partnership/alert for all users with that type enabled
    const users = await User.find({ role: { $in: ["Admin", "SuperAdmin"] } });
    for (const user of users) {
      const settings = await NotificationSettings.findOne({ userId: user._id });
      if (!settings || settings.preferences[type.toLowerCase()]) {
        await Notification.create({ title, message, type, userId: user._id });
      }
    }
  }
} 