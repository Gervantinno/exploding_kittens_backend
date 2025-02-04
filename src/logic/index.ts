import { IGameState } from "./baseTypes";

export const games: { [gameId: string]: IGameState } = {};

export const createNewGame = (): IGameState => ({
  players: [],
  deck: [],
  currentPlayer: "",
});
