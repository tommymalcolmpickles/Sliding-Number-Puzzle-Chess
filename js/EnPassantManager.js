import { inBounds } from './Constants.js';

export default class EnPassantManager {
  constructor(game) {
    this.game = game;
    this.target = null; // { r, c } or null
  }

  getTarget() {
    return this.target;
  }


  clearTarget() {
    this.target = null;
  }


  // Check if en passant is possible at a given position
  canCaptureAt(to, color) {
    if (!this.target || this.game.board.isGapSquare(to.r, to.c)) {
      return false;
    }
    // Check if 'to' is the en passant target
    if (this.target.r !== to.r || this.target.c !== to.c) {
      return false;
    }
    // The validation that the capturing pawn is adjacent to the target
    // already happened during move generation. Here we just need to
    // confirm this is a valid en passant target.
    return true;
  }

  // Handle en passant capture by removing the captured pawn
  handleCapture(to, color) {
    if (!this.canCaptureAt(to, color)) {
      return null;
    }
    // The captured pawn is always in the direction opposite to the capturing pawn's movement
    // White pawns move up (decreasing row), so captured pawn is below (increasing row)
    // Black pawns move down (increasing row), so captured pawn is above (decreasing row)
    const dir = color === 'w' ? 1 : -1;
    const capR = to.r + dir;
    const capturedPiece = this.game.board.board[capR][to.c];
    this.game.board.board[capR][to.c] = null;
    return capturedPiece;
  }

  // Set target after double pawn move
  setAfterDoubleMove(from, to) {
    const midR = (from.r + to.r) >> 1; // integer midpoint
    this.target = { r: midR, c: to.c };
  }

  // Update target position after slide
  updateAfterSlide(sr, sc) {
    if (!this.target) return;
    this.target = this.game.board.updatePositionAfterSlide(this.target, sr, sc);
  }

  // Validate and clear target after turn
  validateAndClearAfterTurn() {
    if (!this.target) return;
    const opp = this.game.toMove === 'w' ? 'b' : 'w';
    const dir = opp === 'w' ? 1 : -1;
    const pawnR = this.target.r + dir;
    const hasPawn = [-1, 1].some(dc => {
      const pawnPos = { r: pawnR, c: this.target.c + dc };
      if (!inBounds(pawnPos.r, pawnPos.c)) return false;
      const p = this.game.board.pieceAt(pawnPos);
      return p && p.t === 'p' && p.c === opp;
    });
    if (!hasPawn) {
      this.clearTarget();
    }
  }

  // Snapshot for game state
  snapshot() {
    return { target: this.target ? { ...this.target } : null };
  }

  // Restore from snapshot
  restore(snap) {
    this.target = snap.target ? { ...snap.target } : null;
  }
}
