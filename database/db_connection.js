import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const db_connection = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
  } catch (error) {
    console.log("Error connecting to MongoDB", error.message);
  }
};

export default db_connection;
