export interface ICard {
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

export interface IPlayer {
  id: string;
  name: string;
  cards: ICard[];
}

export interface IGameState {
  players: IPlayer[];
  deck: ICard[];
  currentPlayer: string;
}
