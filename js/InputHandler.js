import { N, SECTION, squareToSection, secIndex, opponent } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class InputHandler {
  constructor(game, elements) {
    this.game = game;
    this.boardElement = elements.boardSvg;
    this.resetBtn = elements.reset;
    this.copyBtn = elements.copyLog;
    this.soundToggleBtn = elements.soundToggle;
    this.boardElement.addEventListener('click', (evt) => this.onBoardClick(evt));
    this.resetBtn.addEventListener('click', () => this.game.reset());
    this.copyBtn.addEventListener('click', () => this.game.notation.copyLogToClipboard());
    this.soundToggleBtn.addEventListener('click', () => this.toggleSound());

    // Initialize sound toggle button state
    this.updateSoundToggleButton();
  }

  boardCoords(evt) {
    const rect = this.boardElement.getBoundingClientRect();
    const x = evt.clientX - rect.left, y = evt.clientY - rect.top;
    const c = Math.floor((x / rect.width) * N);
    const r = Math.floor((y / rect.height) * N);
    return { r, c };
  }

  onBoardClick(evt) {
    // Block all board interaction when game has ended (except reset)
    if (this.game.winner || this.game.draw) {
      return;
    }
    if (this.game.isLocked()) {
      return;
    }
    if (!this.game.gapSelected) {
      return;
    }
    const { r, c } = this.boardCoords(evt);

    // Check if clicked on gap to toggle mode (works in any mode)
    const { sr, sc } = squareToSection(r, c);
    if (sr === this.game.board.gap.sr && sc === this.game.board.gap.sc) {
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
          // Don't call finishTurnAfterMove() if promotion is pending - the promotion callback will handle it
          if (this.game.needPromos.length === 0) {
            this.game.finishTurnAfterMove();
          }
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

      // Clear any existing slide indicators when clicking in slide mode
      this.game.renderer.clearSlideIndicators();

      const { legal, illegal } = this.game.moveGenerator.legalSlideTargets();

      if (legal.some(t => t.sr === sr && t.sc === sc)) {
        this.game.sel = null;
        this.game.selMoves = [];
        this.game.redraw();
        // Capture original gap position before slide
        const originalGap = { sr: this.game.board.gap.sr, sc: this.game.board.gap.sc };

        // Get the slide chain for this origin
        const slideChain = this.game.moveGenerator.determineSlideChain(sr, sc);

        // Start multi-slide animation
        this.game.renderer.animateMultiSlide(slideChain, () => {
          // Animation completed, now update board state
          this.game.board.multiSlideSection(slideChain);

          // Update enPassantTarget position after slide for all sections in the chain
          slideChain.forEach(move => {
            this.game.enPassantManager.updateAfterSlide(move.fromSr, move.fromSc);
          });

          this.game.promotionManager.handleSlidePromotions(() => {
            if (this.game.moveGenerator.isKingInCheck(this.game.toMove)) {
              // Invalid slide promotion - undo the slide
              this.game.board.gap.sr = originalGap.sr;
              this.game.board.gap.sc = originalGap.sc;
              this.game.redraw();
              return;
            }
            // Pass the origin of the slide chain for turn completion
            this.game.finishTurnAfterSlide({ sr, sc, originalGap, slideChain });
          });
        });
      } else if (illegal.some(t => t.sr === sr && t.sc === sc)) {
        const sectionNum = secIndex(sr, sc);
        const reason = `Sliding section ${sectionNum} would put your king in check.`;
        this.game.dialogManager.showIllegalSlideDialog(reason);
      } else {
        // Check if this is a valid origin from our new multi-slide system
        const validOrigins = this.game.moveGenerator.findValidSlideOrigins();
        const isValidOrigin = validOrigins.some(origin => origin.sr === sr && origin.sc === sc);

        if (isValidOrigin) {
          // This is a valid multi-slide origin but it's not in the legal list (must be illegal)
          const sectionNum = secIndex(sr, sc);
          const reason = `Sliding section ${sectionNum} would put your king in check.`;
          this.game.dialogManager.showIllegalSlideDialog(reason);
        } else {
          // Clicked on a section that's not a valid slide origin - switch back to move mode
          this.game.mode = STRINGS.MODE_MOVE;
          this.game.sel = null;
          this.game.selMoves = [];
          this.game.redraw();
        }
      }
    }
  }

  async toggleSound() {
    // Resume audio context on user gesture (required for HTTPS sites like GitHub Pages)
    await this.game.audioManager.resume();
    const isEnabled = this.game.audioManager.toggleSound();
    this.updateSoundToggleButton();
  }

  updateSoundToggleButton() {
    const isEnabled = this.game.audioManager.getSoundEnabled();
    this.soundToggleBtn.textContent = isEnabled ? '🔊 ON' : '🔇 OFF';
    this.soundToggleBtn.title = isEnabled ? 'Click to turn sound off' : 'Click to turn sound on';
  }
}


