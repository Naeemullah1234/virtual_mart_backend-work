const express = require("express");
const dns = require("dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

dotenv.config();
connectDB();

const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const routes = require("./routes");

app.use("/api", routes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API Not Found",
  });
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});