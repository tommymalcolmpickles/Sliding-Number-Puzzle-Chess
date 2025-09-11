import { SIZE, N, SQ, SECTION, getVar, GLYPH, squareToSection, clone, secIndex, SLIDE_ANIMATION_DURATION, FILES } from './Constants.js';
import { STRINGS } from './Strings.js';

export default class Renderer {
  constructor(canvas, overlay, phaseAbove, phaseBelow, game) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.phaseAbove = phaseAbove;
    this.phaseBelow = phaseBelow;
    this.game = game; // Store reference to game instance

    // Get gap overlay element
    this.gapOverlay = document.getElementById('gap-overlay');

    // Add hover event listeners to gap overlay
    this.setupGapOverlayEvents();

    // Resize canvas to match board-wrap dimensions
    this.resizeCanvas();

    // Ensure SVG viewBox is set initially
    if (!this.overlay.hasAttribute('viewBox')) {
      this.overlay.setAttribute('viewBox', `0 0 ${this.canvas.width} ${this.canvas.height}`);
    }
  }

  setupGapOverlayEvents() {
    if (!this.gapOverlay) return;

    this.gapOverlay.addEventListener('mouseenter', () => {
      this.gapOverlay.classList.add('active');
    });

    this.gapOverlay.addEventListener('mouseleave', () => {
      this.gapOverlay.classList.remove('active');
    });

    this.gapOverlay.addEventListener('click', () => {
      // Use the stored game reference to toggle mode
      if (this.game) {
        this.game.mode = this.game.mode === STRINGS.MODE_MOVE ? STRINGS.MODE_SLIDE : STRINGS.MODE_MOVE;
        this.game.sel = null;
        this.game.selMoves = [];
        this.game.redraw();
      }
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

  resizeCanvas() {
    // Get the actual size of the board-wrap element
    const boardWrap = this.canvas.parentElement;
    const rect = boardWrap.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);

    // Set canvas size if it has changed
    if (this.canvas.width !== size || this.canvas.height !== size) {
      console.log(`Resizing canvas from ${this.canvas.width}x${this.canvas.height} to ${size}x${size}`);
      this.canvas.width = size;
      this.canvas.height = size;

      // Update SVG overlay to match - remove width/height attributes to let CSS handle sizing
      this.overlay.removeAttribute('width');
      this.overlay.removeAttribute('height');
      this.overlay.setAttribute('viewBox', `0 0 ${size} ${size}`);
      console.log(`SVG viewBox set to: 0 0 ${size} ${size}`);
    }
  }

  drawBoard(game) {
    // Resize canvas if needed and clear any existing slide indicators
    this.resizeCanvas();
    this.clearSlideIndicators();

    // Get the actual canvas size
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    this.ctx.clearRect(0, 0, canvasSize, canvasSize);
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const { sr, sc } = squareToSection(r, c);
        if (sr === game.board.gap.sr && sc === game.board.gap.sc) continue;
        const light = ((r + c) % 2 === 0);
        this.ctx.fillStyle = light ? getVar('--light') : getVar('--dark');
        this.ctx.fillRect(c * dynamicSQ, r * dynamicSQ, dynamicSQ, dynamicSQ);
      }
    }
    this.ctx.strokeStyle = getVar('--grid');
    this.ctx.lineWidth = 2;
    for (let i = 1; i < 4; i++) {
      this.ctx.beginPath(); this.ctx.moveTo(i * dynamicSectionSize, 0); this.ctx.lineTo(i * dynamicSectionSize, canvasSize); this.ctx.stroke();
      this.ctx.beginPath(); this.ctx.moveTo(0, i * dynamicSectionSize); this.ctx.lineTo(canvasSize, i * dynamicSectionSize); this.ctx.stroke();
    }

    // Draw rank and file labels
    this.drawRankAndFileLabels(dynamicSQ);
    if (game.lastMove) {
      this.ctx.fillStyle = 'rgba(72,187,120,.35)';
      const { from, to } = game.lastMove;
      this.ctx.fillRect(from.c * dynamicSQ, from.r * dynamicSQ, dynamicSQ, dynamicSQ);
      this.ctx.fillRect(to.c * dynamicSQ, to.r * dynamicSQ, dynamicSQ, dynamicSQ);
    }
    if (game.check) {
      this.ctx.fillStyle = 'rgba(229,62,62,.45)';
      const { r, c } = game.check;
      this.ctx.fillRect(c * dynamicSQ, r * dynamicSQ, dynamicSQ, dynamicSQ);
    }
    if (game.sel) {
      this.ctx.strokeStyle = getVar('--accent');
      this.ctx.lineWidth = 4;
      this.ctx.strokeRect(game.sel.c * dynamicSQ + 2, game.sel.r * dynamicSQ + 2, dynamicSQ - 4, dynamicSQ - 4);
      this.ctx.fillStyle = 'rgba(99,179,237,.35)';
      for (const m of game.selMoves) {
        this.ctx.fillRect(m.c * dynamicSQ + 6, m.r * dynamicSQ + 6, dynamicSQ - 12, dynamicSQ - 12);
      }
    }

    // Draw slide indicators first, before clearing overlay for pieces
    if (game.mode === 'slide' && !game.winner && !game.draw && !game.isLocked()) {
      const { legal, illegal } = game.moveGenerator.legalSlideTargets();
      legal.forEach(({ sr, sc }) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (sc * dynamicSectionSize + 6).toString());
        rect.setAttribute('y', (sr * dynamicSectionSize + 6).toString());
        rect.setAttribute('width', (dynamicSectionSize - 12).toString());
        rect.setAttribute('height', (dynamicSectionSize - 12).toString());
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', getVar('--accent'));
        rect.setAttribute('stroke-width', '4');
        rect.setAttribute('stroke-dasharray', '10 8');
        rect.setAttribute('pointer-events', 'none');
        rect.classList.add('slide-indicator');
        this.overlay.appendChild(rect);
        const d_sr = game.board.gap.sr - sr;
        const d_sc = game.board.gap.sc - sc;
        let arrow = '';
        if (d_sr > 0) arrow = '↓';
        else if (d_sr < 0) arrow = '↑';
        else if (d_sc > 0) arrow = '→';
        else if (d_sc < 0) arrow = '←';
        if (arrow) {
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', ((sc + 0.5) * dynamicSectionSize).toString());
          text.setAttribute('y', ((sr + 0.5) * dynamicSectionSize).toString());
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'central');
          text.setAttribute('font-size', (dynamicSQ * 1.2).toString());
          text.setAttribute('fill', getVar('--accent'));
          text.setAttribute('opacity', '0.5');
          text.setAttribute('pointer-events', 'none');
          text.classList.add('slide-indicator');
          text.textContent = arrow;
          this.overlay.appendChild(text);
        }
      });
      illegal.forEach(({ sr, sc }) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', (sc * dynamicSectionSize + 6).toString());
        rect.setAttribute('y', (sr * dynamicSectionSize + 6).toString());
        rect.setAttribute('width', (dynamicSectionSize - 12).toString());
        rect.setAttribute('height', (dynamicSectionSize - 12).toString());
        rect.setAttribute('fill', 'none');
        rect.setAttribute('stroke', getVar('--danger'));
        rect.setAttribute('stroke-width', '4');
        rect.setAttribute('stroke-dasharray', '10 8');
        rect.setAttribute('pointer-events', 'none');
        rect.classList.add('slide-indicator');
        this.overlay.appendChild(rect);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', ((sc + 0.5) * dynamicSectionSize).toString());
        text.setAttribute('y', ((sr + 0.5) * dynamicSectionSize).toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'central');
        text.setAttribute('font-size', (dynamicSQ * 1.2).toString());
        text.setAttribute('fill', getVar('--danger'));
        text.setAttribute('opacity', '0.5');
        text.setAttribute('pointer-events', 'none');
        text.classList.add('slide-indicator');
        text.textContent = '✗';
        this.overlay.appendChild(text);
      });
    }

    this.drawSectionLabels(game);
    this.drawPieces(game);

    // Position the gap overlay
    this.positionGapOverlay(game, dynamicSectionSize);
  }

  drawPieces(game) {
    console.log(`Drawing pieces with canvas size: ${this.canvas.width}x${this.canvas.height}`);

    // Clear elements based on current mode
    const children = Array.from(this.overlay.children);
    children.forEach(child => {
      // Keep slide indicators only if we're in slide mode, and always keep section labels
      if (!(child.classList.contains('slide-indicator') && game.mode === 'slide') &&
          !child.classList.contains('section-label')) {
        this.overlay.removeChild(child);
      }
    });

    // Get canvas size for dynamic calculations
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
    console.log(`Dynamic square size: ${dynamicSQ}`);

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const { sr, sc } = squareToSection(r, c);
        if (sr === game.board.gap.sr && sc === game.board.gap.sc) continue;
        const p = game.board.pieceAt({ r, c });
        if (!p) continue;
        const x = c * dynamicSQ + dynamicSQ / 2;
        const y = r * dynamicSQ + dynamicSQ / 2;
        console.log(`Creating piece ${GLYPH[p.c][p.t]} at (${x}, ${y})`);

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
        this.overlay.appendChild(text);
        if (game.winner && p.t === 'k' && p.c === game.winner) {
          const flag = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          const x = c * dynamicSQ + dynamicSQ * 0.75;
          const y = r * dynamicSQ + dynamicSQ * 0.2;
          flag.setAttribute('d', `M ${x} ${y} l 0 26 l 18 -7 l -18 -7 Z`);
          flag.setAttribute('fill', '#f6e05e');
          this.overlay.appendChild(flag);
        }
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

  clearSlideIndicators() {
    // Remove all slide indicator elements from the overlay
    const slideIndicators = this.overlay.querySelectorAll('.slide-indicator');
    slideIndicators.forEach(indicator => {
      this.overlay.removeChild(indicator);
    });
  }

  drawSectionLabels(game) {
    // Clear any existing section labels first
    const existingLabels = this.overlay.querySelectorAll('.section-label');
    existingLabels.forEach(label => this.overlay.removeChild(label));

    // Draw section number label only for the gap section, centered
    const sr = game.board.gap.sr;
    const sc = game.board.gap.sc;

    const sectionNum = secIndex(sr, sc);
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');

    // Get canvas size for dynamic calculations
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
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
    this.overlay.appendChild(label);
  }

  animateSlide(sr, sc, callback) {
    console.log(`Animating slide of section (${sr}, ${sc})`);

    // Set sliding state
    this.game.isSliding = true;

    // Play slide sound
    this.game.audioManager.playSlide();

    // Get canvas dimensions for dynamic calculations
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    // Calculate movement vector (from section position to gap position)
    const deltaX = (this.game.board.gap.sc - sc) * dynamicSectionSize;
    const deltaY = (this.game.board.gap.sr - sr) * dynamicSectionSize;

    console.log(`Animation: moving section (${sr}, ${sc}) by (${deltaX}, ${deltaY})`);

    // Clear the original board squares in the sliding section to prevent overlap
    this.clearSectionOnCanvas(sr, sc);

    // Clear any existing slide indicators and old SVG pieces in the section being animated
    this.clearSlideIndicators();
    this.clearSectionPieces(sr, sc);

    // Draw both current and target section labels for animation
    this.drawAnimationSectionLabels(sr, sc);

    // Create animated elements for board squares and pieces in the section
    const animatedElements = [];

    // First, create animated squares for the entire section
    for (let r = sr * SECTION; r < (sr + 1) * SECTION; r++) {
      for (let c = sc * SECTION; c < (sc + 1) * SECTION; c++) {
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

          this.overlay.appendChild(animatedSquare);
        }
      }
    }

    // Then, create animated pieces for the section
    for (let r = sr * SECTION; r < (sr + 1) * SECTION; r++) {
      for (let c = sc * SECTION; c < (sc + 1) * SECTION; c++) {
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

          this.overlay.appendChild(animatedPiece);
        }
      }
    }

    console.log(`Created ${animatedElements.length} animated elements (squares + pieces)`);

    // Start animation
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / SLIDE_ANIMATION_DURATION, 1);

      // Use easing function for smooth animation
      const easedProgress = this.easeInOutQuad(progress);

      // Update position of each animated piece
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
        console.log('Slide animation completed');

        // Clear sliding state first
        this.game.isSliding = false;

        // Remove animated elements
        animatedElements.forEach(({ element }) => {
          if (element.parentNode) {
            this.overlay.removeChild(element);
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
      console.log('No pieces to animate, skipping animation');
      this.game.isSliding = false;
      if (callback) {
        callback();
      }
    }
  }

  drawAnimationSectionLabels(sr, sc) {
    // Clear any existing section labels first
    const existingLabels = this.overlay.querySelectorAll('.section-label');
    existingLabels.forEach(label => this.overlay.removeChild(label));

    // Get canvas dimensions for dynamic calculations
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
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
    this.overlay.appendChild(currentLabel);

    // Draw target gap section label (the one being revealed)
    const targetGapSr = sr; // The section being moved
    const targetGapSc = sc; // The section being moved
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
    this.overlay.appendChild(targetLabel);
  }

  // Clear a specific section on the canvas to prevent overlap during animation
  clearSectionOnCanvas(sr, sc) {
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    // Calculate the section bounds
    const sectionX = sc * dynamicSectionSize;
    const sectionY = sr * dynamicSectionSize;

    // Clear the section area on the canvas
    this.ctx.clearRect(sectionX, sectionY, dynamicSectionSize, dynamicSectionSize);

    console.log(`Cleared canvas section (${sr}, ${sc}) at (${sectionX}, ${sectionY})`);
  }

  // Clear SVG pieces only in the specific section being animated
  clearSectionPieces(sr, sc) {
    const canvasSize = this.canvas.width;
    const dynamicSQ = canvasSize / N;
    const dynamicSectionSize = SECTION * dynamicSQ;

    const children = Array.from(this.overlay.children);
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
          this.overlay.removeChild(child);
        }
      }
      // Also remove checkmate flags and other non-essential elements in the section
      else if (child.tagName === 'path' ||
               (child.tagName === 'rect' &&
                !child.classList.contains('section-label') &&
                !child.classList.contains('slide-indicator'))) {
        // For non-piece elements, we can't easily determine their section, so remove them all
        // This is safer than leaving potential conflicts
        this.overlay.removeChild(child);
      }
    });
    console.log(`Cleared SVG pieces only in section (${sr}, ${sc})`);
  }

  // Easing function for smooth animation
  easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }

  drawRankAndFileLabels(dynamicSQ) {
    // Set up text styling
    this.ctx.fillStyle = getVar('--accent');
    this.ctx.font = `${Math.max(10, dynamicSQ * 0.18)}px Arial`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Draw rank numbers (8-1) on the leftmost column (file a, c=0)
    // Position in top-left corner of each square, moved down a bit
    for (let r = 0; r < N; r++) {
      const rankNumber = (8 - r).toString();
      const x = 0 * dynamicSQ + dynamicSQ * 0.15; // 15% from left edge
      const y = r * dynamicSQ + dynamicSQ * 0.25; // 25% from top edge (moved down)
      this.ctx.fillText(rankNumber, x, y);
    }

    // Draw file letters (a-h) on the bottom rank (rank 1, r=7)
    // Position in bottom-right corner of each square
    for (let c = 0; c < N; c++) {
      const fileLetter = FILES[c];
      const x = c * dynamicSQ + dynamicSQ * 0.85; // 85% from left edge (15% from right)
      const y = 7 * dynamicSQ + dynamicSQ * 0.85; // 85% from top edge (15% from bottom)
      this.ctx.fillText(fileLetter, x, y);
    }
  }

}