// Centralized string constants for the Slide Chess application
// All string literals should be replaced with these constants for better maintainability

export const STRINGS = {
  // Colors
  COLOR_WHITE: 'w',
  COLOR_BLACK: 'b',

  // Game modes
  MODE_MOVE: 'move',
  MODE_SLIDE: 'slide',

  // CSS classes
  CSS_CLASS_BLACK_PAWN_GLYPH: 'black-pawn-glyph',
  CSS_CLASS_BOARD_MODAL_DISABLED: 'board-modal-disabled',

  // Dialog messages
  DIALOG_HAND_SELECTION_TITLE: 'Choose a Hand',
  DIALOG_HAND_SELECTION_MESSAGE: 'Please choose a hand:',
  DIALOG_GAP_RESULT_TITLE: 'Gap Position',
  DIALOG_GAP_RESULT_WHITE_MESSAGE: 'You chose the hand with the white pawn. This means the gap will start at section 11.',
  DIALOG_GAP_RESULT_BLACK_MESSAGE: 'You chose the hand with the black pawn. This means the gap will start at section 7.',
  DIALOG_START_GAME_BUTTON: 'Start Game',

  // Error messages
  ERROR_GAME_LOCKED_CLICK_IGNORED: 'Game is locked, click ignored',
  ERROR_GAP_NOT_SELECTED_CLICK_IGNORED: 'Gap not selected yet, click ignored',
  ERROR_REQUIRED_DOM_ELEMENTS_MISSING: 'Required DOM elements not found',

  // Console log messages
  LOG_CAPTURE_PIECE: '🎯 CAPTURE! Piece:',
  LOG_EN_PASSANT_CAPTURE: '🎯 EN PASSANT CAPTURE! Piece:',
  LOG_CAPTURED_PIECES: 'Captured pieces now:',
  LOG_BOARD_CLICK_MODE: 'Board click in mode:',
  LOG_CLICKED_AT_SQUARE: 'Clicked at square:',
  LOG_CLICKED_SECTION: '-> section:',
  LOG_GAP_AT: 'Gap at:',
  LOG_GAP_CLICKED_TOGGLE_MODE: 'Gap clicked! Toggling mode from',
  LOG_CLICKED_NON_ADJACENT_SECTION_IN_SLIDE_MODE: 'Clicked on non-adjacent section in slide mode - switching to move mode',
  LOG_TO: 'to',
  LOG_SETTING_UP_GAP_OVERLAY_EVENTS: 'Setting up gap overlay events',
  LOG_GAP_OVERLAY_MOUSEENTER: 'Gap overlay mouseenter - adding active class',
  LOG_GAP_OVERLAY_MOUSELEAVE: 'Gap overlay mouseleave - removing active class',
  LOG_GAP_OVERLAY_CLICKED: 'Gap overlay clicked',
  LOG_TOGGLING_MODE_FROM_GAP_OVERLAY: 'Toggling mode from gap overlay',
  LOG_POSITIONING_GAP_OVERLAY: 'Positioning gap overlay at section',
  LOG_GAP_OVERLAY_POSITIONED: 'Gap overlay positioned:',
  LOG_CANNOT_POSITION_GAP_OVERLAY: 'Cannot position gap overlay - element not found',
  LOG_CREATING_GAP_OVERLAY: 'Creating gap overlay:',
  LOG_ADDING_GAP_OVERLAY_TO_DOM: 'Adding gap overlay to DOM',
  LOG_GAP_OVERLAY_EXISTS_AFTER_APPEND: 'Gap overlay exists after append:',

  // Display text
  DISPLAY_WHITE_PIECE: 'White',
  DISPLAY_BLACK_PIECE: 'Black',
  DISPLAY_LOADING: 'Loading…',

  // Button text
  BUTTON_LEFT_HAND: 'Left Hand',
  BUTTON_RIGHT_HAND: 'Right Hand',
  BUTTON_RESET: 'Reset',
  BUTTON_COPY: 'Copy',

  // Game state
  GAME_STATE_TO_MOVE_WHITE: 'White to move',
  GAME_STATE_TO_MOVE_BLACK: 'Black to move',
  GAME_STATE_CHECK: 'Check!',
  GAME_STATE_CHECKMATE: 'Checkmate!',
  GAME_STATE_STALEMATE: 'Stalemate!',
  GAME_STATE_DRAW: 'Draw',
  GAME_STATE_CHECKMATE_WHITE_WINS: 'Checkmate! White wins!',
  GAME_STATE_CHECKMATE_BLACK_WINS: 'Checkmate! Black wins!',
  GAME_STATE_DRAW_ACCEPTED_BY_WHITE: 'Draw accepted by White',
  GAME_STATE_DRAW_ACCEPTED_BY_BLACK: 'Draw accepted by Black',
  GAME_STATE_CHECK_WHITE_TO_MOVE: 'Check! White to move',
  GAME_STATE_CHECK_BLACK_TO_MOVE: 'Check! Black to move',

  // Section information
  SECTION_GAP_STARTS_AT: 'starts at section',

  // Hand selection
  HAND_LEFT: 'left',
  HAND_RIGHT: 'right',

  // Notation
  NOTATION_SHORT: 'Short',
  NOTATION_LONG: 'Long',

  // Chess pieces (for algebraic notation)
  PIECE_KING: 'K',
  PIECE_QUEEN: 'Q',
  PIECE_ROOK: 'R',
  PIECE_BISHOP: 'B',
  PIECE_KNIGHT: 'N',
  PIECE_PAWN: '',

  // Chess notation symbols
  NOTATION_CAPTURE: 'x',
  NOTATION_CHECK: '+',
  NOTATION_CHECKMATE: '#',
  NOTATION_CASTLE_KINGSIDE: 'O-O',
  NOTATION_CASTLE_QUEENSIDE: 'O-O-O',
  NOTATION_PROMOTION: '=',

  // Game results
  RESULT_WHITE_WINS: '1-0',
  RESULT_BLACK_WINS: '0-1',
  RESULT_DRAW: '½-½',
};
