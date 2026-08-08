const express = require("express");
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
const path = require("path");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const cron = require("node-cron");
const cleanupOrphanImages = require("./utils/cleanupOrphanImages");
const routes = require("./routes");

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use( "/uploads",express.static(path.join(__dirname, "uploads")));
app.use("/api", routes);


app.use((req, res) => {
  res.status(404).json({success: false,message: "API Not Found",});});


cron.schedule(
  "0 2 * * *",
  async () => {
   console.log("🧹 Running Daily Image Cleanup...");
    await cleanupOrphanImages();
  },
  {
    timezone: "Asia/Karachi",
  }
);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});