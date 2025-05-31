// Import necessary modules
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http");
require("dotenv").config();
const {
  uploadFile,
  downloadFile,
  deleteAllFilesAndFolders,
  createUsersFolder,
  createChatsFolder,
} = require("./controllers/googleDriveApi");
// Import the Socket.IO server initialization
const { initializeSocketServer } = require("./socket-server");

// Initialize express app
const app = express();
// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
const NODE_ENVIRONMENT = process.env.NODE_ENV;
const WEB_LINK_LOCAL = process.env.WEB_LINK_LOCAL;
const WEB_LINK_HOSTING = process.env.WEB_LINK_HOSTING;
const API_URL =
  NODE_ENVIRONMENT === "development"
    ? WEB_LINK_LOCAL
    : NODE_ENVIRONMENT === "production"
    ? WEB_LINK_HOSTING
    : "http://localhost:3001";

const allowedOrigins = [
  API_URL,
  "capacitor://localhost",
  "ionic://localhost",
  "http://localhost",
  "http://localhost:8080",
  "http://localhost:8100",
  "https://localhost",
  "http://localhost:5173",
  "http://192.168.*.*:8100",
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origin not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.options("*", cors(corsOptions));
app.use(cors(corsOptions));

// deleteAllFilesAndFolders();
// Import routes
const {
  userRoute,
  jobRoute,
  categoryRoute,
  applicationRoute,
  appointmentRoute,
  collaboratorRoute,
  chatRoute,
  googleRoute,
} = require("./routes/allRoutes");
// Route all API requests
app.use("/api", userRoute);
app.use("/api", jobRoute);
app.use("/api", categoryRoute);
app.use("/api", applicationRoute);
app.use("/api", appointmentRoute);
app.use("/api", collaboratorRoute);
app.use("/api", chatRoute);
app.use("/api", googleRoute);

// Create HTTP server
const server = http.createServer(app);

// RECOMMIT

// Initialize the Socket.IO server
initializeSocketServer(server);

// Database connection and server start
mongoose.set("strictQuery", false);
const PORT = process.env.PORT || 3001;
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on port: ${PORT}`);
      console.log(
        `API: ${
          NODE_ENVIRONMENT === "development"
            ? `${WEB_LINK_LOCAL} === development`
            : NODE_ENVIRONMENT === "production"
            ? `${WEB_LINK_HOSTING} === production`
            : `${NODE_ENVIRONMENT} === catch`
        }`
      );
    });
    console.log("Connected to DB =>");
  })
  .catch((err) => {
    console.log(err);
  });
