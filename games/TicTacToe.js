class TicTacToe {
  constructor(player1) {
    this.gameboard = [
      ["", "", ""],
      ["", "", ""],
      ["", "", ""],
    ];
    this.player1 = player1;
    this.isPlayer1 = true;
    this.player1Move = "X";
    this.player2Move = "O";
    this.player2 = null;
    this.roomID = Math.floor(Math.random() * 1000000000000000);
    this.successfulMove = false;
  }

  setPlayer2(player2) {
    this.player2 = player2;
  }

  tryMove(move, playerID) {
    const row = move.row;
    const col = move.col;
    if (this.gameboard[row][col] === "" && this.player2 !== null) {
      this.successfulMove = true;
      if (playerID === this.player1 && this.isplayer1) {
        return this.handleMove(row, col, this.player1Move);
      } else if (playerID === this.player2 && !this.isplayer1) {
        return this.handleMove(row, col, this.player2Move);
      }
    } else {
      this.successfulMove = false;
    }
  }

  handleMove(row, col, symbol) {
    this.gameboard[row][col] = symbol;
    this.isplayer1 = !this.isplayer1;
    return this.find3InARow();
  }

  getSuccessfulMove() {
    return this.successfulMove;
  }

  getGameboard() {
    return this.gameboard;
  }

  find3InARow() {
    for (let i = 0; i < 3; i++) {
      if (
        this.gameboard[i][0] === this.gameboard[i][1] &&
        this.gameboard[i][0] === this.gameboard[i][2] &&
        this.gameboard[i][0] !== ""
      ) {
        return true;
      } else if (
        this.gameboard[0][i] === this.gameboard[1][i] &&
        this.gameboard[0][i] === this.gameboard[2][i] &&
        this.gameboard[0][i] !== ""
      ) {
        return true;
      }
    }
    if (this.gameboard[1][1] === "") {
      return false;
    }
    if (
      this.gameboard[0][0] === this.gameboard[1][1] &&
      this.gameboard[0][0] === this.gameboard[2][2]
    ) {
      return true;
    } else if (
      this.gameboard[0][2] === this.gameboard[1][1] &&
      this.gameboard[0][2] == this.gameboard[2][0]
    ) {
      return true;
    }
    return false;
  }
}

export default TicTacToe;
