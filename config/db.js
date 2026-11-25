
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log("MongoDB Connected Successfully");

  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);

    // Important: Do not silently continue without MongoDB
    throw error;
  }
};

module.exports = connectDB;
