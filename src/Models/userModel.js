// Models/userModel.js
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ["SuperAdmin", "Admin"], // Kept as provided
      required: true,
      default: "Admin",
    },
    campusId: {
      type: String,
      required: function () {
        return this.role !== "SuperAdmin";
      },
    },
    status: {
      type: String,
      enum: ["pending", "active", "inactive"],
      default: "pending",
    },
    // Login attempt tracking
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lastFailedLogin: {
      type: Date,
      default: null,
    },
    accountLockedUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving, but skip if already hashed
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Check if password is already hashed (starts with $2a$, $2b$, or $2y$)
  if (this.password && this.password.startsWith("$2")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check if account is locked
userSchema.methods.isAccountLocked = function() {
  if (!this.accountLockedUntil) return false;
  return new Date() < this.accountLockedUntil;
};

// Method to increment failed login attempts
userSchema.methods.incrementFailedAttempts = function() {
  const now = new Date();
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
  
  // Reset attempts if more than 10 minutes have passed
  if (!this.lastFailedLogin || this.lastFailedLogin < tenMinutesAgo) {
    this.failedLoginAttempts = 1;
  } else {
    this.failedLoginAttempts += 1;
  }
  
  this.lastFailedLogin = now;
  
  // Lock account if 5 or more failed attempts
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes
  }
  
  return this.save();
};

// Method to reset failed login attempts
userSchema.methods.resetFailedAttempts = function() {
  this.failedLoginAttempts = 0;
  this.lastFailedLogin = null;
  this.accountLockedUntil = null;
  return this.save();
};

const User = mongoose.model("User", userSchema);

export default User;