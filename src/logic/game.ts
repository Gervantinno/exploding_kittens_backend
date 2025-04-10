import { Server, Socket } from "socket.io";

export interface PlayerInfo {
  userId: string;
  username: string;
  index: number;
  hasLost?: boolean;
}

export interface GameState {
  roomId: string;
  players: PlayerInfo[];
  currentTurn: string;
  cardsToDraw: number;
  deck: string[];
  started: boolean;
  playerHands: Record<string, string[]>;
}

const games: Record<string, GameState> = {};

const deckTemplates = [
  "bomb",
  "bomb",
  "bomb",
  "defuse",
  "defuse",
  "attack",
  "attack",
  "skip",
  "skip",
  "shuffle",
  "shuffle",
  "see_the_future",
  "see_the_future",
  "favor",
  "favor",
  "taco_cat",
  "taco_cat",
  "taco_cat",
  "hairy_potato_cat",
  "hairy_potato_cat",
  "hairy_potato_cat",
];

const setNextTurn = (
  game: GameState,
  shouldIncrement: boolean = true
): void => {
  const currentIndex = game.players.findIndex(
    (p) => p.userId === game.currentTurn
  );

  let nextIndex = (currentIndex + 1) % game.players.length;

  if (game.players[nextIndex]?.hasLost) {
    do {
      nextIndex = (nextIndex + 1) % game.players.length;
    } while (game.players[nextIndex]?.hasLost);
  }

  game.currentTurn = game.players[nextIndex]?.userId || "";

  shouldIncrement && game.cardsToDraw++;
};

export function handleGame(
  io: Server,
  socket: Socket & { userId: string; username: string }
) {
  socket.on("joinRoom", (roomId: string) => {
    socket.join(roomId);
    let game = games[roomId];

    if (!game) {
      game = {
        roomId,
        players: [],
        currentTurn: "",
        cardsToDraw: 1,
        deck: [],
        started: false,
        playerHands: {},
      };
      games[roomId] = game;
    }

    const existing = game.players.find((p) => p.userId === socket.userId);
    if (!existing) {
      game.players.push({
        userId: socket.userId,
        username: socket.username,
        index: game.players.length,
      });
      if (!game.playerHands[socket.userId]) {
        game.playerHands[socket.userId] = ["defuse"];
      }
    }

    io.to(roomId).emit("gameState", game);
  });

  socket.on("leaveRoom", (roomId: string) => {
    let game = games[roomId];

    if (!game) return;

    const playerIndex = game.players.findIndex(
      (p) => p.userId === socket.userId
    );

    if (playerIndex !== -1) {
      game.players.splice(playerIndex, 1);
      socket.leave(roomId);
    }

    io.to(roomId).emit("gameState", game);
  });

  socket.on("startGame", (roomId: string) => {
    const game = games[roomId];
    if (!game || game.started) return;

    game.started = true;
    game.deck = [...deckTemplates].sort(() => Math.random() - 0.5);
    game.currentTurn = game.players[0]?.userId || "";

    game.players.forEach((p) => {
      if (!game.playerHands[p.userId]) {
        game.playerHands[p.userId] = ["defuse"];
      }
    });

    console.log("game after start", game);

    io.to(roomId).emit("gameState", game);
  });

  socket.on("drawCard", (roomId: string) => {
    const game = games[roomId];
    if (!game || !game.started || game.currentTurn !== socket.userId) return;

    const card = game.deck.pop() || "empty";
    let effectMessage = `${socket.username} drew a card.`;

    if (card === "bomb") {
      if (game.playerHands[socket.userId].includes("defuse")) {
        const defuseIndex = game.playerHands[socket.userId].indexOf("defuse");
        if (defuseIndex > -1) {
          game.playerHands[socket.userId].splice(defuseIndex, 1);
        }
        game.deck.push("bomb");
        game.deck = game.deck.sort(() => Math.random() - 0.5);
        effectMessage = `${socket.username} defused the bomb!`;
        game.cardsToDraw--;
      } else {
        game.players = game.players.map((p) =>
          p.userId === socket.userId ? { ...p, hasLost: true } : p
        );
        game.playerHands[socket.userId] = [];
        game.cardsToDraw = 0;
        effectMessage = `${socket.username} exploded and is out of the game!`;
      }
    } else {
      game.playerHands[socket.userId].push(card);
      game.cardsToDraw--;
    }

    if (game.cardsToDraw === 0) {
      setNextTurn(game);
    }

    io.to(roomId).emit("cardEffect", {
      player: socket.username,
      effect: effectMessage,
    });

    if (game.players.filter((p) => !p.hasLost).length === 1) {
      const winner = game.players.find((p) => !p.hasLost);
      io.to(roomId).emit("gameOver", { winner });
      game.started = false;
      return;
    }

    io.to(roomId).emit("gameState", game);
  });

  socket.on("playCard", ({ roomId, card }) => {
    const game = games[roomId];
    if (!game || !game.playerHands[socket.userId]?.includes(card)) return;

    const cardIndex = game.playerHands[socket.userId].indexOf(card);
    if (cardIndex > -1) {
      game.playerHands[socket.userId].splice(cardIndex, 1);
    }

    let effectMessage = `${socket.username} played ${card}`;

    if (card === "attack") {
      if (game.cardsToDraw !== 1) {
        game.cardsToDraw += 1;
      }
      setNextTurn(game);

      effectMessage = `${socket.username} used Attack!`;
    } else if (card === "skip") {
      game.cardsToDraw -= 1;
      if (game.cardsToDraw === 0) {
        setNextTurn(game);
      }
      effectMessage = `${socket.username} skipped the turn!`;
    } else if (card === "shuffle") {
      game.deck = game.deck.sort(() => Math.random() - 0.5);
      effectMessage = `${socket.username} shuffled the deck!`;
    } else if (card === "see_the_future") {
      const top3 = game.deck.slice(-3);
      socket.emit("seeFuture", top3);
      effectMessage = `${socket.username} saw the future!`;
    } else if (card === "favor") {
      io.to(roomId).emit("chooseFavorTarget", socket.userId);
      effectMessage = `${socket.username} played Favor and must choose a target!`;
    }

    io.to(roomId).emit("cardEffect", {
      player: socket.username,
      effect: effectMessage,
    });
    io.to(roomId).emit("gameState", game);
  });

  socket.on("chooseFavorTargetDone", ({ roomId, targetPlayerId }) => {
    const game = games[roomId];
    if (!game) return;

    io.to(roomId).emit("requestFavorCard", {
      fromUserId: targetPlayerId,
      toUserId: socket.userId,
    });

    io.to(roomId).emit("gameState", game);
  });

  socket.on("giveFavorCard", ({ roomId, fromPlayer, toPlayer, card }) => {
    const game = games[roomId];

    if (!game || !game.playerHands[fromPlayer]?.includes(card)) return;

    const cardIndex = game.playerHands[fromPlayer].indexOf(card);
    if (cardIndex > -1) {
      game.playerHands[fromPlayer].splice(cardIndex, 1);
    }
    game.playerHands[toPlayer].push(card);

    const giver =
      game.players.find((p) => p.userId === fromPlayer)?.username || fromPlayer;
    const receiver =
      game.players.find((p) => p.userId === toPlayer)?.username || toPlayer;

    io.to(roomId).emit("cardEffect", {
      player: giver,
      effect: `gave ${card} to ${receiver}`,
    });

    io.to(roomId).emit("gameState", game);
    io.to(roomId).emit("giveFavorCardDone", toPlayer);
  });

  socket.on("takeComboCard", ({ roomId, fromPlayer, card, comboCard }) => {
    const game = games[roomId];

    if (!game || !game.playerHands[fromPlayer]?.includes(card)) return;

    let removedCount = 0;
    game.playerHands[socket.userId] = game.playerHands[socket.userId].filter(
      (c) => {
        if (c === comboCard && removedCount < 2) {
          removedCount++;
          return false;
        }
        return true;
      }
    );

    const cardIndex = game.playerHands[fromPlayer].indexOf(card);
    if (cardIndex > -1) {
      game.playerHands[fromPlayer].splice(cardIndex, 1);
    }
    game.playerHands[socket.userId].push(card);

    const giver =
      game.players.find((p) => p.userId === fromPlayer)?.username || fromPlayer;
    const receiver = game.players.find(
      (p) => p.userId === socket.userId
    )?.username;

    io.to(roomId).emit("cardEffect", {
      player: giver,
      effect: `${receiver} took ${card} to from ${giver}`,
    });

    io.to(roomId).emit("gameState", game);
  });

  socket.on("restartGame", (roomId: string) => {
    const game = games[roomId];
    console.log("game before restart", game);
    if (!game) return;

    game.players = game.players.map((p) => ({ ...p, hasLost: false }));
    game.cardsToDraw = 1;
    game.started = true;
    game.deck = [...deckTemplates].sort(() => Math.random() - 0.5);
    game.currentTurn = game.players[0]?.userId || "";
    game.players.forEach((p) => {
      game.playerHands[p.userId] = ["defuse"];
    });

    console.log("game after restart", game);

    io.to(roomId).emit("gameState", game);
    io.to(roomId).emit("gameReseted");
  });
}
