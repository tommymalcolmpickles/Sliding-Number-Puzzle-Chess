import { N, SECTION, clone, squareToSection, secIndex, inBounds } from './Constants.js';

export default class Board {
  constructor() {
    this.board = this.initialBoard();
    this.sectionIdAt = this.initialSections();
    this.gap = { sr: 2, sc: 2 }; // Start gap at section 11 (third row, third column)
  }

  initialBoard() {
    const b = Array.from({ length: N }, () => Array(N).fill(null));
    const place = (r, c, t, col) => { b[r][c] = { t, c: col, moved: false }; };
    'rnbqkbnr'.split('').forEach((t, i) => place(0, i, t, 'b'));
    for (let i = 0; i < N; i++) place(1, i, 'p', 'b');
    'rnbqkbnr'.split('').forEach((t, i) => place(7, i, t, 'w'));
    for (let i = 0; i < N; i++) place(6, i, 'p', 'w');
    return b;
  }

  initialSections() {
    const grid = Array.from({ length: 4 }, (_, sr) => Array.from({ length: 4 }, (_, sc) => secIndex(sr, sc)));
    grid[2][2] = 0; // Gap section is at sr=2, sc=2 (section 11)
    return grid;
  }

  pieceAt(pos) { return this.board[pos.r]?.[pos.c] || null; }

  isGapSquare(r, c) {
    const { sr, sc } = squareToSection(r, c);
    return sr === this.gap.sr && sc === this.gap.sc;
  }

  isGapBetween(r1, c1, r2, c2) {
    const dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
    let r = r1 + dr, c = c1 + dc;
    while (r !== r2 || c !== c2) {
      if (this.isGapSquare(r, c)) return true;
      r += dr;
      c += dc;
    }
    return false;
  }

  movePiece(from, to) {
    const p = this.board[from.r][from.c];
    this.board[to.r][to.c] = { ...p, moved: true };
    this.board[from.r][from.c] = null;
  }

  slideSection(sr, sc, dry = false) {
    const gr = this.gap.sr, gc = this.gap.sc;
    const r0 = sr * SECTION, c0 = sc * SECTION;
    const rg = gr * SECTION, cg = gc * SECTION;
    const block = Array.from({ length: SECTION }, () => Array(SECTION).fill(null));
    for (let r = 0; r < SECTION; r++) {
      for (let c = 0; c < SECTION; c++) {
        block[r][c] = this.board[r0 + r][c0 + c];
        this.board[r0 + r][c0 + c] = null;
      }
    }
    for (let r = 0; r < SECTION; r++) {
      for (let c = 0; c < SECTION; c++) {
        this.board[rg + r][cg + c] = block[r][c];
      }
    }
    this.sectionIdAt[gr][gc] = this.sectionIdAt[sr][sc];
    this.sectionIdAt[sr][sc] = 0;
    this.gap = { sr, sc };
  }

  findBackRankPromos() {
    const promos = [];
    for (let c = 0; c < N; c++) {
      if (this.board[0][c]?.t === 'p' && this.board[0][c].c === 'w') promos.push({ r: 0, c, color: 'w' });
      if (this.board[7][c]?.t === 'p' && this.board[7][c].c === 'b') promos.push({ r: 7, c, color: 'b' });
    }
    return promos;
  }

  findKing(color) {
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const p = this.board[r][c];
      if (p?.t === 'k' && p.c === color) return { r, c };
    }
    return null;
  }

  snapshot() {
    return {
      board: this.board.map(row => [...row]), // Shallow copy of board array
      gap: { ...this.gap },
      sectionIdAt: this.sectionIdAt.map(row => [...row]),
    };
  }

  updatePositionAfterSlide(pos, sr, sc) {
    const { sr: psr, sc: psc } = squareToSection(pos.r, pos.c);
    const gr = this.gap.sr, gc = this.gap.sc;
    if (psr === sr && psc === sc) {
      const i = pos.r % SECTION, j = pos.c % SECTION;
      return { r: gr * SECTION + i, c: gc * SECTION + j };
    } else if (psr === gr && psc === gc) {
      const i = pos.r % SECTION, j = pos.c % SECTION;
      return { r: sr * SECTION + i, c: sc * SECTION + j };
    } else {
      return { ...pos };
    }
  }

  restore(snap, skipRedraw = false) {
    this.board = snap.board.map(row => [...row]); // Shallow copy of board array
    this.gap = { ...snap.gap };
    this.sectionIdAt = snap.sectionIdAt.map(row => [...row]);
  }
}