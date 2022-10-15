import TicTacToe from "./games/TicTacToe.js";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: [
      "https://main--bright-biscuit-b1c8e4.netlify.app/",
      "http://localhost:3000/",
    ],
    credentials: true,
  })
);

const server = http.createServer(app);
let connectedPlayers = 0;

function isIn2DArray(value, array) {
  for (let i = 0; i < array.length; i++) {
    for (let j = 0; j < array.length; j++) {
      if (array[i][j] === value) {
        return true;
      }
    }
  }
}

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

let queue = null;
const ticTacToeGames = new Map();

io.on("connection", (socket) => {
  connectedPlayers = connectedPlayers + 1;
  io.emit("connected_player", connectedPlayers);
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", () => {
    if (queue === null || socket.id !== queue.player1) {
      if (ticTacToeGames.get(socket.id) !== undefined) {
        const ticTacToe = ticTacToeGames.get(socket.id);
        socket.leave(ticTacToe.roomID);
        io.in(ticTacToe.roomID).emit("game_over", "dc");
        ticTacToeGames.delete(ticTacToe.player1);
        ticTacToeGames.delete(ticTacToe.player2);
      }
      if (queue !== null) {
        queue.setPlayer2(socket.id);
        ticTacToeGames.set(socket.id, queue);
        socket.join(queue.roomID);
        io.in(queue.roomID).emit("match_found");
        io.in(queue.roomID).emit("your_turn", socket.id);
        queue = null;
      } else {
        queue = new TicTacToe(socket.id);
        ticTacToeGames.set(socket.id, queue);
        socket.join(queue.roomID);
      }
    }
  });

  socket.on("send_message", (data) => {
    const move = data.move;
    const ticTacToe = ticTacToeGames.get(socket.id);
    if (ticTacToe === undefined || ticTacToe.player2 === null) {
      return;
    }

    const isGameOver = ticTacToe.tryMove(move, socket.id);
    const gameboard = ticTacToe.getGameboard();

    if (ticTacToe.getSuccessfulMove()) {
      io.in(ticTacToe.roomID).emit("receive_message", gameboard);
      if (socket.id === ticTacToe.player1) {
        io.in(ticTacToe.roomID).emit("your_turn", ticTacToe.player2);
      } else if (socket.id === ticTacToe.player2) {
        io.in(ticTacToe.roomID).emit("your_turn", ticTacToe.player1);
      }
    }

    if (isGameOver) {
      io.in(ticTacToe.roomID).emit("game_over", socket.id);
      ticTacToeGames.delete(ticTacToe.player1);
      ticTacToeGames.delete(ticTacToe.player2);
    } else if (!isIn2DArray("", gameboard)) {
      io.in(ticTacToe.roomID).emit("game_over", "draw");
      ticTacToeGames.delete(ticTacToe.player1);
      ticTacToeGames.delete(ticTacToe.player2);
    }
  });

  socket.on("disconnect", () => {
    connectedPlayers = connectedPlayers - 1;
    io.emit("connected_player", connectedPlayers);
    if (queue !== null && queue.player1 === socket.id) {
      queue = null;
    }
    if (ticTacToeGames.get(socket.id) !== undefined) {
      const ticTacToe = ticTacToeGames.get(socket.id);
      io.in(ticTacToe.roomID).emit("game_over", "dc");
      ticTacToeGames.delete(ticTacToe.player1);
      ticTacToeGames.delete(ticTacToe.player2);
    }
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("SERVER IS RUNNING");
});
