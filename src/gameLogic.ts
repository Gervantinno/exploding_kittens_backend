/*
Attack card - End your turn(s) without drawing and force the next player to take two turns in a row.
Cat card - These can be collected as two or three of a kind and used to steal from other players. (tacocat, catermellon, hairy potato cat, bearded cat)
Defuse card - If you drew an Exploding Kitten, you can play this card instead of exploding.
Exploding Kitten card - Unless you have a Defuse card, you explode and are out of the game.
Favor card - Force any other player to give you 1 card from their hand. They choose which card to give you.
Nope card - Stops any action except for an Exploding Kitten card or a Defuse card.
See the Future card - Peek at the top 3 cards from the Draw Pile and put them back in the same order.
Shuffle card - Shuffle the Draw Pile without viewing the cards until told to stop.
Skip card - Immediately end your turn without drawing a card.
*/

interface ICard {
  id: string;
  name:
    | "attack"
    | "tacocat"
    | "catermellon"
    | "potato cat"
    | "bearded cat"
    | "defuse"
    | "explode"
    | "favor"
    | "nope"
    | "future"
    | "shuffle"
    | "skip";
}

interface IPlayer {
  id: string;
  name: string;
  cards: ICard[];
}

interface IGameState {
  players: IPlayer[];
  deck: ICard[];
  currentPlayer: string;
}

const games: { [gameId: string]: IGameState } = {};

const createNewGame = (): IGameState => ({
  players: [],
  deck: [],
  currentPlayer: "",
});

export interface joinGameProps {
  gameId: string;
  newPlayer: IPlayer;
}

// Подключение к игре
export const joinGame = ({ gameId, newPlayer }: joinGameProps) => {
  if (!games[gameId]) {
    // Нужно создать игру сначала
    games[gameId] = createNewGame();
  }

  const game = games[gameId];

  game.players = [...game.players, newPlayer];

  console.log(`${newPlayer.name} joined the game`);
};

export interface playCardProps {
  gameId: string;
  player: IPlayer;
  card: ICard;
}

export const playCard = ({ gameId, player, card }: playCardProps) => {
  if (!games[gameId]) return;

  const game = games[gameId];

  // Проверяем что его ход
  if (game.turnStack[0] !== player.id) return;

  // Играем карту (применяем эффект, перемещаем ее в сброс)

  switch (card.name) {
    case "attack": {
      break;
    }
    case "favor": {
      break;
    }
    case "future": {
      break;
    }
    case "nope": {
      break;
    }
    case "shuffle": {
      break;
    }
    case "skip": {
      break;
    }
  }

  console.log(`${player.name} played: ${card.name}`);
  //   socket.broadcast.emit("card-played", data);
};
