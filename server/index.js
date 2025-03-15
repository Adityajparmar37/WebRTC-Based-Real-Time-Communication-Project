// For Vercel deployment with Socket.IO
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();

// Create an HTTP server
const httpServer = createServer((req, res) => {
  // Set CORS headers directly on all responses
  res.setHeader(
    "Access-Control-Allow-Origin",
    "https://webrtc-project-gamma.vercel.app"
  );
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight OPTIONS requests
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  // Simple health check endpoint
  if (req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("WebRTC Socket.IO Server is running");
    res.end();
  }
});

// Initialize Socket.IO with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: [
      "https://webrtc-project-gamma.vercel.app",
      "http://localhost:3000",
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
  transports: ["websocket", "polling"],
  allowEIO3: true, // Allow Engine.IO version 3 clients
});

const emailToSocketIdMap = new Map();
const socketIdToEmailMap = new Map();

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    const { email, room } = data;
    emailToSocketIdMap.set(email, socket.id);
    socketIdToEmailMap.set(socket.id, email);

    io.to(room).emit("user:joined", { email, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ toUser, offer }) => {
    io.to(toUser).emit("incoming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:candidate", ({ candidate, to }) => {
    io.to(to).emit("peer:candidate", { candidate });
  });

  socket.on("peer:negotiation", ({ to, offer }) => {
    io.to(to).emit("peer:negotiation", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });
});

// Start the server
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// For Vercel serverless deployment
module.exports = httpServer;
