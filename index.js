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
const RENDER_SERVER = process.env.RENDER_SERVER_URL;
const LOCAL_WEB = process.env.LOCAL_WEB;
const LOCAL_SERVER = process.env.LOCAL_SERVER;
const RENDER_WEB = process.env.RENDER_WEB_URL;

const MONGO_URL = process.env.MONGO_URL;
const PORT = process.env.PORT;
//
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
//
app.use(
  cors({
    origin: [LOCAL_WEB, RENDER_WEB], // Replace with your frontend URL
    credentials: true, // Allow credentials (cookies, etc.)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type"], // Allowed headers
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
    origin: LOCAL_WEB,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type"], // Allowed headers
  },
});
console.log(LOCAL_WEB);
io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`User Disconnected: ${socket.id}`);
  });

  socket.on("join_room", (room) => {
    if (socket.currentRoom) {
      socket.leave(socket.currentRoom);
      console.log(
        `User with ID: ${socket.id} left room: ${socket.currentRoom}`
      );
    }
    socket.join(room);
    socket.currentRoom = room;
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
    console.log(`Rooms for user:`, Array.from(socket.rooms)); // Log the rooms
  });

  socket.on("send_message", (data) => {
    console.log(`Group: ${data.title}\nMessage: ${data.message}`);
    socket.to(data?.room).emit("receive_message", data);
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
