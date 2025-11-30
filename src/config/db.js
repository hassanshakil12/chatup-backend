import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // More detailed debug information
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables");
    }

    console.log("Attempting to connect to MongoDB...");
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    
    console.log(`MongoDB connected successfully to: ${conn.connection.host}`);
    console.log(`Database name: ${conn.connection.name}`);
    
  } catch (error) {
    console.error("MongoDB connection failed:");
    console.error(`- Error: ${error.message}`);
    console.error(`- MONGO_URI: ${process.env.MONGO_URI ? "Exists" : "UNDEFINED"}`);
    process.exit(1);
  }
};

export default connectDB;