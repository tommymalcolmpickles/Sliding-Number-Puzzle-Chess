import { GLYPH, opponent, sqName, secIndex } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class Notation {
  constructor(game, elements) {
    if (!game) throw new Error('Notation constructor: game is undefined');
    this.game = game;
    this.elements = elements;
    this.moves = []; // Array of move objects: { white: move, black: move, number: n }
    this.plainMoves = []; // For copying - plain text format
    this.resultAppended = false;
    this.currentMoveNumber = 1; // Track current move number
    this.isWhiteToMove = true; // Track whose turn it is
  }


  reset() {
    // Clear all notation state
    this.moves = [];
    this.plainMoves = [];
    this.currentMoveNumber = 1;
    this.isWhiteToMove = true;
    this.resultAppended = false;

    // Force clear the table and text content
    this.elements.movesTableBody.innerHTML = '';
    this.elements.movesText.textContent = '';

    // Render empty state
    this.renderMoves();
  }

  appendResultIfNeeded() {
    if (this.resultAppended) return;

    // Don't append result if the game is being reset (moves array is empty but resultAppended is false)
    if (this.moves.length === 0 && !this.game.winner && !this.game.draw) return;

    const result = this.game.winner === 'w' ? STRINGS.RESULT_WHITE_WINS :
                   this.game.winner === 'b' ? STRINGS.RESULT_BLACK_WINS :
                   this.game.draw ? STRINGS.RESULT_DRAW : null;

    if (result) {
      this.moves.push(result);
      this.plainMoves.push(result);
    }

    this.resultAppended = !!this.game.winner || this.game.draw;
    this.renderMoves();
  }

  appendMove(preMoveBoardSnap) {
    if (!this.game) {
      return;
    }

    const move = this.moveToSAN(preMoveBoardSnap);
    if (move) {
      this.addMoveToNotation(move);
      this.renderMoves();
    }
  }

  addMoveToNotation(move) {
    if (this.isWhiteToMove) {
      // White's move - create new move pair
      this.moves.push({ number: this.currentMoveNumber, white: move, black: null });
      this.plainMoves.push(`${this.currentMoveNumber}.${move}`);
      this.isWhiteToMove = false;
    } else {
      // Black's move - update last move pair
      const lastMove = this.moves[this.moves.length - 1];
      lastMove.black = move;
      this.plainMoves[this.plainMoves.length - 1] = `${this.currentMoveNumber}.${lastMove.white} ${move}`;
      this.isWhiteToMove = true;
      this.currentMoveNumber++;
    }
  }

  appendSlide(slide, originalGap) {
    if (!this.game) {
      return;
    }

    if (slide) {
      // Calculate direction from section to original gap position (where section moves)
      const dr = originalGap.sr - slide.sr;
      const dc = originalGap.sc - slide.sc;

      let arrow = '';
      if (dr > 0) arrow = '↓';      // section moves down to fill gap
      else if (dr < 0) arrow = '↑'; // section moves up to fill gap
      else if (dc > 0) arrow = '→'; // section moves right to fill gap
      else if (dc < 0) arrow = '←'; // section moves left to fill gap

      const sectionNum = secIndex(slide.sr, slide.sc);
      let slideNot = `[${sectionNum}]${arrow}`;

      // Add check/checkmate suffixes if applicable
      if (this.game.moveGenerator.isKingInCheck(opponent(this.game.toMove))) {
        slideNot += this.game.moveGenerator.hasAnyLegalMove(opponent(this.game.toMove)) ? STRINGS.NOTATION_CHECK : STRINGS.NOTATION_CHECKMATE;
      }

      // Add slide as a separate entry
      this.addMoveToNotation(slideNot);
      this.renderMoves();
    }
  }

  moveToSAN(preMoveBoardSnap) {
    if (!this.game) {
      return '';
    }
    const snap = this.game.snapshot();
    if (!snap || !this.game.lastMove) return '';
    const origPhase = this.game.phase;
    this.game.phase = 'move';
    const p = this.game.board.pieceAt(this.game.lastMove.to);
    if (!p) {
      this.game.phase = origPhase;
      this.game.restore(snap);
      return '';
    }
    let move = '';
    if (p.t === 'k' && (Math.abs(this.game.lastMove.to.c - this.game.lastMove.from.c) > 1 || Math.abs(this.game.lastMove.to.r - this.game.lastMove.from.r) > 1)) {
      // Castling - determine if short (4 squares) or long (5 squares) based on distance
      const from = this.game.lastMove.from;
      const to = this.game.lastMove.to;

      // Calculate the total span between king and rook
      let totalSquares = 0;
      if (Math.abs(to.c - from.c) > 1) {
        // Horizontal castling
        const dir = (to.c > from.c) ? 1 : -1;
        const rookCol = from.c + dir * 3; // Short castling: rook 3 squares away
        if (this.game.board.pieceAt({ r: from.r, c: rookCol })?.t === 'r') {
          totalSquares = 4; // King + 2 empty + rook
        } else {
          const rookColLong = from.c + dir * 4; // Long castling: rook 4 squares away
          if (this.game.board.pieceAt({ r: from.r, c: rookColLong })?.t === 'r') {
            totalSquares = 5; // King + 3 empty + rook
          }
        }
      } else if (Math.abs(to.r - from.r) > 1) {
        // Vertical castling
        const dir = (to.r > from.r) ? 1 : -1;
        const rookRow = from.r + dir * 3; // Short castling: rook 3 squares away
        if (this.game.board.pieceAt({ r: rookRow, c: from.c })?.t === 'r') {
          totalSquares = 4; // King + 2 empty + rook
        } else {
          const rookRowLong = from.r + dir * 4; // Long castling: rook 4 squares away
          if (this.game.board.pieceAt({ r: rookRowLong, c: from.c })?.t === 'r') {
            totalSquares = 5; // King + 3 empty + rook
          }
        }
      }

      // Short castling (4 total squares) = O-O
      // Long castling (5 total squares) = O-O-O
      move = (totalSquares === 4) ? STRINGS.NOTATION_CASTLE_KINGSIDE : STRINGS.NOTATION_CASTLE_QUEENSIDE;
    } else {
      // Short notation logic
      let disambiguator = '';
      const legal = this.game.moveGenerator.legalMoves(this.game.lastMove.from);
      const sameType = [];
      // Use pre-move board snapshot to check for captures
      this.game.board.restore(preMoveBoardSnap);
      const isCapture = this.game.board.pieceAt(this.game.lastMove.to) || (p.t === 'p' && this.game.lastMove.to.c !== this.game.lastMove.from.c);
      // Restore current board state
      this.game.board.restore(snap.board);
      for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
        const q = this.game.board.pieceAt({ r, c });
        if (!q || q === p || q.t !== p.t || q.c !== p.c) continue;
        if (this.game.moveGenerator.legalMoves({ r, c }).some(m => m.r === this.game.lastMove.to.r && m.c === this.game.lastMove.to.c)) {
          sameType.push({ r, c });
        }
      }
      if (sameType.length) {
        const sameFile = sameType.some(q => q.c === this.game.lastMove.from.c);
        const sameRank = sameType.some(q => q.r === this.game.lastMove.from.r);
        if (sameFile && sameRank) disambiguator = sqName(this.game.lastMove.from.r, this.game.lastMove.from.c);
        else if (sameFile) disambiguator = String(8 - this.game.lastMove.from.r);
        else disambiguator = String.fromCharCode(97 + this.game.lastMove.from.c);
      }
      if (isCapture && p.t === 'p') {
        move += String.fromCharCode(97 + this.game.lastMove.from.c) + STRINGS.NOTATION_CAPTURE;
      } else if (isCapture && p.t !== 'p') {
        move += disambiguator + STRINGS.NOTATION_CAPTURE;
        disambiguator = '';
      } else {
        move += disambiguator;
      }
      move += sqName(this.game.lastMove.to.r, this.game.lastMove.to.c);
      if (this.game.needPromos.length) move += STRINGS.NOTATION_PROMOTION + this.game.board.pieceAt(this.game.lastMove.to).t.toUpperCase();
    }
    this.game.restore(snap);
    if (this.game.moveGenerator.isKingInCheck(opponent(this.game.toMove))) {
      move += this.game.moveGenerator.hasAnyLegalMove(opponent(this.game.toMove)) ? STRINGS.NOTATION_CHECK : STRINGS.NOTATION_CHECKMATE;
    }
    this.game.phase = origPhase;
    return move;
  }

  renderMoves() {
    // Clear existing table content
    this.elements.movesTableBody.innerHTML = '';

    // If no moves, just update plain text and return
    if (this.moves.length === 0) {
      this.elements.movesText.textContent = '';
      return;
    }

    // Render moves in table format
    for (let i = 0; i < this.moves.length; i++) {
      const move = this.moves[i];

      if (typeof move === 'string') {
        // Game result (1-0, 0-1, ½-½)
        const row = this.elements.movesTableBody.insertRow();
        const numberCell = row.insertCell();
        const whiteCell = row.insertCell();
        const blackCell = row.insertCell();

        numberCell.textContent = '';
        whiteCell.textContent = move;
        blackCell.textContent = '';
        blackCell.className = 'empty-cell';
        break; // Don't render any moves after the result
      } else {
        // Regular move pair
        const row = this.elements.movesTableBody.insertRow();
        const numberCell = row.insertCell();
        const whiteCell = row.insertCell();
        const blackCell = row.insertCell();

        numberCell.textContent = move.number;
        whiteCell.textContent = move.white || '';
        blackCell.textContent = move.black || '';

        if (!move.black) {
          blackCell.className = 'empty-cell';
        }
      }
    }

    // Update plain text for copying
    this.elements.movesText.textContent = this.plainMoves.join(' ');
  }

  copyLogToClipboard() {
    const text = this.plainMoves.join(' ');
    navigator.clipboard.writeText(text);
  }

  snapshot() {
    return {
      moves: [...this.moves],
      plainMoves: [...this.plainMoves],
      resultAppended: this.resultAppended,
      currentMoveNumber: this.currentMoveNumber,
      isWhiteToMove: this.isWhiteToMove
    };
  }

  restore(snap) {
    this.moves = [...snap.moves];
    this.plainMoves = [...(snap.plainMoves || [])];
    this.resultAppended = snap.resultAppended;
    this.currentMoveNumber = snap.currentMoveNumber || 1;
    this.isWhiteToMove = snap.isWhiteToMove !== false; // Default to true if not specified

    this.renderMoves();
  }
}