import Game from './Game.js';
import { STRINGS } from './Strings.js';

function startGame() {
  const elements = {
    canvas: document.getElementById('board'),
    overlay: document.getElementById('overlay'),
    phaseAbove: document.getElementById('phase-above'),
    phaseBelow: document.getElementById('phase-below'),
    capturedBlack: document.getElementById('captured-black'),
    capturedWhite: document.getElementById('captured-white'),
    reset: document.getElementById('reset'),
    copyLog: document.getElementById('copyLog'),
    movesContainer: document.getElementById('movesContainer'),
    movesTable: document.getElementById('movesTable'),
    movesTableBody: document.getElementById('movesTableBody'),
    movesText: document.getElementById('movesText'),
    handSelectionDlg: document.getElementById('handSelectionDlg'),
    leftHandBtn: document.getElementById('leftHandBtn'),
    rightHandBtn: document.getElementById('rightHandBtn'),
    gapResultDlg: document.getElementById('gapResultDlg'),
    gapResultPawn: document.getElementById('gapResultPawn'),
    gapResultMessage: document.getElementById('gapResultMessage'),
    confirmGapBtn: document.getElementById('confirmGapBtn'),
    drawDlg: document.getElementById('drawDlg'),
    drawReasons: document.getElementById('drawReasons'),
    confirmDraw: document.getElementById('confirmDraw'),
    winDlg: document.getElementById('winDlg'),
    winMessage: document.getElementById('winMessage'),
    closeWin: document.getElementById('closeWin'),
    resetWin: document.getElementById('resetWin'),
    illegalSlideDlg: document.getElementById('illegalSlideDlg'),
    illegalSlideReason: document.getElementById('illegalSlideReason'),
    closeIllegalSlide: document.getElementById('closeIllegalSlide'),
    promo: document.getElementById('promo'),
    promoTitle: document.getElementById('promoTitle'),
    promoChoices: document.getElementById('promoChoices'),
    promoHint: document.getElementById('promoBoardHint'),
  };
  if (!elements.canvas || !elements.overlay) {
    console.error(STRINGS.ERROR_REQUIRED_DOM_ELEMENTS_MISSING);
    if (elements.phaseAbove) elements.phaseAbove.textContent = STRINGS.ERROR_REQUIRED_DOM_ELEMENTS_MISSING;
    return;
  }
  const game = new Game(elements);
  game.start();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}