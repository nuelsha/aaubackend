import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import generateTokenAndSetCookie from "../Utils/generateTokenAndSetCookie.js";
import User from "../Models/userModel.js";

const isValidEmail = (email) => {
  const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return pattern.test(email);
};

// Enhanced password validation function
const isStrongPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one digit, one special character
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
  return pattern.test(password);
};

// Middleware to authenticate JWT
const authMiddleware = (req, res, next) => {
  const token = req.cookies.jwt;
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, process.env.PRIVATE_KEY);
    req.user = decoded; // { userId, email, role }
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate request body
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      const lockoutTime = user.accountLockedUntil;
      const remainingTime = Math.ceil((lockoutTime - new Date()) / (1000 * 60)); // minutes
      return res.status(423).json({ 
        error: `Account is locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`,
        lockoutRemaining: remainingTime
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      // Increment failed login attempts
      await user.incrementFailedAttempts();
      
      const remainingAttempts = 5 - user.failedLoginAttempts;
      
      if (remainingAttempts <= 0) {
        return res.status(423).json({ 
          error: "Account has been locked due to too many failed login attempts. Please try again in 15 minutes.",
          lockoutRemaining: 15
        });
      }
      
      return res.status(400).json({ 
        error: `Invalid email or password. ${remainingAttempts} attempts remaining before account lockout.`,
        remainingAttempts
      });
    }

    // Successful login - reset failed attempts
    await user.resetFailedAttempts();

    const token = generateTokenAndSetCookie(user, res);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      campusId: user.campusId,
      status: user.status,
      token: token,
    });
  } catch (error) {
    console.error("Error in login controller:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error.message, error.stack);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    const { email } = req.user; // Get email from authenticated user

    if (!newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirmation are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    // Enhanced password strength check
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        error:
          "Password must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one digit, and one special character."
      });
    }

    const user = await User.findOne({ email });

    // THIS IS THE FIX: HASH THE NEW PASSWORD BEFORE SAVING
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;

    await user.save();

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export default { login, logout, resetPassword, authMiddleware };
