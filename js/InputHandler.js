import { N, SECTION, squareToSection, secIndex, opponent } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class InputHandler {
  constructor(game, elements) {
    this.game = game;
    this.boardElement = elements.board;
    this.resetBtn = elements.reset;
    this.copyBtn = elements.copyLog;
    this.boardElement.addEventListener('click', (evt) => this.onBoardClick(evt));
    this.game.elements.overlay.addEventListener('click', e => e.preventDefault());
    this.resetBtn.addEventListener('click', () => this.game.reset());
    this.copyBtn.addEventListener('click', () => this.game.notation.copyLogToClipboard());
  }

  boardCoords(evt) {
    const rect = evt.target.getBoundingClientRect();
    const x = evt.clientX - rect.left, y = evt.clientY - rect.top;
    const c = Math.floor((x / rect.width) * N);
    const r = Math.floor((y / rect.height) * N);
    return { r, c };
  }

  onBoardClick(evt) {
    // Block all board interaction when game has ended (except reset)
    if (this.game.winner || this.game.draw) {
      console.log(STRINGS.LOG_BOARD_CLICK_MODE, 'blocked - game has ended');
      return;
    }
    if (this.game.isLocked()) {
      console.log(STRINGS.ERROR_GAME_LOCKED_CLICK_IGNORED);
      return;
    }
    if (!this.game.gapSelected) {
      console.log(STRINGS.ERROR_GAP_NOT_SELECTED_CLICK_IGNORED);
      return;
    }
    const { r, c } = this.boardCoords(evt);
    console.log(STRINGS.LOG_BOARD_CLICK_MODE, this.game.mode);

    // Check if clicked on gap to toggle mode (works in any mode)
    const { sr, sc } = squareToSection(r, c);
    console.log(STRINGS.LOG_CLICKED_AT_SQUARE, r, c, STRINGS.LOG_CLICKED_SECTION, sr, sc, STRINGS.LOG_GAP_AT, this.game.board.gap.sr, this.game.board.gap.sc);
    if (sr === this.game.board.gap.sr && sc === this.game.board.gap.sc) {
      console.log(STRINGS.LOG_GAP_CLICKED_TOGGLE_MODE, this.game.mode, STRINGS.LOG_TO, this.game.mode === STRINGS.MODE_MOVE ? STRINGS.MODE_SLIDE : STRINGS.MODE_MOVE);
      this.game.mode = this.game.mode === STRINGS.MODE_MOVE ? STRINGS.MODE_SLIDE : STRINGS.MODE_MOVE;
      this.game.sel = null;
      this.game.selMoves = [];
      this.game.redraw();
      return; // Exit early after mode toggle
    }

    if (this.game.mode === STRINGS.MODE_MOVE) {
      const p = this.game.board.pieceAt({ r, c });
      if (this.game.sel) {
        const from = this.game.sel, to = { r, c };
        const ok = this.game.selMoves.some(m => m.r === to.r && m.c === to.c);
        if (ok && this.game.tryMakeMove(from, to)) {
          this.game.sel = null;
          this.game.selMoves = [];
          this.game.redraw();
          this.game.finishTurnAfterMove();
        } else {
          if (p && p.c === this.game.toMove) {
            this.game.sel = { r, c };
            this.game.selMoves = this.game.moveGenerator.legalMoves({ r, c });
          } else {
            this.game.sel = null;
            this.game.selMoves = [];
          }
        }
        this.game.redraw();
      } else {
        if (p && p.c === this.game.toMove) {
          this.game.sel = { r, c };
          this.game.selMoves = this.game.moveGenerator.legalMoves({ r, c });
        }
      }
      this.game.redraw();
    } else if (this.game.mode === STRINGS.MODE_SLIDE) {
      const { sr, sc } = squareToSection(r, c);
      console.log('Slide mode click detected at square:', r, c, '-> section:', sr, sc);
      console.log('SECTION constant:', SECTION, 'Math.floor(r/SECTION):', Math.floor(r/SECTION), 'Math.floor(c/SECTION):', Math.floor(c/SECTION));

      // Clear any existing slide indicators when clicking in slide mode
      this.game.renderer.clearSlideIndicators();

      const { legal, illegal } = this.game.moveGenerator.legalSlideTargets();
      console.log('Legal targets:', legal, 'Illegal targets:', illegal);
      console.log('Checking if section', sr, sc, 'is in legal targets...');

      if (legal.some(t => t.sr === sr && t.sc === sc)) {
        console.log('Performing legal slide of section', sr, sc);
        this.game.sel = null;
        this.game.selMoves = [];
        this.game.redraw();
        // Capture original gap position before slide
        const originalGap = { sr: this.game.board.gap.sr, sc: this.game.board.gap.sc };

        // Start slide animation
        this.game.renderer.animateSlide(sr, sc, () => {
          // Animation completed, now update board state
          this.game.board.slideSection(sr, sc);
          // Update enPassantTarget position after slide
          this.game.enPassantManager.updateAfterSlide(sr, sc);
          this.game.promotionManager.handleSlidePromotions(() => {
            if (this.game.moveGenerator.isKingInCheck(this.game.toMove)) {
              return;
            }
            this.game.finishTurnAfterSlide({ sr, sc, originalGap });
          });
        });
      } else if (illegal.some(t => t.sr === sr && t.sc === sc)) {
        const sectionNum = secIndex(sr, sc);
        const reason = `Sliding section ${sectionNum} would put your king in check.`;
        this.game.dialogManager.showIllegalSlideDialog(reason);
      } else {
        // Clicked on a section that's not adjacent to the gap - switch back to move mode
        console.log(STRINGS.LOG_CLICKED_NON_ADJACENT_SECTION_IN_SLIDE_MODE);
        this.game.mode = STRINGS.MODE_MOVE;
        this.game.sel = null;
        this.game.selMoves = [];
        this.game.redraw();
      }
    }
  }
}