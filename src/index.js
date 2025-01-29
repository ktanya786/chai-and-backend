import dotenv from "dotenv";
import connectDB from "./db/index.js";
import express from "express";

dotenv.config({
  path: "./env",
});

connectDB();

/*
const app = express();
(async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("Connected to MongoDB");
    app.on("error", (error) => {
      console.log("Error", error);
      throw error;
    });
    app.listen(process.env.PORT, () => {
      console.log("Server is running on port", process.env.PORT);
    });
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
    throw error;
  }
})();*/
