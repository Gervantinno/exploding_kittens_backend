import { Server } from "socket.io";
import { AuthenticatedSocket } from "..";

interface IRoom {
  id: string;
  name: string;
  players: { userId: string; username: string; index: number }[];
  gameStarted: boolean;
}

const rooms: IRoom[] = [];

export function handleRooms(io: Server, socket: AuthenticatedSocket) {
  const leaveAllRooms = () => {
    rooms.forEach((room, index) => {
      const playerIndex = room.players.findIndex(
        (p) => p.userId === socket.userId
      );
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        io.to(room.id).emit("roomUpdated", room);
        if (room.players.length === 0) {
          rooms.splice(index, 1);
          io.emit("roomList", getJoinableRooms());
        }
      }
    });
  };

  const getJoinableRooms = () => rooms.filter((r) => !r.gameStarted);

  socket.on("getRooms", () => {
    socket.emit("roomList", getJoinableRooms());
  });

  socket.on("createRoom", (roomName: string) => {
    const newRoom: IRoom = {
      id: `${Date.now()}`,
      name: roomName,
      players: [],
      gameStarted: false,
    };
    rooms.push(newRoom);
    io.emit("roomCreated", newRoom);
  });

  socket.on("joinRoom", (roomId: string) => {
    const alreadyJoined = rooms.some((room) =>
      room.players.find((p) => p.userId === socket.userId)
    );
    if (alreadyJoined) {
      socket.emit("joinFailed", { reason: "You are already in another room." });
      return;
    }

    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.gameStarted) {
      socket.emit("joinFailed", { reason: "Room is unavailable." });
      return;
    }

    room.players.push({
      userId: socket.userId,
      username: socket.username,
      index: room.players.length,
    });
    socket.join(roomId);

    io.to(roomId).emit("roomUpdated", room);
    io.emit("roomList", getJoinableRooms());
  });

  socket.on("leaveRoom", ({ roomId }) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(
      (p) => p.userId === socket.userId
    );
    if (playerIndex !== -1) {
      room.players.splice(playerIndex, 1);
      socket.leave(roomId);

      if (room.players.length === 0) {
        const index = rooms.findIndex((r) => r.id === roomId);
        if (index !== -1) {
          rooms.splice(index, 1);
        }
      } else {
        io.to(roomId).emit("roomUpdated", room);
      }

      io.emit("roomList", getJoinableRooms());
    }
  });

  socket.on("startGame", (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room || room.gameStarted) return;

    room.gameStarted = true;
    io.to(roomId).emit("gameStarted");
    io.emit("roomList", getJoinableRooms());
  });

  socket.on("disconnect", () => {
    leaveAllRooms();
  });
}
