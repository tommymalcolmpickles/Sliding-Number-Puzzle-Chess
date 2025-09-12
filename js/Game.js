import Board from './Board.js';
import Renderer from './Renderer.js';
import InputHandler from './InputHandler.js';
import MoveGenerator from './MoveGenerator.js';
import PromotionManager from './PromotionManager.js';
import DialogManager from './DialogManager.js';
import Notation from './Notation.js';
import EnPassantManager from './EnPassantManager.js';
import RepetitionManager from './RepetitionManager.js';
import AudioManager from './AudioManager.js';
import { clone, opponent, inBounds, GLYPH } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class Game {
  constructor(elements) {
    this.elements = elements;
    this.toMove = STRINGS.COLOR_WHITE;
    this.mode = STRINGS.MODE_MOVE; // 'move' or 'slide'
    this.sel = null;
    this.selMoves = [];
    this.lastMove = null;
    this.lastMoveSlide = null;
    this.check = null;
    this.winner = null;
    this.draw = false;
    this.needPromos = [];
    this.board = new Board();
    this.capturedPieces = { [STRINGS.COLOR_WHITE]: [], [STRINGS.COLOR_BLACK]: [] }; // Track captured pieces
    this.gapSelected = false; // Track if gap position has been chosen
    this.initialGapPosition = null; // Store initial gap position
    this.isSliding = false; // Track if slide animation is in progress
    this.renderer = new Renderer(elements.boardSvg, elements.phaseAbove, elements.phaseBelow, this);
    this.moveGenerator = new MoveGenerator(this);
    this.notation = new Notation(this, {
      movesText: elements.movesText,
      movesTable: elements.movesTable,
      movesTableBody: elements.movesTableBody,
      movesContainer: elements.movesContainer
    });
    this.enPassantManager = new EnPassantManager(this);
    this.repetitionManager = new RepetitionManager(this);
    this.promotionManager = new PromotionManager(this, elements.promo, elements.promoTitle, elements.promoChoices, elements.promoHint);
    this.dialogManager = new DialogManager(this, {
      drawDlg: elements.drawDlg,
      drawReasons: elements.drawReasons,
      confirmDraw: elements.confirmDraw,
      cancelDraw: elements.cancelDraw,
      handSelectionDlg: elements.handSelectionDlg,
      leftHandBtn: elements.leftHandBtn,
      rightHandBtn: elements.rightHandBtn,
      gapResultDlg: elements.gapResultDlg,
      gapResultPawn: elements.gapResultPawn,
      gapResultMessage: elements.gapResultMessage,
      confirmGapBtn: elements.confirmGapBtn,
      winDlg: elements.winDlg,
      winMessage: elements.winMessage,
      closeWin: elements.closeWin,
      resetWin: elements.resetWin,
      illegalSlideDlg: elements.illegalSlideDlg,
      illegalSlideReason: elements.illegalSlideReason,
      closeIllegalSlide: elements.closeIllegalSlide,
      howToPlayDlg: elements.howToPlayDlg,
      closeHowToPlay: elements.closeHowToPlay,
    });
    this.audioManager = new AudioManager();
    this.inputHandler = new InputHandler(this, {
      boardSvg: elements.boardSvg,
      reset: elements.reset,
      copyLog: elements.copyLog,
      soundToggle: elements.soundToggle,
    });
    this.initialSnap = this.snapshot();
    this.isLocked = () => {
      return (
        elements.promo.style.display === 'flex' ||
        elements.drawDlg.style.display === 'flex' ||
        elements.winDlg.style.display === 'flex' ||
        elements.illegalSlideDlg.style.display === 'flex' ||
        this.isSliding
      );
    };
  }


  redraw() {
    this.renderer.drawBoard(this);
    this.renderer.setPhaseText(this);
    this.updateCapturedPiecesDisplay();
  }

  updateCapturedPiecesDisplay() {

    // Update black captured pieces (left side) - shows white pieces that black captured
    const blackCapturedContainer = this.elements.capturedBlack;
    const blackCapturedPill = blackCapturedContainer?.querySelector('.captured-pill');
    if (blackCapturedContainer && blackCapturedPill) {
      const blackPiecesHtml = this.formatCapturedPieces(this.capturedPieces.b);
      blackCapturedPill.innerHTML = `<div class="glyph-content">${blackPiecesHtml}</div>`;

      // Hide/show the entire container based on whether there are captured pieces
      if (this.capturedPieces.b.length > 0) {
        blackCapturedContainer.style.visibility = 'visible';
      } else {
        blackCapturedContainer.style.visibility = 'hidden';
      }
    }

    // Update white captured pieces (right side) - shows black pieces that white captured
    const whiteCapturedContainer = this.elements.capturedWhite;
    const whiteCapturedPill = whiteCapturedContainer?.querySelector('.captured-pill');
    if (whiteCapturedContainer && whiteCapturedPill) {
      const whitePiecesHtml = this.formatCapturedPieces(this.capturedPieces.w);
      whiteCapturedPill.innerHTML = `<div class="glyph-content">${whitePiecesHtml}</div>`;

      // Hide/show the entire container based on whether there are captured pieces
      if (this.capturedPieces.w.length > 0) {
        whiteCapturedContainer.style.visibility = 'visible';
      } else {
        whiteCapturedContainer.style.visibility = 'hidden';
      }
    }
  }

  formatCapturedPieces(pieces) {
    if (pieces.length === 0) return '';

    // Sort pieces by type: pawns, knights, bishops, rooks, queen
    const pieceOrder = { 'p': 0, 'n': 1, 'b': 2, 'r': 3, 'q': 4 };
    const sortedPieces = [...pieces].sort((a, b) => pieceOrder[a.t] - pieceOrder[b.t]);

    // Group by piece type
    const groups = { p: [], n: [], b: [], r: [], q: [] };
    sortedPieces.forEach(piece => {
      groups[piece.t].push(piece);
    });

    const result = [];
    const pieceTypes = ['p', 'n', 'b', 'r', 'q'];

    // Process each piece type in order
    pieceTypes.forEach((pieceType, index) => {
      const groupPieces = groups[pieceType];
      if (groupPieces.length === 0) return;

      if (pieceType === 'p') {
        // Special handling for pawns: groups of 2, all on separate lines
        for (let i = 0; i < groupPieces.length; i += 2) {
          const pair = groupPieces.slice(i, i + 2);
          result.push(pair.map(p => GLYPH[p.c][p.t]).join(''));
        }
      } else {
        // Other pieces: all together on one line
        result.push(groupPieces.map(p => GLYPH[p.c][p.t]).join(''));
      }

      // Don't add separators - the user's example shows no separators between piece types
    });

    return result.join('\n');
  }


  finishTurnAfterMove() {
    this.repetitionManager.bumpRepetitionCounts();
    this.dialogManager.checkAndShowDrawDialog();

    // Handle en passant target validation after move
    this.enPassantManager.validateAndClearAfterTurn();

    if (!this.winner && !this.draw) {
      this.toMove = opponent(this.toMove);
      this.mode = 'move';
      this.sel = null;
      this.selMoves = [];

      // Check for checkmate/stalemate after switching turns
      this.updateCheckFlags();
    } else if (this.draw) {
      this.notation.appendResultIfNeeded();
      // Only show stalemate dialog if it's actually a stalemate (no legal moves, king not in check)
      // For draws by repetition, the DialogManager.callAutomaticDraw() already shows the dialog
      if (!this.moveGenerator.hasAnyLegalMove(this.toMove) && !this.moveGenerator.isKingInCheck(this.toMove)) {
        this.dialogManager.showStalemateDialog();
      }
    } else {
      this.notation.appendResultIfNeeded();
      this.dialogManager.showWinDialog();
    }
    this.redraw();
  }

  enterSlidePhase() {
    // Don't check for checkmate yet - let the player try slide moves first
    // updateCheckFlags() will be called after the slide phase if needed
    this.mode = STRINGS.MODE_SLIDE;
    this.sel = null;
    this.selMoves = [];
    this.lastMove = null; // Clear previous move highlighting when entering slide phase
    this.redraw();
  }

  finishTurnAfterSlide(slide) {
    this.repetitionManager.bumpRepetitionCounts();
    this.notation.appendSlide(slide, slide.originalGap);
    this.dialogManager.checkAndShowDrawDialog();

    // Handle en passant target validation after slide
    this.enPassantManager.validateAndClearAfterTurn();

    if (!this.winner && !this.draw) {
      this.toMove = opponent(this.toMove);
      this.mode = STRINGS.MODE_MOVE;
      this.sel = null;
      this.selMoves = [];
      this.lastMove = null; // Clear previous move highlighting for slide moves
      this.lastMoveSlide = slide || null;

      // Check for checkmate/stalemate after switching turns
      this.updateCheckFlags();
    } else if (this.draw) {
      this.notation.appendResultIfNeeded();
      // Only show stalemate dialog if it's actually a stalemate (no legal moves, king not in check)
      // For draws by repetition, the DialogManager.callAutomaticDraw() already shows the dialog
      if (!this.moveGenerator.hasAnyLegalMove(this.toMove) && !this.moveGenerator.isKingInCheck(this.toMove)) {
        this.dialogManager.showStalemateDialog();
      }
    } else {
      this.notation.appendResultIfNeeded();
      // No dialog for checkmate - handled by phase display
    }
    this.redraw();
  }

  updateCheckFlags() {
    const w = this.moveGenerator.isKingInCheck('w'), b = this.moveGenerator.isKingInCheck('b');
    this.check = null;
    if (w) this.check = this.board.findKing('w');
    if (b) this.check = this.board.findKing('b');
    const side = this.toMove;
    const opp = opponent(side);
    const inCheck = this.moveGenerator.isKingInCheck(side);

    if (!this.moveGenerator.hasAnyLegalMove(side)) {
      if (inCheck) {
        this.winner = opp;
      } else {
        this.winner = null;
        this.draw = true;
      }
    } else if (!this.moveGenerator.hasAnyLegalMove(opp) && this.moveGenerator.isKingInCheck(opp)) {
      this.winner = side;
    }
  }

  tryMakeMove(from, to) {
    const p = this.board.pieceAt(from);
    if (!p || p.c !== this.toMove) return false;

    const legal = this.moveGenerator.legalMoves(from);
    if (!legal.some(m => m.r === to.r && m.c === to.c)) return false;

    // Check for capture before making the move
    const capturedPiece = this.board.pieceAt(to);
    if (capturedPiece) {
      // Clone the piece to avoid reference issues
      const pieceCopy = { ...capturedPiece };
      this.capturedPieces[p.c].push(pieceCopy);
      // Update immediately after adding the piece
      setTimeout(() => this.updateCapturedPiecesDisplay(), 0);
    }

    // Always create pre-move snapshots for notation and potential undo (regardless of gap selection)
    const preMoveBoardSnap = this.board.snapshot(); // For notation system
    const preMoveGameSnap = this.snapshot(); // For potential undo

    // Save history after the move is added to notation
    // This ensures the snapshot includes the move that was just made
    if (p.t === 'p' && to.c !== from.c && !this.board.pieceAt(to)) {
      const enPassantCapture = this.enPassantManager.handleCapture(to, p.c);
      if (enPassantCapture) {
        // Clone the piece to avoid reference issues
        const pieceCopy = { ...enPassantCapture };
        this.capturedPieces[p.c].push(pieceCopy);
        // Update immediately after adding the piece
        setTimeout(() => this.updateCapturedPiecesDisplay(), 0);
      }
    }
    if (p.t === 'k' && (Math.abs(to.c - from.c) > 1 || Math.abs(to.r - from.r) > 1)) {
      // Castling (horizontal or vertical, short or long)
      this.board.movePiece(from, to);

      // Calculate direction and distance
      let dr = 0, dc = 0;
      if (Math.abs(to.c - from.c) > 1) {
        dc = (to.c > from.c) ? 1 : -1;
      } else if (Math.abs(to.r - from.r) > 1) {
        dr = (to.r > from.r) ? 1 : -1;
      }

      // Find the rook by checking possible distances (3 for short, 4 for long)
      const possibleDistances = [3, 4]; // Short and long castling distances
      let rookFound = false;

      for (const distance of possibleDistances) {
        const rookRow = from.r + dr * distance;
        const rookCol = from.c + dc * distance;

        if (inBounds(rookRow, rookCol) && this.board.board[rookRow][rookCol]?.t === 'r') {
          // Found the rook - move it 3 squares toward the king
          const newRookRow = to.r - dr;
          const newRookCol = to.c - dc;

          if (inBounds(newRookRow, newRookCol)) {
            this.board.board[newRookRow][newRookCol] = { ...this.board.board[rookRow][rookCol], moved: true };
            this.board.board[rookRow][rookCol] = null;
            rookFound = true;
          }
          break;
        }
      }

      if (!rookFound) {
        // Could not find rook to move - this shouldn't happen in normal gameplay
      }
    } else {
      this.board.movePiece(from, to);
    }
    this.lastMove = { from: { ...from }, to: { ...to } };
    if (p.t === 'p' && Math.abs(to.r - from.r) === 2) {
      this.enPassantManager.setAfterDoubleMove(from, to);
    } else {
      this.enPassantManager.clearTarget();
    }
    const promos = this.board.findBackRankPromos();
    if (promos.length) {
      this.needPromos.push(...promos);
      this.promotionManager.askPromotionQueue(() => {
        if (this.moveGenerator.isKingInCheck(this.toMove)) {
          // Invalid promotion - undo the move
          this.restore(preMoveGameSnap, true); // true = skip redraw
          this.redraw();
          return false;
        }
        // Valid promotion - complete the turn
        this.enPassantManager.validateAndClearAfterTurn();
        this.notation.appendMove.bind(this.notation)(preMoveBoardSnap);

        // Play move sound effect
        this.audioManager.playTap();

        // Check for draw by repetition after regular moves too
        this.dialogManager.checkAndShowDrawDialog();

        this.finishTurnAfterMove();
      });
      return true;
    }
    if (this.moveGenerator.isKingInCheck(this.toMove)) {
      return false;
    }
    this.enPassantManager.validateAndClearAfterTurn();
    this.notation.appendMove.bind(this.notation)(preMoveBoardSnap);

    // Play move sound effect
    this.audioManager.playTap();

    // Check for draw by repetition after regular moves too
    this.dialogManager.checkAndShowDrawDialog();

    return true;
  }

  snapshot() {
    return {
      board: this.board.snapshot(),
      notation: this.notation.snapshot(),
      enPassantManager: this.enPassantManager.snapshot(),
      repetitionManager: this.repetitionManager.snapshot(),
      capturedPieces: { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] },
      game: {
        toMove: this.toMove,
        mode: this.mode,
        sel: this.sel ? { ...this.sel } : null,
        selMoves: this.selMoves.map(m => ({ ...m })),
        lastMove: this.lastMove ? { from: { ...this.lastMove.from }, to: { ...this.lastMove.to } } : null,
        lastMoveSlide: this.lastMoveSlide ? { ...this.lastMoveSlide } : null,
        check: this.check ? { ...this.check } : null,
        winner: this.winner,
        draw: this.draw,
        needPromos: this.needPromos.map(p => ({ ...p })),
        gapSelected: this.gapSelected,
        initialGapPosition: this.initialGapPosition ? { ...this.initialGapPosition } : null,
        isSliding: this.isSliding,
      },
    };
  }

  restore(snap, skipRedraw = false) {
    if (!snap) {
      this.toMove = 'w';
      this.mode = 'move';
      this.sel = null;
      this.selMoves = [];
      this.lastMove = null;
      this.lastMoveSlide = null;
      this.check = null;
      this.winner = null;
      this.draw = false;
      this.needPromos = [];
      this.capturedPieces = { w: [], b: [] };
      this.board = new Board();
      this.notation.restore({ moves: [], resultAppended: false });
      this.enPassantManager.restore({ target: null });
      if (!skipRedraw) {
        this.redraw();
      }
      return;
    }
    this.toMove = snap.game.toMove;
    this.mode = snap.game.mode;
    this.sel = snap.game.sel ? { ...snap.game.sel } : null;
    this.selMoves = snap.game.selMoves.map(m => ({ ...m }));
    this.lastMove = snap.game.lastMove ? { from: { ...snap.game.lastMove.from }, to: { ...snap.game.lastMove.to } } : null;
    this.lastMoveSlide = snap.game.lastMoveSlide ? { ...snap.game.lastMoveSlide } : null;
    this.check = snap.game.check ? { ...snap.game.check } : null;
    this.winner = snap.game.winner;
    this.draw = snap.game.draw;
    this.needPromos = snap.game.needPromos.map(p => ({ ...p }));
    this.gapSelected = snap.game.gapSelected || false;
    this.initialGapPosition = snap.game.initialGapPosition ? { ...snap.game.initialGapPosition } : null;
    this.isSliding = snap.game.isSliding || false;
    this.board.restore(snap.board);
    this.notation.restore(snap.notation);
    this.enPassantManager.restore(snap.enPassantManager || { target: null });
    this.repetitionManager.restore(snap.repetitionManager);
    this.capturedPieces = snap.capturedPieces ? { w: [...snap.capturedPieces.w], b: [...snap.capturedPieces.b] } : { w: [], b: [] };
    if (!skipRedraw) {
      this.redraw();
    }
  }

  // Hand selection and gap positioning methods
  showHandSelectionDialog() {
    // Store initial gap position
    this.initialGapPosition = { sr: this.board.gap.sr, sc: this.board.gap.sc };

    // Disable board interaction
    this.elements.boardSvg.parentElement.classList.add(STRINGS.CSS_CLASS_BOARD_MODAL_DISABLED);

    // Show hand selection dialog
    this.elements.handSelectionDlg.style.display = 'flex';

    // Set up button event listeners
    this.elements.leftHandBtn.onclick = () => this.handleHandChoice(STRINGS.HAND_LEFT);
    this.elements.rightHandBtn.onclick = () => this.handleHandChoice(STRINGS.HAND_RIGHT);
  }

  handleHandChoice(hand) {
    // Hide hand selection dialog
    this.elements.handSelectionDlg.style.display = 'none';

    // Keep board interaction disabled for gap result dialog
    // (don't remove the board-modal-disabled class yet)

    // Generate random number (0 or 1)
    const randomResult = Math.floor(Math.random() * 2); // 0 or 1

    // Clear any existing classes
    this.elements.gapResultPawn.className = '';

    // Determine gap position based on random result
    if (randomResult === 0) {
      // White pawn - gap stays at section 11 (sr=2, sc=2)
      this.board.gap.sr = this.initialGapPosition.sr;
      this.board.gap.sc = this.initialGapPosition.sc;
      this.elements.gapResultPawn.textContent = GLYPH.w.p; // White pawn
      this.elements.gapResultMessage.textContent = STRINGS.DIALOG_GAP_RESULT_WHITE_MESSAGE;
    } else {
      // Black pawn - move gap to section 7 (sr=1, sc=2)
      const oldSr = this.board.gap.sr;
      const oldSc = this.board.gap.sc;
      const newSr = 1; // Section 7 is at row 1, column 2 (0-indexed)
      const newSc = 2;

      // Update gap position
      this.board.gap.sr = newSr;
      this.board.gap.sc = newSc;

      // Update section IDs: new position gets ID 0, old position gets its original ID
      this.board.sectionIdAt[newSr][newSc] = 0;
      this.board.sectionIdAt[oldSr][oldSc] = this.calculateSectionId(oldSr, oldSc);

      this.elements.gapResultPawn.textContent = GLYPH.b.p; // Black pawn
      this.elements.gapResultPawn.className = STRINGS.CSS_CLASS_BLACK_PAWN_GLYPH; // Apply styling
      this.elements.gapResultMessage.textContent = STRINGS.DIALOG_GAP_RESULT_BLACK_MESSAGE;
    }

    // Show gap result dialog
    this.elements.gapResultDlg.style.display = 'flex';

    // Set up confirm button
    this.elements.confirmGapBtn.onclick = () => this.confirmGapSelection();

    // Set up click outside to close dialog
    const closeDialogOnOutsideClick = (event) => {
      if (event.target === this.elements.gapResultDlg) {
        this.confirmGapSelection();
        this.elements.gapResultDlg.removeEventListener('click', closeDialogOnOutsideClick);
      }
    };
    this.elements.gapResultDlg.addEventListener('click', closeDialogOnOutsideClick);
  }

  confirmGapSelection() {
    // Hide gap result dialog
    this.elements.gapResultDlg.style.display = 'none';

    // Enable board interaction
    this.elements.boardSvg.parentElement.classList.remove(STRINGS.CSS_CLASS_BOARD_MODAL_DISABLED);

    // Mark gap as selected and allow game to start
    this.gapSelected = true;

    // Start recording repetition counts now that gap is selected
    this.repetitionManager.clear();


    // Redraw to show new gap position
    this.redraw();
  }

  // Modified start method to draw board first, then show hand selection dialog
  start() {
    // First, draw the initial board state
    this.redraw();

    // Add window resize listener to handle dynamic scaling
    window.addEventListener('resize', () => {
      // Debounce the resize event to avoid excessive redraws
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = setTimeout(() => {
        this.redraw();
      }, 100);
    });

    // Then show the hand selection dialog as a modal
    this.showHandSelectionDialog();
  }


  // Calculate section ID for a given section position (left-to-right, top-to-bottom numbering)
  calculateSectionId(sr, sc) {
    return sr * 4 + sc + 1;
  }

  // Modified reset method to show hand selection again
  reset() {
    // Reset gap selection flag
    this.gapSelected = false;

    // Reset notation numbering
    this.notation.reset();

    // Reset declined draws tracking
    this.dialogManager.declinedDraws.clear();

    // Reset draw dialog to normal state
    this.dialogManager.resetDrawDialog();

    // Call the original reset logic
    this.restore(this.initialSnap, false);

    // Show hand selection dialog again
    this.showHandSelectionDialog();
  }
}