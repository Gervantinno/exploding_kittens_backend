import { createNewGame, games } from ".";
import { IPlayer } from "./baseTypes";
import { updateGame } from "./updateGames";

export interface joinGameProps {
  gameId: string;
  newPlayer: IPlayer;
  socket: any;
}

// Подключение к игре
export const joinGame = ({ gameId, newPlayer, socket }: joinGameProps) => {
  if (!newPlayer) return;

  if (!games[gameId]) {
    // Нужно создать игру сначала
    games[gameId] = createNewGame();
  }

  const game = games[gameId];

  game.players.push(newPlayer);

  updateGame({ gameId, socket });

  console.log(`${newPlayer.name} joined the game`);
};
