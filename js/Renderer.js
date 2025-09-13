import { SIZE, N, SQ, SECTION, getVar, GLYPH, squareToSection, clone, secIndex, SLIDE_ANIMATION_DURATION, FILES } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class Renderer {
  constructor(boardSvg, phaseAbove, phaseBelow, game) {
    this.boardSvg = boardSvg;
    this.phaseAbove = phaseAbove;
    this.phaseBelow = phaseBelow;
    this.game = game; // Store reference to game instance

    // Get gap overlay element
    this.gapOverlay = document.getElementById('gap-overlay');

    // Add hover event listeners to gap overlay
    this.setupGapOverlayEvents();

    // Set initial viewBox
    this.boardSvg.setAttribute('viewBox', '0 0 800 800');

    // Resize SVG to match board-wrap dimensions
    this.resizeSvg();
  }

  setupGapOverlayEvents() {
    if (!this.gapOverlay) return;

    this.gapOverlay.addEventListener('mouseenter', () => {
      this.gapOverlay.classList.add('active');
    });

    this.gapOverlay.addEventListener('mouseleave', () => {
      this.gapOverlay.classList.remove('active');
    });

  }

  positionGapOverlay(game, dynamicSectionSize) {
    if (!this.gapOverlay) return;

    const gapSr = game.board.gap.sr;
    const gapSc = game.board.gap.sc;

    // Position the overlay over the gap section
    this.gapOverlay.style.left = `${gapSc * dynamicSectionSize}px`;
    this.gapOverlay.style.top = `${gapSr * dynamicSectionSize}px`;
    this.gapOverlay.style.width = `${dynamicSectionSize}px`;
    this.gapOverlay.style.height = `${dynamicSectionSize}px`;
  }

  resizeSvg() {
    // Get the actual size of the board-wrap element
    const boardWrap = this.boardSvg.parentElement;
    const rect = boardWrap.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);

    // Update SVG viewBox to match the new size
    this.boardSvg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  }

  drawBoard(game) {
    // Resize SVG if needed and clear any existing elements
    this.resizeSvg();
    this.clearBoardElements();

    // Get the actual SVG size from viewBox
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;
    // Draw board squares
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const { sr, sc } = squareToSection(r, c);
        const light = ((r + c) % 2 === 0);
        const isGap = (sr === game.board.gap.sr && sc === game.board.gap.sc);

        const square = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        square.setAttribute('x', (c * dynamicSQ).toString());
        square.setAttribute('y', (r * dynamicSQ).toString());
        square.setAttribute('width', dynamicSQ.toString());
        square.setAttribute('height', dynamicSQ.toString());
        square.setAttribute('fill', isGap ? getVar('--gap') : (light ? getVar('--light') : getVar('--dark')));
        square.setAttribute('class', isGap ? 'gap-square' : 'board-square');
        this.boardSvg.appendChild(square);
      }
    }

    // Draw grid lines
    for (let i = 1; i < 4; i++) {
      // Vertical lines
      const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      vLine.setAttribute('x1', (i * dynamicSectionSize).toString());
      vLine.setAttribute('y1', '0');
      vLine.setAttribute('x2', (i * dynamicSectionSize).toString());
      vLine.setAttribute('y2', svgSize.toString());
      vLine.setAttribute('stroke', getVar('--grid'));
      vLine.setAttribute('stroke-width', '2');
      vLine.setAttribute('class', 'grid-line');
      this.boardSvg.appendChild(vLine);

      // Horizontal lines
      const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      hLine.setAttribute('x1', '0');
      hLine.setAttribute('y1', (i * dynamicSectionSize).toString());
      hLine.setAttribute('x2', svgSize.toString());
      hLine.setAttribute('y2', (i * dynamicSectionSize).toString());
      hLine.setAttribute('stroke', getVar('--grid'));
      hLine.setAttribute('stroke-width', '2');
      hLine.setAttribute('class', 'grid-line');
      this.boardSvg.appendChild(hLine);
    }

    // Draw rank and file labels
    this.drawRankAndFileLabels(dynamicSQ, svgSize);

    this.drawSectionLabels(game);
    this.drawPieces(game);

    // Draw last move highlight
    if (game.lastMove) {
      const { from, to } = game.lastMove;

      const fromHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fromHighlight.setAttribute('x', (from.c * dynamicSQ).toString());
      fromHighlight.setAttribute('y', (from.r * dynamicSQ).toString());
      fromHighlight.setAttribute('width', dynamicSQ.toString());
      fromHighlight.setAttribute('height', dynamicSQ.toString());
      fromHighlight.setAttribute('fill', 'rgba(72,187,120,.35)');
      fromHighlight.setAttribute('class', 'last-move-highlight');
      this.boardSvg.appendChild(fromHighlight);

      const toHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      toHighlight.setAttribute('x', (to.c * dynamicSQ).toString());
      toHighlight.setAttribute('y', (to.r * dynamicSQ).toString());
      toHighlight.setAttribute('width', dynamicSQ.toString());
      toHighlight.setAttribute('height', dynamicSQ.toString());
      toHighlight.setAttribute('fill', 'rgba(72,187,120,.35)');
      toHighlight.setAttribute('class', 'last-move-highlight');
      this.boardSvg.appendChild(toHighlight);
    }

    // Draw check highlight
    if (game.check) {
      const { r, c } = game.check;
      const checkHighlight = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      checkHighlight.setAttribute('x', (c * dynamicSQ).toString());
      checkHighlight.setAttribute('y', (r * dynamicSQ).toString());
      checkHighlight.setAttribute('width', dynamicSQ.toString());
      checkHighlight.setAttribute('height', dynamicSQ.toString());
      checkHighlight.setAttribute('fill', 'rgba(229,62,62,.45)');
      checkHighlight.setAttribute('class', 'check-highlight');
      this.boardSvg.appendChild(checkHighlight);
    }

    // Draw selection highlight
    if (game.sel) {
      const selBorder = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      selBorder.setAttribute('x', (game.sel.c * dynamicSQ + 2).toString());
      selBorder.setAttribute('y', (game.sel.r * dynamicSQ + 2).toString());
      selBorder.setAttribute('width', (dynamicSQ - 4).toString());
      selBorder.setAttribute('height', (dynamicSQ - 4).toString());
      selBorder.setAttribute('fill', 'none');
      selBorder.setAttribute('stroke', getVar('--accent'));
      selBorder.setAttribute('stroke-width', '4');
      selBorder.setAttribute('class', 'selection-highlight');
      this.boardSvg.appendChild(selBorder);

      // Draw legal move indicators
      for (const m of game.selMoves) {
        const moveIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        moveIndicator.setAttribute('x', (m.c * dynamicSQ + 6).toString());
        moveIndicator.setAttribute('y', (m.r * dynamicSQ + 6).toString());
        moveIndicator.setAttribute('width', (dynamicSQ - 12).toString());
        moveIndicator.setAttribute('height', (dynamicSQ - 12).toString());
        moveIndicator.setAttribute('fill', 'rgba(99,179,237,.35)');
        moveIndicator.setAttribute('class', 'legal-move-indicator');
        this.boardSvg.appendChild(moveIndicator);
      }
    }

    // Draw slide indicators
    if (game.mode === 'slide' && !game.winner && !game.draw && !game.isLocked()) {
      const { legal, illegal } = game.moveGenerator.legalSlideTargets();

      // Get all valid origins (including those up to 3 steps away)
      const allValidOrigins = game.moveGenerator.findValidSlideOrigins();

      // Create a map for quick lookup of legal/illegal status
      const originStatus = new Map();
      legal.forEach(({ sr, sc }) => originStatus.set(`${sr},${sc}`, 'legal'));
      illegal.forEach(({ sr, sc }) => originStatus.set(`${sr},${sc}`, 'illegal'));

      // Draw indicators for all valid origins
      allValidOrigins.forEach(({ sr, sc }) => {
        const status = originStatus.get(`${sr},${sc}`) || 'illegal'; // Default to illegal if not found
        const isLegal = status === 'legal';

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (sc * dynamicSectionSize + 6).toString());
        rect.setAttribute('y', (sr * dynamicSectionSize + 6).toString());
        rect.setAttribute('width', (dynamicSectionSize - 12).toString());
        rect.setAttribute('height', (dynamicSectionSize - 12).toString());
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', isLegal ? getVar('--accent') : getVar('--danger'));
        rect.setAttribute('stroke-width', '4');
        rect.setAttribute('stroke-dasharray', '10 8');
        rect.setAttribute('pointer-events', 'none');
        rect.classList.add('slide-indicator');
        this.boardSvg.appendChild(rect);

        // Add arrow or X symbol
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', ((sc + 0.5) * dynamicSectionSize).toString());
        text.setAttribute('y', ((sr + 0.5) * dynamicSectionSize).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', (dynamicSQ * 1.2).toString());
        text.setAttribute('fill', isLegal ? getVar('--accent') : getVar('--danger'));
        text.setAttribute('opacity', '0.5');
        text.setAttribute('pointer-events', 'none');
        text.classList.add('slide-indicator');

        if (isLegal) {
          // Show arrow indicating direction toward gap
          const d_sr = game.board.gap.sr - sr;
          const d_sc = game.board.gap.sc - sc;
          let arrow = '';
          if (d_sr > 0) arrow = '↓';
          else if (d_sr < 0) arrow = '↑';
          else if (d_sc > 0) arrow = '→';
          else if (d_sc < 0) arrow = '←';
          text.textContent = arrow;
        } else {
          // Show X for illegal moves
          text.textContent = '✗';
        }

        this.boardSvg.appendChild(text);
      });
    }

    // Position the gap overlay
    this.positionGapOverlay(game, dynamicSectionSize);
  }

  drawPieces(game) {
    // Clear non-permanent elements (pieces, highlights, etc.) but keep board squares, grid lines, and labels
    const children = Array.from(this.boardSvg.children);
    children.forEach(child => {
      // Keep board squares, grid lines, rank/file labels, section labels, slide indicators, selection highlights, and legal move indicators
      if (!(child.classList.contains('board-square') ||
            child.classList.contains('grid-line') ||
            child.classList.contains('rank-label') ||
            child.classList.contains('file-label') ||
            child.classList.contains('section-label') ||
            child.classList.contains('selection-highlight') ||
            child.classList.contains('legal-move-indicator') ||
            (child.classList.contains('slide-indicator') && game.mode === 'slide'))) {
        this.boardSvg.removeChild(child);
      }
    });

    // Get SVG size for dynamic calculations
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const { sr, sc } = squareToSection(r, c);
        if (sr === game.board.gap.sr && sc === game.board.gap.sc) continue;
        const p = game.board.pieceAt({ r, c });
        if (!p) continue;
        const x = c * dynamicSQ + dynamicSQ / 2;
        const y = r * dynamicSQ + dynamicSQ / 2;

        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x.toString());
        text.setAttribute('y', y.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', String(dynamicSQ * 0.78));
        text.setAttribute('pointer-events', 'none');
        text.setAttribute('stroke', 'black');
        text.setAttribute('stroke-width', '.3');
        text.setAttribute('stroke-linecap', 'round');
        text.classList.add(p.c === 'w' ? 'whiteGlyph' : 'blackGlyph');
        text.textContent = GLYPH[p.c][p.t];

        // Rotate checkmated king 90 degrees to the left
        if (game.winner && p.t === 'k' && p.c !== game.winner) {
          text.setAttribute('transform', `rotate(-90 ${x} ${y})`);
        }

        this.boardSvg.appendChild(text);
      }
    }
  }

  setPhaseText(game) {
    // Handle game end states first
    if (game.winner) {
      const text = game.winner === 'w' ? STRINGS.GAME_STATE_CHECKMATE_WHITE_WINS : STRINGS.GAME_STATE_CHECKMATE_BLACK_WINS;

      // Show winner message in both phase displays
      this.phaseAbove.textContent = text;
      this.phaseBelow.textContent = text;
      this.phaseAbove.classList.add('active');
      this.phaseBelow.classList.add('active');
      return;
    }

    if (game.draw) {
      // Show simple "Draw" message in both phase displays
      this.phaseAbove.textContent = 'Draw';
      this.phaseBelow.textContent = 'Draw';
      this.phaseAbove.classList.add('active');
      this.phaseBelow.classList.add('active');
      return;
    }

    // Handle check state
    if (game.check) {
      const text = game.toMove === 'w' ? STRINGS.GAME_STATE_CHECK_WHITE_TO_MOVE : STRINGS.GAME_STATE_CHECK_BLACK_TO_MOVE;

      // Remove active class from both phase elements
      this.phaseAbove.classList.remove('active');
      this.phaseBelow.classList.remove('active');

      // Add active class to the appropriate phase element based on whose turn it is
      if (game.toMove === 'w') {
        this.phaseBelow.textContent = text;
        this.phaseBelow.classList.add('active');
      } else {
        this.phaseAbove.textContent = text;
        this.phaseAbove.classList.add('active');
      }
      return;
    }

    // Normal game state
    const turn = game.toMove === 'w' ? 'White' : 'Black';
    const action = game.mode === 'move' ? 'move' : 'slide';
    const text = `${turn} to ${action}`;

    // Remove active class from both phase elements
    this.phaseAbove.classList.remove('active');
    this.phaseBelow.classList.remove('active');

    // Add active class to the appropriate phase element based on whose turn it is
    if (game.toMove === 'w') {
      // White's turn - show below the board
      this.phaseBelow.textContent = text;
      this.phaseBelow.classList.add('active');
    } else {
      // Black's turn - show above the board
      this.phaseAbove.textContent = text;
      this.phaseAbove.classList.add('active');
    }
  }

  clearBoardElements() {
    // Clear all elements except those that are permanent (will be re-drawn)
    const children = Array.from(this.boardSvg.children);
    children.forEach(child => {
      // Keep only the permanent board structure elements
      if (!(child.classList.contains('grid-line') ||
            child.classList.contains('rank-label') ||
            child.classList.contains('file-label'))) {
        this.boardSvg.removeChild(child);
      }
    });
  }

  clearSlideIndicators() {
    // Remove all slide indicator elements from the SVG
    const slideIndicators = this.boardSvg.querySelectorAll('.slide-indicator');
    slideIndicators.forEach(indicator => {
      this.boardSvg.removeChild(indicator);
    });
  }

  drawSectionLabels(game) {
    // Clear any existing section labels first
    const existingLabels = this.boardSvg.querySelectorAll('.section-label');
    existingLabels.forEach(label => this.boardSvg.removeChild(label));

    // Draw section number label only for the gap section, centered
    const sr = game.board.gap.sr;
    const sc = game.board.gap.sc;

    const sectionNum = secIndex(sr, sc);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    // Get SVG size for dynamic calculations
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    // Center the label within the section
    const centerX = sc * dynamicSectionSize + dynamicSectionSize / 2;
    const centerY = sr * dynamicSectionSize + dynamicSectionSize / 2;

    label.setAttribute('x', centerX.toString());
    label.setAttribute('y', centerY.toString());
    label.setAttribute('class', 'section-label');
    label.setAttribute('font-size', '14');
    label.setAttribute('font-weight', '700');
    label.setAttribute('fill', 'var(--uiText)');
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('dominant-baseline', 'central');
    label.textContent = sectionNum.toString();
    this.boardSvg.appendChild(label);
  }

  animateSlide(sr, sc, callback) {
    // For single section slides, use the original logic but delegate to multi-slide
    const slideChain = this.game.moveGenerator.determineSlideChain(sr, sc);
    this.animateMultiSlide(slideChain, callback);
  }

  animateMultiSlide(slideChain, callback) {
    // Set sliding state
    this.game.isSliding = true;

    // Play slide sound
    this.game.audioManager.playSlide();

    // Get SVG dimensions for dynamic calculations
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    // Hide the original board squares in all sliding sections to prevent overlap
    const sectionsToHide = new Set();
    slideChain.forEach(move => {
      sectionsToHide.add(`${move.fromSr},${move.fromSc}`);
    });
    sectionsToHide.forEach(sectionKey => {
      const [sr, sc] = sectionKey.split(',').map(Number);
      this.hideSectionSquares(sr, sc);
    });

    // Clear any existing slide indicators and old SVG pieces in the sections being animated
    this.clearSlideIndicators();
    slideChain.forEach(move => {
      this.clearSectionPieces(move.fromSr, move.fromSc);
    });

    // Draw animation section labels for all moving sections
    this.drawAnimationSectionLabelsForChain(slideChain);

    // Create animated elements for all sections in the chain
    const animatedElements = [];

    // Process each section in the chain
    slideChain.forEach(move => {
      const { fromSr, fromSc, toSr, toSc } = move;

      // Calculate movement vector for this section
      const deltaX = (toSc - fromSc) * dynamicSectionSize;
      const deltaY = (toSr - fromSr) * dynamicSectionSize;

      // Create animated squares for the entire section
      for (let r = fromSr * SECTION; r < (fromSr + 1) * SECTION; r++) {
        for (let c = fromSc * SECTION; c < (fromSc + 1) * SECTION; c++) {
          // Calculate square position on screen
          const squareX = c * dynamicSQ;
          const squareY = r * dynamicSQ;

          // Create animated square element (only for non-gap squares)
          const { sr: squareSr, sc: squareSc } = squareToSection(r, c);
          if (!(squareSr === this.game.board.gap.sr && squareSc === this.game.board.gap.sc)) {
            const light = ((r + c) % 2 === 0);
            const animatedSquare = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            animatedSquare.setAttribute('x', squareX.toString());
            animatedSquare.setAttribute('y', squareY.toString());
            animatedSquare.setAttribute('width', dynamicSQ.toString());
            animatedSquare.setAttribute('height', dynamicSQ.toString());
            animatedSquare.setAttribute('fill', light ? getVar('--light') : getVar('--dark'));
            animatedSquare.setAttribute('stroke', getVar('--grid'));
            animatedSquare.setAttribute('stroke-width', '1');
            animatedSquare.setAttribute('pointer-events', 'none');

            animatedElements.push({
              element: animatedSquare,
              startX: squareX,
              startY: squareY,
              endX: squareX + deltaX,
              endY: squareY + deltaY
            });

            this.boardSvg.appendChild(animatedSquare);
          }
        }
      }

      // Create animated pieces for the section
      for (let r = fromSr * SECTION; r < (fromSr + 1) * SECTION; r++) {
        for (let c = fromSc * SECTION; c < (fromSc + 1) * SECTION; c++) {
          const piece = this.game.board.pieceAt({ r, c });
          if (piece) {
            // Calculate piece position on screen
            const pieceX = c * dynamicSQ + dynamicSQ / 2;
            const pieceY = r * dynamicSQ + dynamicSQ / 2;

            // Create animated piece element
            const animatedPiece = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            animatedPiece.setAttribute('x', pieceX.toString());
            animatedPiece.setAttribute('y', pieceY.toString());
            animatedPiece.setAttribute('text-anchor', 'middle');
            animatedPiece.setAttribute('dominant-baseline', 'central');
            animatedPiece.setAttribute('font-size', String(dynamicSQ * 0.78));
            animatedPiece.setAttribute('pointer-events', 'none');
            animatedPiece.setAttribute('stroke', 'black');
            animatedPiece.setAttribute('stroke-width', '.3');
            animatedPiece.setAttribute('stroke-linecap', 'round');
            animatedPiece.setAttribute('class', piece.c === 'w' ? 'whiteGlyph' : 'blackGlyph');
            animatedPiece.textContent = GLYPH[piece.c][piece.t];

            animatedElements.push({
              element: animatedPiece,
              startX: pieceX,
              startY: pieceY,
              endX: pieceX + deltaX,
              endY: pieceY + deltaY
            });

            this.boardSvg.appendChild(animatedPiece);
          }
        }
      }
    });

    // Start animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SLIDE_ANIMATION_DURATION, 1);

      // Use easing function for smooth animation
      const easedProgress = this.easeInOutQuad(progress);

      // Update position of each animated element
      animatedElements.forEach(({ element, startX, startY, endX, endY }) => {
        const currentX = startX + (endX - startX) * easedProgress;
        const currentY = startY + (endY - startY) * easedProgress;
        element.setAttribute('x', currentX.toString());
        element.setAttribute('y', currentY.toString());
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Animation complete

        // Clear sliding state first
        this.game.isSliding = false;

        // Remove animated elements
        animatedElements.forEach(({ element }) => {
          if (element.parentNode) {
            this.boardSvg.removeChild(element);
          }
        });

        // Restore normal section labels after animation
        this.drawSectionLabels(this.game);

        // Call callback to update board state and redraw
        if (callback) {
          callback();
        }
      }
    };

    // Start the animation
    if (animatedElements.length > 0) {
      requestAnimationFrame(animate);
    } else {
      // No pieces to animate, just call callback
      this.game.isSliding = false;
      if (callback) {
        callback();
      }
    }
  }

  drawAnimationSectionLabelsForChain(slideChain) {
    // Clear any existing section labels first
    const existingLabels = this.boardSvg.querySelectorAll('.section-label');
    existingLabels.forEach(label => this.boardSvg.removeChild(label));

    // Get SVG dimensions for dynamic calculations
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    // Draw current gap section label (the one being covered)
    const currentGapSr = this.game.board.gap.sr;
    const currentGapSc = this.game.board.gap.sc;
    const currentSectionNum = secIndex(currentGapSr, currentGapSc);
    const currentLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    const currentCenterX = currentGapSc * dynamicSectionSize + dynamicSectionSize / 2;
    const currentCenterY = currentGapSr * dynamicSectionSize + dynamicSectionSize / 2;

    currentLabel.setAttribute('x', currentCenterX.toString());
    currentLabel.setAttribute('y', currentCenterY.toString());
    currentLabel.setAttribute('class', 'section-label');
    currentLabel.setAttribute('font-size', '14');
    currentLabel.setAttribute('font-weight', '700');
    currentLabel.setAttribute('fill', 'var(--uiText)');
    currentLabel.setAttribute('text-anchor', 'middle');
    currentLabel.setAttribute('dominant-baseline', 'central');
    currentLabel.textContent = currentSectionNum.toString();
    this.boardSvg.appendChild(currentLabel);

    // Draw target gap section label (the position of the first section in the chain)
    const firstMove = slideChain[0];
    const targetGapSr = firstMove.fromSr;
    const targetGapSc = firstMove.fromSc;
    const targetSectionNum = secIndex(targetGapSr, targetGapSc);
    const targetLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    const targetCenterX = targetGapSc * dynamicSectionSize + dynamicSectionSize / 2;
    const targetCenterY = targetGapSr * dynamicSectionSize + dynamicSectionSize / 2;

    targetLabel.setAttribute('x', targetCenterX.toString());
    targetLabel.setAttribute('y', targetCenterY.toString());
    targetLabel.setAttribute('class', 'section-label');
    targetLabel.setAttribute('font-size', '14');
    targetLabel.setAttribute('font-weight', '700');
    targetLabel.setAttribute('fill', 'var(--uiText)');
    targetLabel.setAttribute('text-anchor', 'middle');
    targetLabel.setAttribute('dominant-baseline', 'central');
    targetLabel.textContent = targetSectionNum.toString();
    this.boardSvg.appendChild(targetLabel);
  }

  drawAnimationSectionLabels(sr, sc) {
    // For backward compatibility, create a single-move chain and delegate
    const slideChain = [{ fromSr: sr, fromSc: sc, toSr: this.game.board.gap.sr, toSc: this.game.board.gap.sc }];
    this.drawAnimationSectionLabelsForChain(slideChain);
  }

  // Hide board squares in a specific section to prevent overlap during animation
  hideSectionSquares(sr, sc) {
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;

    // Find and hide all board squares in the section
    const squares = this.boardSvg.querySelectorAll('.board-square');
    squares.forEach(square => {
      const x = parseFloat(square.getAttribute('x'));
      const y = parseFloat(square.getAttribute('y'));
      const squareSr = Math.floor(y / (SECTION * dynamicSQ));
      const squareSc = Math.floor(x / (SECTION * dynamicSQ));

      if (squareSr === sr && squareSc === sc) {
        square.style.display = 'none';
      }
    });
  }

  // Clear SVG pieces only in the specific section being animated
  clearSectionPieces(sr, sc) {
    const viewBox = this.boardSvg.getAttribute('viewBox').split(' ');
    const svgSize = parseInt(viewBox[2]);
    const dynamicSQ = svgSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    const children = Array.from(this.boardSvg.children);
    children.forEach(child => {
      // Only remove pieces that are in the section being animated
      if (child.classList.contains('whiteGlyph') || child.classList.contains('blackGlyph')) {
        // Calculate which section this piece is in
        const pieceX = parseFloat(child.getAttribute('x')) - dynamicSQ / 2; // Adjust for centering
        const pieceY = parseFloat(child.getAttribute('y')) - dynamicSQ / 2; // Adjust for centering
        const pieceSr = Math.floor(pieceY / dynamicSectionSize);
        const pieceSc = Math.floor(pieceX / dynamicSectionSize);

        // Only remove pieces in the section being animated
        if (pieceSr === sr && pieceSc === sc) {
          this.boardSvg.removeChild(child);
        }
      }
      // Also remove checkmate flags and other non-essential elements in the section
      else if (child.tagName === 'path' ||
               (child.tagName === 'rect' &&
                !child.classList.contains('section-label') &&
                !child.classList.contains('slide-indicator') &&
                !child.classList.contains('board-square') &&
                !child.classList.contains('grid-line') &&
                !child.classList.contains('rank-label') &&
                !child.classList.contains('file-label'))) {
        // For non-piece elements, we can't easily determine their section, so remove them all
        // This is safer than leaving potential conflicts
        this.boardSvg.removeChild(child);
      }
    });
  }

  // Easing function for smooth animation
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  drawRankAndFileLabels(dynamicSQ, svgSize) {
    const fontSize = Math.max(10, dynamicSQ * 0.18);

    // Draw rank numbers (8-1) on the leftmost column (file a, c=0)
    // Position in top-left corner of each square, moved down a bit
    for (let r = 0; r < N; r++) {
      const rankNumber = (8 - r).toString();
      const x = 0 * dynamicSQ + dynamicSQ * 0.15; // 15% from left edge
      const y = r * dynamicSQ + dynamicSQ * 0.25; // 25% from top edge (moved down)

      const rankLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      rankLabel.setAttribute('x', x.toString());
      rankLabel.setAttribute('y', y.toString());
      rankLabel.setAttribute('font-size', `${fontSize}px`);
      rankLabel.setAttribute('font-family', 'Arial');
      rankLabel.setAttribute('fill', getVar('--accent'));
      rankLabel.setAttribute('text-anchor', 'middle');
      rankLabel.setAttribute('dominant-baseline', 'central');
      rankLabel.setAttribute('class', 'rank-label');
      rankLabel.textContent = rankNumber;
      this.boardSvg.appendChild(rankLabel);
    }

    // Draw file letters (a-h) on the bottom rank (rank 1, r=7)
    // Position in bottom-right corner of each square
    for (let c = 0; c < N; c++) {
      const fileLetter = FILES[c];
      const x = c * dynamicSQ + dynamicSQ * 0.85; // 85% from left edge (15% from right)
      const y = 7 * dynamicSQ + dynamicSQ * 0.85; // 85% from top edge (15% from bottom)

      const fileLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      fileLabel.setAttribute('x', x.toString());
      fileLabel.setAttribute('y', y.toString());
      fileLabel.setAttribute('font-size', `${fontSize}px`);
      fileLabel.setAttribute('font-family', 'Arial');
      fileLabel.setAttribute('fill', getVar('--accent'));
      fileLabel.setAttribute('text-anchor', 'middle');
      fileLabel.setAttribute('dominant-baseline', 'central');
      fileLabel.setAttribute('class', 'file-label');
      fileLabel.textContent = fileLetter;
      this.boardSvg.appendChild(fileLabel);
    }
  }

}