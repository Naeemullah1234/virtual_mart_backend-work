const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const cron = require("node-cron");
const {startEmailDispatcher,} = require("./services/emailDispatcher.service");
const connectDB = require("./config/db");
const cleanupOrphanImages = require("./utils/cleanupOrphanImages");
const routes = require("./routes");
const adminRoutes = require("./routes/admin.routes");
const {startOrderNotificationRetry,} = require("./services/orderNotification.service");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
app.use("/api/admins", adminRoutes);
app.use("/api", routes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("GLOBAL API ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  const message =
    typeof err.message === "string"
      ? err.message
      : "Something went wrong.";

  const statusCode =
    err.name === "MulterError" ? 400 : err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message,
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Not Found",
  });
});

const PORT = process.env.PORT || 5000;

// Application Startup
const startServer = async () => {
  try {
    // 1. Connect MongoDB first
    await connectDB();

    console.log("CONNECTED DATABASE:", mongoose.connection.name);
console.log("CONNECTED HOST:", mongoose.connection.host);

    // Start MongoDB to Redis email dispatcher
startEmailDispatcher();

    // 2. Start order notification retry after DB connection
    startOrderNotificationRetry();

    // 3. Schedule orphan image cleanup
    cron.schedule(
      "0 2 * * *",
      async () => {
        try {
          await cleanupOrphanImages();
        } catch (error) {
          console.error("ORPHAN IMAGE CLEANUP ERROR:", error);
        }
      },
      {
        timezone: "Asia/Karachi",
      }
    );

    // 4. Start HTTP server
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("SERVER STARTUP FAILED:", error);

    process.exit(1);
  }
};

startServer();
