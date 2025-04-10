import { io } from "..";
import { verifyToken } from "./jwt";

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token provided"));

  try {
    const payload = verifyToken(token);
    (socket as any).userId = payload.userId;
    (socket as any).username = payload.username;
    next();
  } catch (err) {
    return next(new Error("Invalid token"));
  }
});
