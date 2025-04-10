import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { handleRooms } from "./logic/rooms";
import { handleGame } from "./logic/game";
import { generateToken } from "./auth/jwt";
import { randomUUID } from "crypto";
import type { Socket } from "socket.io";
import { OAuth2Client } from "google-auth-library";

export interface AuthenticatedSocket extends Socket {
  userId: string;
  username: string;
}

export const app = express();

const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Exploding Kittens backend is running!");
});

app.get("/auth", (req, res) => {
  const username = req.query.username as string;
  if (!username) {
    res.status(400).json({ error: "Username required" });
    return;
  }

  const userId = randomUUID();
  const token = generateToken(userId, username);
  res.json({ token, userId });
});

const users: Record<
  string,
  { userId: string; username: string; passwordHash: string }
> = {};

const hashPassword = (password: string) => {
  return password;
};

app.post("/register", (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (users[email]) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }

  const userId = randomUUID();
  const passwordHash = hashPassword(password);

  users[email] = { userId, username, passwordHash };

  const token = generateToken(userId, username);

  console.log(`User registered: ${username} (${email})`);
  res
    .status(201)
    .json({ token, userId, username, message: "User registered successfully" });
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const user = users[email];

  if (!user || hashPassword(password) !== user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken(user.userId, user.username);
  res.json({ token, userId: user.userId, username: user.username });
});

const CLIENT_ID =
  "274103679822-lu710d83u75ovuh2rhcvlqqn3rqt5l85.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);

async function verifyGoogleToken(token: string) {
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error("Google token verification error:", error);
    return null;
  }
}

app.post("/auth/google", async (req, res) => {
  const { token } = req.body;

  const payload = await verifyGoogleToken(token);

  if (!payload) {
    res.status(401).json({ error: "Invalid Google token" });
    return;
  }

  const email = payload.email || "";
  const username = payload.name || "Google User";

  let user = users[email];

  if (!user) {
    const userId = randomUUID();
    user = {
      userId: userId,
      username: username,
      passwordHash: "",
    };
    users[email] = user;
  }

  const jwtToken = generateToken(user.userId, user.username);
  res.json({ token: jwtToken, userId: user.userId, username: user.username });
});

const userSocketMap = new Map<string, string>();

import "./auth/socketMiddleware";

io.on("connection", (rawSocket) => {
  const socket = rawSocket as AuthenticatedSocket;

  const { userId, username } = socket;

  userSocketMap.set(userId, socket.id);

  console.log(
    `User ${username} (${userId}) connected with socket ${socket.id}`
  );

  handleRooms(io, socket);
  handleGame(io, socket);

  socket.on("disconnect", () => {
    userSocketMap.delete(userId);
    console.log(`User ${username} (${userId}) disconnected`);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
