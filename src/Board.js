import React, { Component } from 'react';
import HTML5Backend from 'react-dnd-html5-backend'
import { DragDropContext } from 'react-dnd'
import uniqueId from 'lodash/uniqueId'
import Square from './Square'
import DragChecker from './DragLayer.js'
import Chalkboard from './Chalkboard.js'
import './Board.css';

class Board extends Component {
  constructor (props) {
    super(props)
    //moves are tracked so that at 40 moves without advancement, a draw can be declared
    this.moveCount = 0;
    this.state = {
      checkers: {},
      curPlayer: 'red',
      mustJumpFrom: [],
      gameOver: false
    }
  }


  componentWillMount () {
    this.startNewGame();
  }

  startNewGame = () => {
    const initialCheckers = [];
    //create the white checkers
    for (let row = 0; row < 3; row++) {
      //place checkers in odd columns for even rows, even columns for odd rows
      const startCol = row%2 ? 0 : 1;
      for (let col = startCol; col <8; col += 2) {
        //create a unique key for each checker
        const key = uniqueId('checker_')
        //each checker is stored in checker state object using it's position as the key
        initialCheckers[`${row}${col}`] = {
          isKing: false,
          color: 'white',
          //white pieces can move down 1 space, or down two spaces when jumping
          moves: [1,2],
          position: `${row}${col}`,
          key: key}
      }
    }

    //create the red checkers
    for (let row = 5; row < 8; row++) {
      const startCol = row%2 ? 0 : 1;
      for (let col = startCol; col <8; col += 2) {
        const key = uniqueId('checker_')
        initialCheckers[`${row}${col}`] = {
          isKing: false,
          color: 'red',
          //red pieces can move up 1 space, or up two spaces when jumping
          moves: [-1,-2],
          position: `${row}${col}`,
          key: key}
      }
    }
    this.setState({checkers: initialCheckers,
                   //red always goes first
                   curPlayer: 'red',
                   mustJumpFrom: [],
                   gameOver: false})
  }

  componentDidUpdate() {
    //declared with let because it is sometimes reassigned
    let mustJumpFrom = this.state.mustJumpFrom.slice();

    //check for a double jump
    if (mustJumpFrom[0] === 'check for double jump') {
      this.checkForDoubleJump(mustJumpFrom[1])
      return;
      }

    //check if the new player can jump or if the new player lost
    if (!mustJumpFrom.length && !this.state.gameOver) {
      const winAndJumpsCheck = this.checkForWinAndJumps();
      const gameOver = winAndJumpsCheck[0];
      if (gameOver) {
        this.setState({
          gameOver: gameOver,
        })
        return;
      }
      //if the new player didn't lose update the locations the player can jump from
      mustJumpFrom = winAndJumpsCheck[1]
    }

    //only change state if the mustJumpFrom array changed to avoid infinite loop
    if (mustJumpFrom.join('') !== this.state.mustJumpFrom.join('')) {
      this.setState ({
        mustJumpFrom: mustJumpFrom
      });
    }
  }


  checkForDoubleJump(position) {
      //if it can jump again, assign location to mustJumpFrom array
      if (this.canJump(this.state.checkers[position])) {
        this.setState ({
          mustJumpFrom: [position]
        })
      }
      //otherwise clear the mustJumpFrom array and switch players
      else {
        const nextPlayer = this.state.curPlayer === 'red' ? 'white' : 'red';
        this.setState ({
          curPlayer: nextPlayer,
          mustJumpFrom: []
        })
      }
    }


    /*checking for win and checking for jumps are combined into one function for
    efficiency because they both loop through the checkers object*/
    checkForWinAndJumps() {
      /* A draw is declared if neither player has advanced toward the king row
      or captured a piece in 40 moves*/
      if (this.moveCount === 40) return ['draw']
      const mustJumpFrom = [];
      //collect keys to iterate through the checkers state object
      const positions = Object.keys(this.state.checkers);
      let gameOver = true;
      //list the new player's checkers
      const curCheckers = positions.filter(pos => this.state.checkers[pos].color === this.state.curPlayer)
      //if the new player is out of checkers, the game is over
      if (!curCheckers.length) return [true]
      curCheckers.forEach(pos => {
        const checker = this.state.checkers[pos];
          if(this.canMove(checker)) {
            //if the player has at least one checker that can move, the game is not over
            gameOver = false;
            //add all the checkers that can jump to the mustJumpFrom array
            if(this.canJump(checker)) mustJumpFrom.push(pos)
          }
      })
      return [gameOver, mustJumpFrom];
    }

  renderSquares () {
    const arrRows = [];
    for(let row =0; row< 8; row ++) {
      const arrSquares = [];
      for (let col=0; col< 8; col++) {
        //unique keys for squares are based on location since squares can't move
        const key = `square-${row}${col}`
        const position = `${row}${col}`
        const squareColor = (col+row)%2 === 0 ? 'cream' : 'green'
        const thisChecker = this.state.checkers[`${row}${col}`]
        const myTurn = thisChecker && thisChecker.color === this.state.curPlayer
        //checkers can move only if it is the turn of the player they belong too
        const canMove = myTurn && this.canMove(thisChecker)
        arrSquares.push(
          <Square
          //No checkers can move when the game is over
          canMove = {!this.state.gameOver && canMove}
          //used to check if the square can be used as a drop target
          legalMove = {this.legalMove}
          moveChecker = {this.moveChecker}
          hasChecker = {thisChecker}
          color = {squareColor}
          key = {key}
          position = {position}/>
        )
      }
      arrRows.push(arrSquares)
    }
    return arrRows;
  }

  canMove (checker) {
    const mustJumpFrom = this.state.mustJumpFrom
    //if the current player must jump, and the selected checker can't jump, it can't move
    if(mustJumpFrom.length && mustJumpFrom.indexOf(checker.position) === -1) return false;
    return this.checkMoves(checker, checker.moves)
  }

  canJump (checker) {
     const jumpMoves = checker.moves.filter(move => Math.abs(move) === 2);
     return this.checkMoves(checker, jumpMoves)
  }

  checkMoves (checker, moves) {
    const origin = checker.position
    const row = Number(origin.charAt(0));
    const col = Number(origin.charAt(1));
    let ableToMove = false;
    moves.forEach(move => {
      //add the move to the row and add or subtract from column
      const destination1 = `${row + move}${col + move}`
      const destination2 = `${row + move}${col - move}`
      if (origin === '56') {
      }
      if(this.legalMove(origin, destination1) || (this.legalMove(origin,destination2))) {
        ableToMove = true;
      }
    })
    return ableToMove
  }

  legalMove = (origin, destination) => {
    if (this.state.checkers[destination] || !this.state.checkers[origin]) return false;
    const [destRow,destCol] = destination.split('');
    //check to make sure the destination is an actual square, if not, move is not legal
    if (Number(destRow) < 0 || Number(destRow) > 7 || Number(destCol) < 0 || Number(destCol)>7) return false;
    const [originRow, originCol] = origin.split('');
    const availMoves = this.state.checkers[origin].moves;
    const rowDiff = Number(destRow) - Number(originRow);
    const colDiff = Number(destCol) - Number(originCol);
    const mustJumpFrom = this.state.mustJumpFrom;
      //if the current player must jump, and the selected checker can't jump, it can't move
    if(mustJumpFrom.length && (mustJumpFrom.indexOf(origin) === -1 || Math.abs(colDiff) === 1)) return false;
    /*check if the piece is moving the correct spaces in the correct direction
    and is moving the same number of spaces left or right as up or down,
    then if moving more two spaces, make sure it can jump*/
    if (availMoves.indexOf(rowDiff) > -1 && Math.abs(rowDiff) === Math.abs(colDiff)) {
      return Math.abs(colDiff) === 1 || (Math.abs(colDiff) === 2 && this.legalJump(origin,destination))
    }
    return false;
  }

  getMiddleSquare (origin, destination) {
    const [originRow, originCol] = origin.split('');
    const [destRow,destCol] = destination.split('');
    const middleRow = (Number(originRow) + Number(destRow))/2;
    const middleCol = (Number(originCol) + Number(destCol))/2
    return `${middleRow}${middleCol}`
  }

  //checks if there is an opposing piece in the middl of the origin and destination
  legalJump (origin, destination) {
    const middleSquare = this.getMiddleSquare(origin, destination);
    const middlePiece = this.state.checkers[middleSquare]
    const middlePlayer = middlePiece ? middlePiece.color : false;
    return middlePlayer && middlePlayer !== this.state.checkers[origin].color
  }

  moveChecker = (origin, destination) => {
    this.moveCount ++;
    const newCheckers = Object.assign(this.state.checkers);
    const originRow = Number(origin[0]);
    const destRow = Number(destination[0]);
    const rowDiff = destRow - originRow;
    //add the checker to the new square and remove it from the starting square
    newCheckers[destination] = newCheckers[origin];
    newCheckers[destination].position = destination;
    delete newCheckers[origin];
    //reset the move count if the player advances a non-king piece
    if(Math.abs(rowDiff) === 1 && !newCheckers[destination].isKing) this.movecount = 0

    //rules for jumping
    let mustJumpFrom = [];
    if (Math.abs(rowDiff) === 2) {
      //reset the move count if a player captures an opponents piece
      this.moveCount = 0;
      const middleSquare = this.getMiddleSquare(origin,destination);
      //remove the captured piece
      delete newCheckers[middleSquare];
      //if it can jump again, mustJumpFrom state must change to an array
      mustJumpFrom = ['check for double jump', destination];
    }

    const lastRow = this.state.curPlayer === 'red' ? 0: 7;
    //if a non-king piece makes it to the last row, change it to a king
    if (destRow === lastRow && newCheckers[destination].isKing === false) {
      newCheckers[destination] = this.kingMe(newCheckers[destination]);
      //A piece cannot make another immediately after becoming a king
      mustJumpFrom = [];
    }
    const nextPlayer = this.state.curPlayer === 'red' ? 'white' : 'red';
    /*If the player just jumped, don't switch players before checking if a
    double jump is possible.*/
    const newPlayer = mustJumpFrom.length ? this.state.curPlayer : nextPlayer;
    this.setState ({
      checkers: newCheckers,
      curPlayer: newPlayer,
      mustJumpFrom: mustJumpFrom
    })
  }

  kingMe (checker) {
    checker.isKing = true;
    //allow the checker to move in the opposite direction
    checker.moves.forEach(move=> checker.moves.push(move*-1))
    return checker
  }

  getChalkboardMessage () {
    const curPlayer = this.state.curPlayer.charAt(0).toUpperCase() + this.state.curPlayer.slice(1);
    const turnMessage = this.state.mustJumpFrom.length ? `${curPlayer} must jump.` : `${curPlayer}'s turn`;
    const otherPlayer = this.state.curPlayer === 'red' ? 'White' : 'Red';
    const gameOverMessage = this.state.gameOver === 'draw' ? 'Draw!' :`${otherPlayer} wins!`;
    return this.state.gameOver ? gameOverMessage : turnMessage;
  }

  getChalkboardColor () {
    if (this.state.gameOver === 'draw') return '#005'
    const curPlayer = this.state.curPlayer
    const otherPlayer = this.state.curPlayer === 'red' ? 'white' : 'red'
    const player = this.state.gameOver ? otherPlayer : curPlayer;
    return player === 'red' ? '#900' : 'white';
  }

  render() {

    return (
      <div id='container'>
      {this.state.gameOver && <p className ='playAgain' onClick = {this.startNewGame}>Play Again</p>}
      <div className = {this.state.gameOver ? 'board filtered' : 'board'}>
      {this.renderSquares()}
      <DragChecker />
      </div>
      <Chalkboard
        message = {this.getChalkboardMessage()}
        color = {this.getChalkboardColor()}/>
      </div>
    );
  }
}

export default DragDropContext(HTML5Backend)(Board)
