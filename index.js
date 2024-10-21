// Import necessary modules
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");

// Import the Socket.IO server initialization
const { initializeSocketServer } = require("./socket-server");

// Initialize express app
const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// CORS configuration for the HTTP routes
app.use(
  cors({
    origin: ["https://darkshot-web.onrender.com"], // Update with your front-end URL
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// Import routes
const {
  userRoute,
  jobRoute,
  categoryRoute,
  applicationRoute,
  appointmentRoute,
  collaboratorRoute,
  chatRoute,
} = require("./routes/allRoutes");

// Route all API requests
app.use("/api", userRoute);
app.use("/api", jobRoute);
app.use("/api", categoryRoute);
app.use("/api", applicationRoute);
app.use("/api", appointmentRoute);
app.use("/api", collaboratorRoute);
app.use("/api", chatRoute);

// Create HTTP server
const server = http.createServer(app);

// Initialize the Socket.IO server
initializeSocketServer(server);

// Database connection and server start
mongoose.set("strictQuery", false);
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
    console.log("Connected to DB =>");
  })
  .catch((err) => {
    console.log(err);
  });
