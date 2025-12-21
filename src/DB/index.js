import mongoose from "mongoose";
import express from "express"
// import { DB_NAME } from "../constant";
 const app = express()

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URL}/${process.env.DB_NAME}`
    );

    console.log("✓ MongoDB Connected Successfully");

    // Show host & DB name
    console.log(`📌 Host: ${connectionInstance.connection.host}`);
    console.log(`📌 Database: ${connectionInstance.connection.name}`);

  } catch (error) {
    console.log("❌ MongoDB Connection Error:", error.message);

    // Stop the app if DB fails
    process.exit(1);
  }
};

export default connectDB;
