import { ordinal } from './Constants.js';

export default class DialogManager {
  constructor(game, elements) {
    this.game = game;
    this.drawDlg = elements.drawDlg;
    this.drawReasons = elements.drawReasons;
    this.confirmDraw = elements.confirmDraw;
    this.winDlg = elements.winDlg;
    this.winMessage = elements.winMessage;
    this.closeWin = elements.closeWin;
    this.resetWin = elements.resetWin;
    this.illegalSlideDlg = elements.illegalSlideDlg;
    this.illegalSlideReason = elements.illegalSlideReason;
    this.closeIllegalSlide = elements.closeIllegalSlide;

    // Track which specific positions have had draw offers declined at what repetition counts
    this.declinedDraws = new Map(); // positionKey -> declinedRepetitionCount

    this.confirmDraw.addEventListener('click', () => {
      if (this.game.draw) {
        // If it's already a draw (automatic), just close the dialog
        this.drawDlg.style.display = 'none';
      } else {
        // If it's a manual claim (shouldn't happen with new system), handle normally
        this.confirmClaimDraw();
      }
    });
    this.closeIllegalSlide.addEventListener('click', () => { this.illegalSlideDlg.style.display = 'none'; });
    this.closeWin.addEventListener('click', () => { this.winDlg.style.display = 'none'; });
    this.resetWin.addEventListener('click', () => {
      this.winDlg.style.display = 'none';
      this.game.restore(this.game.initialSnap);
    });
  }

  showWinDialog() {
    this.winMessage.textContent = this.game.winner === 'w' ? 'White wins!' : 'Black wins!';
    this.winDlg.style.display = 'flex';
  }

  showIllegalSlideDialog(reason) {
    this.illegalSlideReason.textContent = reason;
    this.illegalSlideDlg.style.display = 'flex';
  }

  onClaimDraw() {
    const repetitionCounts = [...this.game.repetitionManager.repetitionCounts.entries()].filter(([, v]) => v >= 3);
    if (!repetitionCounts.length) return;
    const maxOccurrences = repetitionCounts.length > 0 ? Math.max(...repetitionCounts.map(([, v]) => v)) : 3;
    const ruleName = maxOccurrences === 3 ? 'threefold' : maxOccurrences === 4 ? 'fourfold' : maxOccurrences === 5 ? 'fivefold' : `${maxOccurrences}-fold`;

    // Only show positions that have reached the maximum repetition count
    const maxRepetitionPositions = repetitionCounts.filter(([, v]) => v === maxOccurrences);

    const lines = [`This game may be claimed drawn under the ${ruleName} repetition rule:`];
    if (maxRepetitionPositions.length === 1) {
      lines.push(`• This position has occurred ${maxOccurrences} times.`);
    } else {
      lines.push(`• ${maxRepetitionPositions.length} positions have each occurred ${maxOccurrences} times.`);
    }

    this.drawReasons.innerHTML = lines.map(x => `<div>${x}</div>`).join('');
    this.drawDlg.style.display = 'flex';
  }

  confirmClaimDraw() {
    const repetitionCounts = [...this.game.repetitionManager.repetitionCounts.entries()].filter(([, v]) => v >= 3).map(([, v]) => v);
    const maxOccurrences = repetitionCounts.length > 0 ? Math.max(...repetitionCounts) : 3;
    const ruleName = maxOccurrences === 3 ? 'threefold' : maxOccurrences === 4 ? 'fourfold' : maxOccurrences === 5 ? 'fivefold' : `${maxOccurrences}-fold`;
    const explain = `Draw claimed: ${ruleName} repetition (${ordinal(maxOccurrences)} occurrence).`;
    this.game.notation.moves.push(explain);
    this.game.draw = true;
    this.game.notation.appendResultIfNeeded();
    this.game.notation.renderMoves(); // Ensure the notation display is updated
    this.drawDlg.style.display = 'none';
    this.game.redraw();
  }

  checkAndShowDrawDialog() {
    if (this.game.repetitionManager.canClaimDraw() && !this.game.winner && !this.game.draw) {
      // Automatically call a draw on threefold repetition - no need for player to claim
      this.callAutomaticDraw();
    }
  }

  callAutomaticDraw() {
    // Get the repetition information for the acknowledgment dialog
    const repetitionCounts = [...this.game.repetitionManager.repetitionCounts.entries()].filter(([, v]) => v >= 3);
    const maxOccurrences = repetitionCounts.length > 0 ? Math.max(...repetitionCounts.map(([, v]) => v)) : 3;
    const ruleName = maxOccurrences === 3 ? 'threefold' : maxOccurrences === 4 ? 'fourfold' : maxOccurrences === 5 ? 'fivefold' : `${maxOccurrences}-fold`;

    // Set the draw flag and update notation
    this.game.draw = true;
    const explain = `Draw by ${ruleName} repetition.`;
    this.game.notation.moves.push(explain);
    this.game.notation.appendResultIfNeeded();
    this.game.notation.renderMoves();

    // Note: Draw states are handled automatically by the repetition detection

    // Show acknowledgment dialog
    this.showAutomaticDrawDialog(ruleName, maxOccurrences);

    // Redraw to update the board state
    this.game.redraw();
  }

  showAutomaticDrawDialog(ruleName, occurrences) {
    this.drawReasons.innerHTML = `Draw by ${ruleName} repetition.`;
    this.drawDlg.style.display = 'flex';

    // Change the buttons for automatic draw acknowledgment
    this.confirmDraw.textContent = 'OK';
    // No cancel button to hide since it was removed from the simplified dialog
  }

  resetDrawDialog() {
    // Reset dialog buttons to normal state
    this.confirmDraw.textContent = 'OK';
    // No cancel button to reset since it was removed from the simplified dialog
  }

  showDrawDialog() {
    const repetitionCounts = [...this.game.repetitionManager.repetitionCounts.entries()].filter(([, v]) => v >= 3);
    if (!repetitionCounts.length) return;

    const maxOccurrences = repetitionCounts.length > 0 ? Math.max(...repetitionCounts.map(([, v]) => v)) : 3;
    const ruleName = maxOccurrences === 3 ? 'threefold' : maxOccurrences === 4 ? 'fourfold' : maxOccurrences === 5 ? 'fivefold' : `${maxOccurrences}-fold`;

    // Only show positions that have reached the maximum repetition count
    const maxRepetitionPositions = repetitionCounts.filter(([, v]) => v === maxOccurrences);

    const lines = [`This game may be drawn under the ${ruleName} repetition rule:`];
    if (maxRepetitionPositions.length === 1) {
      lines.push(`• This position has occurred ${maxOccurrences} times.`);
    } else {
      lines.push(`• ${maxRepetitionPositions.length} positions have each occurred ${maxOccurrences} times.`);
    }

    this.drawReasons.innerHTML = lines.map(x => `<div>${x}</div>`).join('');
    this.drawDlg.style.display = 'flex';
  }

  showStalemateDialog() {
    this.drawReasons.innerHTML = '<div>Stalemate!</div><div>The game is a draw because the player to move has no legal moves but is not in check.</div>';
    this.confirmDraw.textContent = 'OK';
    this.drawDlg.style.display = 'flex';

    // Set up the confirm button to just acknowledge the stalemate
    this.confirmDraw.onclick = () => {
      this.drawDlg.style.display = 'none';
    };
  }
}