// Import the necessary modules
const { Server } = require("socket.io");
const ChatModel = require("./model/chatModel");
const CollaboratorModel = require("./model/collaboratorModel");

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
    // console.log(`User Connected: ${socket.id}`);

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

    socket.on("send_message", async (data) => {
      // socket.to(data?.room).emit("receive_message"); //comment the previous
      console.log("============================");
      console.log(
        "Sender: " + JSON.stringify(data.messageData.sender.fullName)
      );
      console.log("Room: " + JSON.stringify(data.room));
      console.log(
        "Message: " + JSON.stringify(data.messageData.message[0].content)
      );
      console.log("============================");
      io.emit("receive_message", {
        message: data.messageData,
        room: data.roomData,
      });
      const collaborators = await CollaboratorModel.find({
        title: data.title,
      })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("_id job users client title status createdAt updatedAt");
      const chatPromises = collaborators.map(async (collaborator) => {
        const latestChat = await ChatModel.findOne({
          collaborator: collaborator._id,
        })
          .sort({ "message.timestamp": -1 })
          .populate("sender", "_id fullName")
          .select("message.timestamp");
        const lastChat = await ChatModel.findOne({
          collaborator: collaborator._id,
        })
          .sort({ "message.timestamp": -1 })
          .populate("sender", "_id fullName")
          .select("message");
        return {
          collaborator,
          latestChat: latestChat ? latestChat.message[0] : "None",
          lastChat: lastChat,
        };
      });
      const updateChats = await Promise.all(chatPromises);
      io.emit("update_list", { newRoom: updateChats });
    });

    socket.on("new_collaborator", async (data) => {
      console.log(data.collaborator_title);
      const collaborators = await CollaboratorModel.find({
        title: data.collaborator_title,
      })
        .populate("users", "_id fullName")
        .populate("job", "_id title details")
        .select("_id job users client title status createdAt updatedAt");
      const chatPromises = collaborators.map(async (collaborator) => {
        const latestChat = await ChatModel.findOne({
          collaborator: collaborator._id,
        })
          .sort({ "message.timestamp": -1 })
          .populate("sender", "_id fullName")
          .select("message.timestamp");
        const lastChat = await ChatModel.findOne({
          collaborator: collaborator._id,
        })
          .sort({ "message.timestamp": -1 })
          .populate("sender", "_id fullName")
          .select("message");
        return {
          collaborator,
          latestChat: latestChat ? latestChat.message[0] : null,
          lastChat: lastChat,
        };
      });
      const chats = await Promise.all(chatPromises);
      io.emit("new_groupchat", { newRoom: chats });
    });
    socket.on("error", () => {
      console.log("Socket Error");
    });

    // V2
    socket.on("send_message_test", (data) => {
      console.log(`Group: ${data.title}\nMessage: ${data.message}`);
      socket.to(data?.room).emit("receive_message");
    });
  });
};

// Export the function
module.exports = { initializeSocketServer };
