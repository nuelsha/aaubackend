/**
 * Account Lockout Utility Functions
 * Handles failed login attempts and account lockout logic
 */

export const LOCKOUT_CONFIG = {
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 15,
  RESET_WINDOW_MINUTES: 10
};

/**
 * Check if a user account is currently locked
 * @param {Object} user - User object from database
 * @returns {boolean} - True if account is locked
 */
export const isAccountLocked = (user) => {
  if (!user.accountLockedUntil) return false;
  return new Date() < user.accountLockedUntil;
};

/**
 * Get remaining lockout time in minutes
 * @param {Object} user - User object from database
 * @returns {number} - Remaining minutes until unlock
 */
export const getRemainingLockoutTime = (user) => {
  if (!user.accountLockedUntil) return 0;
  const remaining = Math.ceil((user.accountLockedUntil - new Date()) / (1000 * 60));
  return Math.max(0, remaining);
};

/**
 * Get remaining login attempts before lockout
 * @param {Object} user - User object from database
 * @returns {number} - Remaining attempts
 */
export const getRemainingAttempts = (user) => {
  return Math.max(0, LOCKOUT_CONFIG.MAX_FAILED_ATTEMPTS - user.failedLoginAttempts);
};

/**
 * Check if failed attempts should be reset based on time window
 * @param {Object} user - User object from database
 * @returns {boolean} - True if attempts should be reset
 */
export const shouldResetAttempts = (user) => {
  if (!user.lastFailedLogin) return true;
  
  const now = new Date();
  const resetWindow = new Date(now.getTime() - LOCKOUT_CONFIG.RESET_WINDOW_MINUTES * 60 * 1000);
  
  return user.lastFailedLogin < resetWindow;
};

/**
 * Create lockout response object
 * @param {Object} user - User object from database
 * @returns {Object} - Response object with lockout information
 */
export const createLockoutResponse = (user) => {
  const remainingTime = getRemainingLockoutTime(user);
  
  return {
    error: `Account is locked due to too many failed login attempts. Please try again in ${remainingTime} minutes.`,
    lockoutRemaining: remainingTime,
    statusCode: 423
  };
};

/**
 * Create failed attempt response object
 * @param {Object} user - User object from database
 * @returns {Object} - Response object with attempt information
 */
export const createFailedAttemptResponse = (user) => {
  const remainingAttempts = getRemainingAttempts(user);
  
  if (remainingAttempts <= 0) {
    return createLockoutResponse(user);
  }
  
  return {
    error: `Invalid email or password. ${remainingAttempts} attempts remaining before account lockout.`,
    remainingAttempts,
    statusCode: 400
  };
};

export default {
  LOCKOUT_CONFIG,
  isAccountLocked,
  getRemainingLockoutTime,
  getRemainingAttempts,
  shouldResetAttempts,
  createLockoutResponse,
  createFailedAttemptResponse
}; 