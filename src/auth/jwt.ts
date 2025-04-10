import jwt from "jsonwebtoken";

const JWT_SECRET = "my_secret_42dfkdj223";

export const generateToken = (userId: string, username: string) => {
  return jwt.sign({ userId, username }, JWT_SECRET, { expiresIn: "7d" });
};

export const verifyToken = (
  token: string
): { userId: string; username: string } => {
  return jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
};
