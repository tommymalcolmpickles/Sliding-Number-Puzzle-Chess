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

  multiSlideSection(slideChain, dry = false) {
    // Create a temporary board to store the new state
    const tempBoard = Array.from({ length: 8 }, () => Array(8).fill(null));
    const tempSectionIdAt = Array.from({ length: 4 }, () => Array(4).fill(0));

    // First, copy all sections that are not moving
    for (let sr = 0; sr < 4; sr++) {
      for (let sc = 0; sc < 4; sc++) {
        if (this.sectionIdAt[sr][sc] !== 0) {
          // Check if this section is part of the slide chain
          const isMoving = slideChain.some(move =>
            move.fromSr === sr && move.fromSc === sc
          );

          if (!isMoving) {
            // Copy the entire section as-is
            const r0 = sr * SECTION, c0 = sc * SECTION;
            for (let r = 0; r < SECTION; r++) {
              for (let c = 0; c < SECTION; c++) {
                tempBoard[r0 + r][c0 + c] = this.board[r0 + r][c0 + c];
              }
            }
            tempSectionIdAt[sr][sc] = this.sectionIdAt[sr][sc];
          }
        }
      }
    }

    // Now move the sections in the chain
    for (const move of slideChain) {
      const { fromSr, fromSc, toSr, toSc } = move;

      // Move the section content
      const fromR0 = fromSr * SECTION, fromC0 = fromSc * SECTION;
      const toR0 = toSr * SECTION, toC0 = toSc * SECTION;

      for (let r = 0; r < SECTION; r++) {
        for (let c = 0; c < SECTION; c++) {
          tempBoard[toR0 + r][toC0 + c] = this.board[fromR0 + r][fromC0 + c];
        }
      }

      // Move the section ID
      tempSectionIdAt[toSr][toSc] = this.sectionIdAt[fromSr][fromSc];
    }

    // Handle the gap - it should move to the position of the first section in the chain
    const firstMove = slideChain[0];
    tempSectionIdAt[firstMove.fromSr][firstMove.fromSc] = 0;

    // Apply the changes to the actual board
    if (!dry) {
      this.board = tempBoard;
      this.sectionIdAt = tempSectionIdAt;
      this.gap = { sr: firstMove.fromSr, sc: firstMove.fromSc };
    } else {
      // For dry run, just update the board temporarily
      this.board = tempBoard;
      this.sectionIdAt = tempSectionIdAt;
      this.gap = { sr: firstMove.fromSr, sc: firstMove.fromSc };
    }
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