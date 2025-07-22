import jwt from "jsonwebtoken";
import User from "../Models/userModel.js";

export const authenticateToken = async (req, res, next) => {
  // Try to get token from Authorization header first
  let token = null;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.PRIVATE_KEY || process.env.JWT_SECRET
    );

    if (!decoded.id || !decoded.role) {
      return res
        .status(401)
        .json({ error: "Invalid token: missing id or role" });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if account is locked
    if (user.isAccountLocked()) {
      return res.status(423).json({ 
        error: "Account is locked due to too many failed login attempts",
        lockoutRemaining: Math.ceil((user.accountLockedUntil - new Date()) / (1000 * 60))
      });
    }

    // Verify role consistency
    if (decoded.role !== user.role) {
      return res.status(403).json({ error: "Role mismatch in token" });
    }

    req.user = {
      userId: decoded.id,
      email: user.email, // Add email to req.user for password reset verification
      role: decoded.role,
      campusId: decoded.campusId || user.campusId,
      status: user.status,
    };

    next();
  } catch (error) {
    console.error("Token verification error:", error.message, error.stack);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const normalizedUserRole = req.user.role ? req.user.role.toLowerCase() : "";
    const normalizedRequiredRoles = roles.map((r) => r.toLowerCase());
    if (
      !normalizedUserRole ||
      !normalizedRequiredRoles.includes(normalizedUserRole)
    ) {
      return res
        .status(403)
        .json({ error: "Access forbidden: insufficient role" });
    }
    next();
  };
};

export const verifyOwnership = (req, res, next) => {
  const requestedEmail = req.body.email;
  const loggedInUserEmail = req.user.email;

  if (requestedEmail !== loggedInUserEmail) {
    return res.status(403).json({
      error: "You can only reset your own password",
    });
  }

  next();
};

export default {
  authenticateToken,
  authorizeRoles,
  verifyOwnership,
};
