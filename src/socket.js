const socketIo = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();

let io;

function initialize(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.URL_FE_APP || "*", // Fallback to wildcard if not set
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
    },
    transports: ["websocket", "polling"], // Support both transports
    allowEIO3: true, // Backward compatibility
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on("connection", (socket) => {
    console.log("✓ Socket.IO client connected:", socket.id);

    socket.on("disconnect", (reason) => {
      console.log("✗ Socket.IO client disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("✗ Socket.IO error:", error);
    });
  });

  console.log("🚀 Socket.IO initialized with CORS origin:", process.env.URL_FE_APP || "*");
}

function getIo() {
  if (!io) {
    return;
  }
  return io;
}

module.exports = {
  initialize,
  getIo,
};
