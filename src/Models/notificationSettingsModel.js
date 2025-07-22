import mongoose from "mongoose";

const notificationSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  preferences: {
    system: { type: Boolean, default: true },
    partnership: { type: Boolean, default: true },
    alerts: { type: Boolean, default: true },
  },
});

export default mongoose.model("NotificationSettings", notificationSettingsSchema); 