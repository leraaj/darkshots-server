const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

require("dotenv").config();

const {
  userRoute,
  jobRoute,
  categoryRoute,
  applicationRoute,
  appointmentRoute,
  collaboratorRoute,
  chatRoute,
} = require("./routes/allRoutes");

const {
  createFolder,
  uploadFile,
  downloadFile,
} = require("./controllers/googleDriveApi"); //TESTING

// ENV
const RENDER = process.env.RENDER_URL;
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
    origin: [BASE, APP, RENDER, "*"],
  })
);

// ROUTES
app.use("/api", userRoute);
app.use("/api", jobRoute);
app.use("/api", categoryRoute);
app.use("/api", applicationRoute);
app.use("/api", appointmentRoute);
app.use("/api", collaboratorRoute);
app.use("/api", chatRoute);
// SOCKET.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });

  socket.on("join_room", (room) => {
    // Leave the current room if there is one
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      console.log(
        `User with ID: ${socket.id} left room: ${socket.currentRoom}`
      );
    }
    // Join the new room
    socket.join(room);
    socket.currentRoom = room;
    console.log(`User with ID: ${socket.id}, joined room: ${room}`);
  });

  socket.on("send_message", (data) => {
    console.log(data);
    socket.to(data?.room).emit("receive_message");
  });
});

// SERVER CONNECTION
mongoose.set("strictQuery", false);
mongoose
  .connect(MONGO_URL)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port: ${PORT}`);
    });
    console.log("Connected to DB =>");
  })
  .catch((err) => {
    console.log(err);
  });
