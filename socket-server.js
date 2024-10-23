// Import the necessary modules
const { Server } = require("socket.io");

// Function to initialize the Socket.IO server
const initializeSocketServer = (server) => {
  const NODE_ENVIRONMENT = process.env.NODE_ENV;
  const WEB_LINK_LOCAL = process.env.WEB_LINK_LOCAL;
  const WEB_LINK_HOSTING = process.env.WEB_LINK_HOSTING;
  const API_URL =
    NODE_ENVIRONMENT === "development"
      ? WEB_LINK_LOCAL
      : NODE_ENVIRONMENT === "production"
      ? WEB_LINK_HOSTING
      : "http://localhost:3001";

  const io = new Server(server, {
    cors: {
      origin: [API_URL], // Update with your frontend origin
      credentials: true,
    },
    reconnection: true, // Enable reconnection
  });

  // Handle connection events
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
    });

    socket.on("send_message", (data) => {
      console.log(`Group: ${data.title}\nMessage: ${data.message}`);
      socket.to(data?.room).emit("receive_message", data);
    });

    socket.on("typing", (room) => {
      socket.to(room).emit("user_typing", { userId: socket.id });
      console.log(`User with ID: ${socket.id} is typing in room: ${room}`);
    });

    socket.on("error", () => {
      console.log("Socket Error");
    });
  });
};

// Export the function
module.exports = { initializeSocketServer };
