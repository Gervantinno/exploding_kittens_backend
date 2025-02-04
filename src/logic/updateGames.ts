import { games } from ".";

export interface updateGameProps {
  gameId: string;
  socket: any;
}

export const updateGame = ({ gameId, socket }: updateGameProps) => {
  if (!games[gameId]) return {};

  socket.emit("update-game", games[gameId]);
};
