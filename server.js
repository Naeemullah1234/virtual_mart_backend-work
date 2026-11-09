const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("path");
const cors = require("cors");
const connectDB = require("./config/db");
const cron = require("node-cron");
const cleanupOrphanImages = require("./utils/cleanupOrphanImages");
const routes = require("./routes");
const adminRoutes = require("./routes/admin.routes");
const {startOrderNotificationRetry,} = require("./services/orderNotification.service");


connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use( "/uploads",express.static(path.join(__dirname, "uploads")));
app.use("/api/admins", adminRoutes);
app.use("/api", routes);

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



app.use((req, res) => {
  res.status(404).json({success: false,message: "API Not Found",});});


cron.schedule("0 2 * * *",
  async () => {
    await cleanupOrphanImages();},
  {timezone: "Asia/Karachi",});


const PORT = process.env.PORT || 5000;

 startOrderNotificationRetry();

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});