import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { leaveGame, leaveGameProps } from "./logic/leaveGame";
import { joinGame, joinGameProps } from "./logic/joinGame";
import { updateGame } from "./logic/updateGames";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your frontend URL
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Sample endpoint to check if the server is running
app.get("/", (req, res) => {
  res.send("Exploding Kittens backend is running!");
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Handle a player joining the game
  socket.on("join-game", (body: joinGameProps) => {
    joinGame({ ...body, socket });
  });

  // Handle a player joining the game
  socket.on("update-game", (gameId: string) => {
    updateGame({ gameId, socket });
  });

  // Handle game events
  socket.on("play-card", (data) => {
    // playCard();
  });

  socket.on("leave-game", (body: leaveGameProps) => {
    leaveGame({ ...body, socket });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
