import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import fs from "fs";
import User from "../src/Models/userModel.js";

dotenv.config();

const superAdmins = JSON.parse(process.env.SUPER_ADMIN_EMAILS || "[]");
const logPasswords = process.env.LOG_PASSWORDS === "true";

const generatePassword = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const preRegisterSuperAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);


    const passwordOutput = [];

    for (const email of superAdmins) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        passwordOutput.push(`SuperAdmin ${email}: Already registered (use reset password to change)`);
        continue;
      }

      const password = generatePassword();

      const superAdmin = new User({
        firstName: "Super",
        lastName: email.split("@")[0],
        email,
        password, // Use plain password
        role: "SuperAdmin",
        status: "active",
        campusId: null,
      });

      await superAdmin.save();
      if (logPasswords) console.log(`Password: ${password}`);
      passwordOutput.push(`SuperAdmin ${email}: ${password}`);
    }

    if (passwordOutput.length > 0) {
      fs.writeFileSync("superadmin_passwords.txt", passwordOutput.join("\n"));
    }

    console.log("SuperAdmin registration completed");
  } catch (error) {
    console.error("Error registering SuperAdmins:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

preRegisterSuperAdmins();