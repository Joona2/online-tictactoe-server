import TicTacToe from "./games/TicTacToe.js";
import http from "http";
import { Server } from "socket.io";
import express from "express";
import cors from "cors";

const app = express();
const port = 6942;
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

app.use(
  cors({
    origin: ["http://localhost:3000/", "https://web.postman.co/"],
    credentials: true,
  })
);
app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://main--bright-biscuit-b1c8e4.netlify.app/",
    ],
    methods: ["GET", "POST"],
    credentials: true,
    transports: ["websocket"],
  },
});

let queue = null;
const ticTacToeGames = new Map();
const ticTacToeGameBoards = new Set();

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
        ticTacToeGameBoards.delete(ticTacToe);
        console.log(ticTacToe);
        ticTacToeGames.delete(ticTacToe.player1);
        ticTacToeGames.delete(ticTacToe.player2);
      }
      if (queue !== null) {
        queue.setPlayer2(socket.id);
        ticTacToeGames.set(socket.id, queue);
        ticTacToeGameBoards.add(queue);
        socket.join(queue.roomID);
        io.in(queue.roomID).emit("match_found");
        io.in(queue.roomID).emit("your_turn", socket.id);
        queue = null;
      } else {
        queue = new TicTacToe(socket.id);
        ticTacToeGames.set(socket.id, queue);
        ticTacToeGameBoards.add(queue);
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
      ticTacToeGameBoards.delete(ticTacToe);
      ticTacToeGames.delete(ticTacToe.player1);
      ticTacToeGames.delete(ticTacToe.player2);
    } else if (!isIn2DArray("", gameboard)) {
      io.in(ticTacToe.roomID).emit("game_over", "draw");
      ticTacToeGameBoards.delete(ticTacToe);
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
      ticTacToeGameBoards.delete(ticTacToe);
      ticTacToeGames.delete(ticTacToe.player1);
      ticTacToeGames.delete(ticTacToe.player2);
    }
  });
});

server.listen(process.env.PORT || 3001, () => {
  console.log("SERVER IS RUNNING");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

app.get("/all-games", async (req, res) => {
  console.log("gay shit");
  const array = [...ticTacToeGameBoards];
  res.send(
    array.map((x) => {
      return { players: x.numberOfPlayers, game_id: x.roomID };
    })
  );
});
