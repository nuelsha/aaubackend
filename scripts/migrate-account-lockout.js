import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../src/Models/userModel.js";

dotenv.config();

const migrateAccountLockout = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update all existing users to include the new lockout fields
    const result = await User.updateMany(
      {
        $or: [
          { failedLoginAttempts: { $exists: false } },
          { lastFailedLogin: { $exists: false } },
          { accountLockedUntil: { $exists: false } }
        ]
      },
      {
        $set: {
          failedLoginAttempts: 0,
          lastFailedLogin: null,
          accountLockedUntil: null
        }
      }
    );

    console.log(`Migration completed. Updated ${result.modifiedCount} users.`);
    
    // Verify the migration
    const usersWithoutFields = await User.countDocuments({
      $or: [
        { failedLoginAttempts: { $exists: false } },
        { lastFailedLogin: { $exists: false } },
        { accountLockedUntil: { $exists: false } }
      ]
    });

    if (usersWithoutFields === 0) {
      console.log("✅ All users have been successfully migrated with lockout fields.");
    } else {
      console.log(`⚠️  ${usersWithoutFields} users still missing lockout fields.`);
    }

  } catch (error) {
    console.error("Migration failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateAccountLockout();
}

export default migrateAccountLockout; 