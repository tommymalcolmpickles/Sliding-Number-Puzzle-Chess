import { inBounds, opponent, SECTION } from './Constants.js';

export default class MoveGenerator {
  constructor(game) {
    this.game = game;
  }

  legalMoves(from) {
    const p = this.game.board.pieceAt(from);
    if (!p) return [];
    const out = [];
    const add = (r, c) => {
      if (inBounds(r, c) && !this.game.board.isGapSquare(r, c)) {
        const target = this.game.board.pieceAt({ r, c });
        if (!target || target.c !== p.c) out.push({ r, c });
      }
    };
    const occ = (r, c) => this.game.board.pieceAt({ r, c });
    const enemy = (r, c) => occ(r, c) && occ(r, c).c !== p.c;
    const empty = (r, c) => !occ(r, c);
    const ray = (dr, dc) => {
      let r = from.r + dr, c = from.c + dc;
      while (inBounds(r, c)) {
        if (this.game.board.isGapBetween(from.r, from.c, r, c)) break;
        if (occ(r, c)) {
          if (enemy(r, c)) add(r, c);
          break;
        } else add(r, c);
        r += dr;
        c += dc;
      }
    };
    switch (p.t) {
      case 'p': {
        const dir = p.c === 'w' ? -1 : 1;
        if (inBounds(from.r + dir, from.c) && empty(from.r + dir, from.c) && !this.game.board.isGapSquare(from.r + dir, from.c))
          add(from.r + dir, from.c);
        if (!p.moved && empty(from.r + dir, from.c) && empty(from.r + 2 * dir, from.c) && !this.game.board.isGapSquare(from.r + dir, from.c) && !this.game.board.isGapSquare(from.r + 2 * dir, from.c))
          add(from.r + 2 * dir, from.c);
        for (const dc of [-1, 1]) {
          const r = from.r + dir, c = from.c + dc;
          if (inBounds(r, c) && !this.game.board.isGapSquare(r, c)) {
            if (enemy(r, c)) add(r, c);
            const ep = this.enPassantTarget();
            if (ep && ep.r === r && ep.c === c) {
              add(r, c);
            }
          }
        }
        break;
      }
      case 'n': {
        const steps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
        for (const [dr, dc] of steps) {
          const r = from.r + dr, c = from.c + dc;
          if (inBounds(r, c) && !this.game.board.isGapSquare(r, c)) add(r, c);
        }
        break;
      }
      case 'b':
        ray(1, 1); ray(1, -1); ray(-1, 1); ray(-1, -1);
        break;
      case 'r':
        ray(1, 0); ray(-1, 0); ray(0, 1); ray(0, -1);
        break;
      case 'q':
        ray(1, 0); ray(-1, 0); ray(0, 1); ray(0, -1); ray(1, 1); ray(1, -1); ray(-1, 1); ray(-1, -1);
        break;
      case 'k': {
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) {
          const r = from.r + dr, c = from.c + dc;
          if (inBounds(r, c) && !this.game.board.isGapSquare(r, c)) add(r, c);
        }
        if (!p.moved && !this.isKingInCheck(p.c)) {
          // Check for castling opportunities in all directions
          this.addCastlingMoves(from, add);
        }
        break;
      }
    }
    return out.filter(m => this.moveIsLegal(from, m));
  }

  addCastlingMoves(from, add) {
    const p = this.game.board.pieceAt(from);

    // Check all directions for castling opportunities
    this.checkAllCastlingDirections(from, p, add);
  }

  checkAllCastlingDirections(from, p, add) {
    // Check all 4 directions for rooks at specific distances
    const directions = [
      { dr: 0, dc: 1 },   // East (right)
      { dr: 0, dc: -1 },  // West (left)
      { dr: 1, dc: 0 },   // South (down)
      { dr: -1, dc: 0 }   // North (up)
    ];

    for (const dir of directions) {
      // Check for short castling (4 total squares: king + 2 empty + rook)
      this.checkCastlingAtDistance(from, p, add, dir, 3);

      // Check for long castling (5 total squares: king + 3 empty + rook)
      this.checkCastlingAtDistance(from, p, add, dir, 4);
    }
  }

  checkCastlingAtDistance(from, p, add, direction, distance) {
    const rookRow = from.r + direction.dr * distance;
    const rookCol = from.c + direction.dc * distance;

    if (!inBounds(rookRow, rookCol)) {
      return;
    }

    const rook = this.game.board.pieceAt({ r: rookRow, c: rookCol });
    if (!rook || rook.t !== 'r' || rook.c !== p.c || rook.moved) {
      return;
    }

    // For distance-based castling, king always moves 2 squares toward rook
    // Rook always moves 3 squares toward king (jumping over)
    // Total span = king + 2 empty squares + rook = 4 squares (short) or 5 squares (long)
    const kingMoveDistance = 2;

    // Check path between king and rook (all squares except king and rook positions)
    let pathClear = true;
    let r = from.r + direction.dr;
    let c = from.c + direction.dc;
    for (let i = 1; i < distance; i++) {
      if (this.game.board.isGapSquare(r, c) || this.game.board.pieceAt({ r, c })) {
        pathClear = false;
        break;
      }
      r += direction.dr;
      c += direction.dc;
    }

    if (!pathClear) return;

    // Check that king doesn't pass through check
    let kingPathSafe = true;
    for (let step = 1; step <= kingMoveDistance; step++) {
      const checkR = from.r + direction.dr * step;
      const checkC = from.c + direction.dc * step;
      if (this.game.board.isGapSquare(checkR, checkC) ||
          this.squareAttacked({ r: checkR, c: checkC }, opponent(p.c))) {
        kingPathSafe = false;
        break;
      }
    }

    if (!kingPathSafe) return;

    // Add the castling move
    const castleRow = from.r + direction.dr * kingMoveDistance;
    const castleCol = from.c + direction.dc * kingMoveDistance;

    if (inBounds(castleRow, castleCol) && !this.game.board.isGapSquare(castleRow, castleCol)) {
      add(castleRow, castleCol);
    }
  }



  moveIsLegal(from, to) {
    const snap = this.game.board.snapshot();
    const p = this.game.board.pieceAt(from);
    if (!p) {
      this.game.board.restore(snap, true);
      return false;
    }
    const captured = this.game.board.pieceAt(to);
    this.game.board.movePiece(from, to);
    if (p.t === 'p' && to.c !== from.c && !captured) {
      this.game.enPassantManager.handleCapture(to, p.c);
    }
    if (p.t === 'k' && Math.abs(to.c - from.c) > 1 && from.r === to.r) {
      // Horizontal castling
      const dir = (to.c > from.c) ? 1 : -1;
      const rookCol = from.c + (dir === 1 ? 3 : -4);
      const newRookCol = to.c - dir;
      if (inBounds(from.r, rookCol) && inBounds(from.r, newRookCol)) {
        this.game.board.board[to.r][newRookCol] = { ...this.game.board.board[to.r][rookCol], moved: true };
        this.game.board.board[to.r][rookCol] = null;
      }
    }
    const bad = this.isKingInCheck(p.c);
    this.game.board.restore(snap, true);
    return !bad;
  }

  enPassantTarget() {
    return this.game.enPassantManager.getTarget(); // Use manager's target
  }

  squareAttacked(sq, by) {
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.game.board.pieceAt({ r, c });
      if (!p || p.c !== by) continue;
      const from = { r, c };
      switch (p.t) {
        case 'p': {
          const dir = p.c === 'w' ? -1 : 1;
          for (const dc of [-1, 1]) {
            const rr = r + dir, cc = c + dc;
            if (rr === sq.r && cc === sq.c && inBounds(rr, cc) && !this.game.board.isGapSquare(rr, cc)) return true;
          }
          break;
        }
        case 'n': {
          const steps = [[1, 2], [2, 1], [-1, 2], [-2, 1], [1, -2], [2, -1], [-1, -2], [-2, -1]];
          for (const [dr, dc] of steps) {
            const rr = r + dr, cc = c + dc;
            if (inBounds(rr, cc) && !this.game.board.isGapSquare(rr, cc) && rr === sq.r && cc === sq.c) return true;
          }
          break;
        }
        case 'b':
          if (this.attacksByRay(from, sq, [[1, 1], [1, -1], [-1, 1], [-1, -1]])) return true;
          break;
        case 'r':
          if (this.attacksByRay(from, sq, [[1, 0], [-1, 0], [0, 1], [0, -1]])) return true;
          break;
        case 'q':
          if (this.attacksByRay(from, sq, [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]])) return true;
          break;
        case 'k': {
          for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) if (dr || dc) {
            const rr = r + dr, cc = c + dc;
            if (inBounds(rr, cc) && !this.game.board.isGapSquare(rr, cc) && rr === sq.r && cc === sq.c) return true;
          }
          break;
        }
      }
    }
    return false;
  }

  attacksByRay(from, sq, dirs) {
    for (const [dr, dc] of dirs) {
      let r = from.r + dr, c = from.c + dc;
      while (inBounds(r, c)) {
        if (this.game.board.isGapSquare(r, c)) break;
        if (r === sq.r && c === sq.c) return true;
        if (this.game.board.pieceAt({ r, c })) break;
        r += dr;
        c += dc;
      }
    }
    return false;
  }

  isKingInCheck(color) {
    const k = this.game.board.findKing(color);
    if (!k) return false;
    return this.squareAttacked(k, opponent(color));
  }

  hasAnyLegalMove(color) {
    // For checkmate detection, we need to check if the player has ANY legal moves
    // in ANY mode, because they can switch modes during their turn

    // Check for legal piece moves (available in move mode)
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      const p = this.game.board.pieceAt({ r, c });
      if (!p || p.c !== color) continue;
      const moves = this.legalMoves({ r, c });
      if (moves.length > 0) {
        return true;
      }
    }

    // Check for legal slide moves (available in slide mode)
    const { legal } = this.legalSlideTargets();
    if (legal.length > 0) {
      return true;
    }

    return false;
  }

  findValidSlideOrigins() {
    const origins = [];
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];

    for (const [dsr, dsc] of directions) {
      // Check up to 3 sections away in this direction
      for (let distance = 1; distance <= 3; distance++) {
        const sr = this.game.board.gap.sr + dsr * distance;
        const sc = this.game.board.gap.sc + dsc * distance;

        // Check bounds
        if (sr >= 0 && sr < 4 && sc >= 0 && sc < 4 && this.game.board.sectionIdAt[sr][sc] !== 0) {
          origins.push({ sr, sc, distance });
        } else {
          // Stop checking further in this direction if we hit a boundary or gap
          break;
        }
      }
    }

    return origins;
  }

  determineSlideChain(originSr, originSc) {
    const gapSr = this.game.board.gap.sr;
    const gapSc = this.game.board.gap.sc;

    // Determine direction from origin to gap
    const dsr = gapSr - originSr;
    const dsc = gapSc - originSc;

    // Normalize to get step direction (should be -1, 0, or 1)
    const stepSr = dsr === 0 ? 0 : dsr > 0 ? 1 : -1;
    const stepSc = dsc === 0 ? 0 : dsc > 0 ? 1 : -1;

    // Calculate distance
    const distance = Math.max(Math.abs(dsr), Math.abs(dsc));

    const chain = [];

    // Build the chain of sections to move
    for (let i = 0; i < distance; i++) {
      const currentSr = originSr + stepSr * i;
      const currentSc = originSc + stepSc * i;

      const targetSr = currentSr + stepSr;
      const targetSc = currentSc + stepSc;

      chain.push({
        fromSr: currentSr,
        fromSc: currentSc,
        toSr: targetSr,
        toSc: targetSc
      });
    }

    return chain;
  }

  legalSlideTargets() {
    const legal = [];
    const illegal = [];

    // Get all valid origins
    const origins = this.findValidSlideOrigins();

    for (const origin of origins) {
      const { sr, sc } = origin;

      // Get the slide chain for this origin
      const slideChain = this.determineSlideChain(sr, sc);

      // Simulate the entire multi-section slide
      const snap = this.game.board.snapshot();
      this.game.board.multiSlideSection(slideChain, true);

      if (this.isKingInCheck(this.game.toMove)) {
        illegal.push({ sr, sc });
      } else {
        legal.push({ sr, sc });
      }

      this.game.board.restore(snap, true);
    }

    return { legal, illegal };
  }
}