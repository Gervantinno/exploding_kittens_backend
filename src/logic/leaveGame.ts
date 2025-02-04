import { games } from ".";
import { IPlayer } from "./baseTypes";
import { updateGame } from "./updateGames";

export interface leaveGameProps {
  gameId: string;
  player: IPlayer;
  socket: any;
}

// Подключение к игре
export const leaveGame = ({ gameId, player, socket }: leaveGameProps) => {
  if (!player) return;

  if (!games[gameId]) return;

  const game = games[gameId];

  game.players.filter((play) => play.id !== player.id);

  updateGame({ gameId, socket });

  console.log(`${player.name} leaved the game`);
};
