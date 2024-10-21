// Import the necessary modules
const { Server } = require("socket.io");

// Function to initialize the Socket.IO server
const initializeSocketServer = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "https://darkshot-web.onrender.com", // Update with your frontend origin
      credentials: true,
    },
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

    socket.on("error", () => {
      console.log("Socket Error");
    });
  });
};

// Export the function
module.exports = { initializeSocketServer };
