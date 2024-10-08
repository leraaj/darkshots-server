const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
require("dotenv").config();
// ENV
const BASE = process.env.BASE_URL;
const MONGO_URL = process.env.MONGO_URL;
const APP = process.env.APP_URL;
const PORT = process.env.PORT;
//
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//
app.use(
  cors({
    credentials: true,
    origin: [
      BASE,
      APP,
      "https://git-app-eal7.onrender.com",
      "https://darkshot-web.onrender.com",
      "*",
    ],
  })
);
// ROUTES
const userRoute = require("./routes/userRoute");
const jobRoute = require("./routes/jobRoute");
const categoryRoute = require("./routes/categoryRoute");
const applicationRoute = require("./routes/applicationRoute");
const appointmentRoute = require("./routes/appointmentRoute");
const collaboratorRoute = require("./routes/collaboratorRoute");
const chatRoute = require("./routes/chatRoute");
const { createFolder, uploadFile } = require("./controllers/googleDriveApi");
app.use("/api", userRoute);
app.use("/api", jobRoute);
app.use("/api", categoryRoute);
app.use("/api", applicationRoute);
app.use("/api", appointmentRoute);
app.use("/api", collaboratorRoute);
app.use("/api", chatRoute);
// ROUTES

// createFolder();
uploadFile();
mongoose.set("strictQuery", false);
mongoose
  .connect(MONGO_URL)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
    console.log("Connected to DB =>");
  })
  .catch((err) => {
    console.log(err);
  });
