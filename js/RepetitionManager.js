import { inBounds, FILES, RANKS } from './Constants.js';

export default class RepetitionManager {
  constructor(game) {
    this.game = game;
    this.repetitionCounts = new Map(); // Combined position + section state
  }

  bumpRepetitionCounts() {
    const combinedKey = this.combinedGameStateKey();
    this.repetitionCounts.set(combinedKey, (this.repetitionCounts.get(combinedKey) || 0) + 1);
  }

  combinedGameStateKey() {
    // Combine position key and section key into a single unique identifier
    const positionKey = this.positionKey();
    const sectionKey = this.sectionKey();
    return positionKey + '|' + sectionKey;
  }

  positionKey() {
    let rows = [];
    for (let r = 0; r < 8; r++) {
      let row = '';
      let empty = 0;
      for (let c = 0; c < 8; c++) {
        const p = this.game.board.pieceAt({ r, c });
        if (p) {
          if (empty) { row += empty; empty = 0; }
          const ch = p.t === 'p' ? 'p' : p.t;
          row += p.c === 'w' ? ch.toUpperCase() : ch;
        } else { empty++; }
      }
      if (empty) row += empty;
      rows.push(row);
    }
    const side = this.game.toMove;
    const rights = [['w', 3], ['w', -4], ['b', 3], ['b', -4]].map(([col, offset]) => {
      const k = this.game.board.findKing(col);
      if (!k) return '-';
      const kPiece = this.game.board.pieceAt(k);
      if (kPiece.moved) return '-';
      const rookCol = k.c + offset;
      if (!inBounds(k.r, rookCol)) return '-';
      const rook = this.game.board.pieceAt({ r: k.r, c: rookCol });
      if (!rook || rook.t !== 'r' || rook.c !== col || rook.moved) return '-';
      return '1';
    }).join('');
    const ep = this.game.moveGenerator.enPassantTarget();
    return rows.join('/') + ' ' + side + ' ' + rights + ' ' + (ep ? FILES[ep.c] + RANKS[ep.r] : '-');
  }

  sectionKey() {
    const arr = [];
    // Include section IDs
    for (let sr = 0; sr < 4; sr++) for (let sc = 0; sc < 4; sc++) arr.push(this.game.board.sectionIdAt[sr][sc]);
    // Include gap position (critical for slide chess repetition detection)
    arr.push(`gap_${this.game.board.gap.sr}_${this.game.board.gap.sc}`);
    return arr.join(',');
  }

  canClaimDraw() {
    for (const v of this.repetitionCounts.values()) if (v >= 3) return true;
    return false;
  }

  snapshot() {
    return {
      repetitionCounts: new Map(this.repetitionCounts),
    };
  }

  clear() {
    this.repetitionCounts = new Map();
  }

  restore(snap) {
    if (!snap) {
      this.repetitionCounts = new Map();
      return;
    }
    this.repetitionCounts = new Map(snap.repetitionCounts || []);
  }
}
