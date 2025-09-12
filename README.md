# Sliding Number Puzzle Chess Variant

## Table of Contents

- [Rules for Sliding Number Puzzle Chess Variant](#rules-for-sliding-number-puzzle-chess-variant)
  - [Overview](#overview)
  - [Board Setup](#board-setup)
    - [Board Structure](#board-structure)
    - [The Gap](#the-gap)
    - [Initial Piece Setup](#initial-piece-setup)
    - [Gap Starting Position](#gap-starting-position)
  - [Gameplay Mechanics](#gameplay-mechanics)
    - [Turn Structure](#turn-structure)
    - [Objective](#objective)
  - [Piece Movement](#piece-movement)
    - [Standard Chess Moves](#standard-chess-moves)
    - [Pawn Rules](#pawn-rules)
    - [Castling](#castling)
    - [Check and Checkmate](#check-and-checkmate)
  - [Sliding Mechanic](#sliding-mechanic)
    - [Sliding Rules](#sliding-rules)
    - [Strategic Impact](#strategic-impact)
  - [Castling](#castling-1)
    - [Eligibility](#eligibility)
    - [Execution](#execution)
  - [Endgame Conditions](#endgame-conditions)
  - [Notation](#notation)
    - [Move Notation](#move-notation)
    - [Slide Notation](#slide-notation)
    - [Game Record](#game-record)
- [Game Instructions](#game-instructions)
  - [Initial Setup](#initial-setup)
    - [Starting the Game](#starting-the-game)
  - [Interface Overview](#interface-overview)
    - [Board Display](#board-display)
    - [Captured Pieces](#captured-pieces)
    - [Game Status](#game-status)
    - [Check Indicator](#check-indicator)
    - [Notation Log](#notation-log)
  - [Making a Move](#making-a-move)
    - [Piece Movement](#piece-movement-interface)
    - [Pawn Double Move](#pawn-double-move)
    - [Castling](#castling-interface)
    - [Captures](#captures)
  - [Sliding a Section](#sliding-a-section)
    - [Selecting a Slide](#selecting-a-slide)
    - [Strategic Notes](#strategic-notes)
  - [Game Progression](#game-progression)
    - [Turn Alternation](#turn-alternation)
    - [Check and Checkmate](#check-and-checkmate-progression)
    - [Draws](#draws)
  - [Tips for Players](#tips-for-players)
    - [Strategic Use of the Gap](#strategic-use-of-the-gap)
    - [Castling Flexibility](#castling-flexibility)
    - [Pawn Play](#pawn-play)
    - [Notation Management](#notation-management)

## Rules for Sliding Number Puzzle Chess Variant

### Overview

Sliding Number Puzzle Chess is a chess variant that integrates standard chess rules with a sliding tile puzzle mechanic. Played on an 8x8 chessboard divided into 16 2x2 sections, one section is an empty "gap" that affects movement and strategy. Players alternate between making standard chess moves or sliding sections to reposition pieces, aiming for checkmate while navigating the dynamic board. All rules are in reference to white's perspective with white starting at the bottom ranks with the King starting to the right of the Queen.

### Board Setup

#### Board Structure

- The game uses an 8x8 chessboard (64 squares), divided into 16 2x2 sections (4 squares each).
- Sections are numbered 1 to 16, left to right, top to bottom:

```
1  2  3  4
5  6  7  8
9 10 11 12
13 14 15 16
```

- Section numbers are only visible through the gap for reference during slides.

#### The Gap

- One 2x2 section is an empty gap, with no pieces or squares present in its four-square area.
- The gap blocks piece movement, checks, and checkmates, acting as a barrier.

#### Initial Piece Setup

- Standard chess arrangement: White pieces on ranks 1 and 2, Black pieces on ranks 7 and 8 (e.g., rooks on a1, h1, a8, h8; kings on e1, e8).

#### Gap Starting Position

- At the start, players choose a hand (left or right), each containing a randomly colored pawn (white or black).
- The chosen pawn's color determines the gap's starting position:
- White: Section 11 (king-side, center for White: e3, f3, e4, f4).
- Black: Section 7 (king-side, center for Black: e5, f5, e6, f6).

### Gameplay Mechanics

#### Turn Structure

- Play begins with White, alternating turns with Black.
- On a player's turn, they choose one action:
- 1. **Move a Piece**: Follow standard chess rules, adjusted for the gap.
- 2. **Slide a Section**: Move an adjacent 2x2 section into the gap, shifting all pieces in that section.

#### Objective

- Achieve checkmate by putting the opponent's king in check with no legal escape.
- Stalemate is possible but difficult due to the sliding mechanic's flexibility.

### Piece Movement

#### Standard Chess Moves

- Pieces move as in standard chess (e.g., bishops diagonally, rooks horizontally/vertically, knights in L-shape).
- Pieces cannot move through or land on the gap's four-square area.

#### Pawn Rules

- Pawns are allowed a double move (two squares forward) on their first standard chess move, even if their position changes due to slides.
- En passant is possible on any rank if a pawn uses its double move and lands adjacent to an opponent's pawn.
- Pawns promote as in standard chess upon reaching the opponent's back rank (8 for White, 1 for Black).

#### Castling

- Castling is permitted as long as King and Rook haven't made a standard chess move yet.
- Kings and Rooks retain castling rights even through slides.
- Vertical and reverse castling is allowed.

#### Check and Checkmate

- A king is in check if threatened by an opponent's piece, ignoring paths blocked by the gap.
- Checkmate occurs when a king is in check with no legal moves (piece moves or slides) to escape.
- The gap can block checks, preventing a piece's attack from reaching the king.

### Sliding Mechanic

#### Sliding Rules

- A player may slide any 2x2 section adjacent to the gap (horizontally or vertically) into the gap's position.
- The entire section, including any pieces, moves to the gap's former position, and the gap moves to the section's original position.
- Slides that would place the player's own king in check are illegal.
- Example: If the gap is in section 11, legal slides are from sections 7, 10, 12, or 15 (if they don't cause check).

#### Strategic Impact

- Slides can reposition pieces to create discovered checks, block opponent attacks, or set up checkmates.
- Slides do not count as standard chess moves for castling eligibility.

### Castling

#### Eligibility

- The king and rook must not have made a standard chess move (slides do not count).
- They must be exactly 4 or 5 squares apart, horizontally or vertically (no diagonal castling, as rooks move only orthogonally).
- There must be a clear line of sight between king and rook (no pieces or gap in the path).
- The king cannot be in check, move through a square under attack, or end in check.

#### Execution

- The king moves two squares toward the rook, and the rook moves to the square on the opposite side of the king.
- Horizontal castling includes standard setups (e.g., king e1 to g1, rook h1 to f1 for short castling) and mirrored arrangements (e.g., short castling with a rook to the left of the king, like king g1 to e1, rook d1 to f1).
- Vertical castling is possible (e.g., king e1 to e3, rook e5 to e2, if positions align post-slides).

### Endgame Conditions

- **Checkmate**: The game ends when a player's king is in check with no legal moves (piece moves or slides) to escape.
- **Stalemate**: Occurs if a player has no legal moves but is not in check. Stalemate is likely possible but difficult due to sliding options.
- **Draws**: Possible via standard chess draw conditions (e.g., threefold repetition) or stalemate.

### Notation

#### Move Notation

- Uses standard algebraic notation for piece moves (e.g., Nf3, exd5, O-O for castling).

#### Slide Notation

- Slides are denoted with brackets and an arrow: [section number] followed by ↑, ↓, ←, or →.
- Example: "[11]↑" means section 11 slides upward into the gap.

#### Game Record

- Moves and slides are recorded sequentially (e.g., "1. e4 [11]↑ 1…d5 [7]↓").

## Game Instructions

### Initial Setup

#### Starting the Game

- The game loads an 8x8 chessboard with standard piece positions and a 2x2 empty gap in either section 7 (e5-f5, e6-f6) or section 11 (e3-f3, e4-f4).
- A dialog prompts the first player to choose a hand (left or right), each containing a randomly colored pawn (white or black).
- The chosen pawn sets the gap's position:
- White pawn: Gap in section 11.
- Black pawn: Gap in section 7.
- White moves first.

### Interface Overview

#### Board Display

- The 8x8 chessboard shows pieces in standard positions, with the gap as an empty 2x2 section.
- Section numbers (1-16) are visible only through the gap to assist with slide selection.

#### Captured Pieces

- Captured pieces are displayed to the left (Black's captures) and right (White's captures) of the board.

#### Game Status

- Text above and below the board shows the current state (e.g., "White to move," "Check. Black to move," "Checkmate, White wins!," "Draw").

#### Check Indicator

- If a king is in check, its individual square (not the entire section) is highlighted red.

#### Notation Log

- Below the board, a record of moves and slides is shown in algebraic notation (e.g., "1. e4 [11]↑ 1…d5 [7]↓").
- Players can copy the notation to the clipboard by clicking a "Copy" button or reset the game by clicking a "Reset" button.

### Making a Move

#### Piece Movement

- Click a piece to select it. Legal destination squares are highlighted in blue.
- Click a blue square to move the piece.
- If the move is illegal (e.g., blocked by the gap or violates chess rules), no highlights appear.

#### Pawn Double Move

- Pawns can move two squares forward on their first standard chess move, enabling en passant if an opponent's pawn is adjacent post-move.

#### Castling

- Click the king to see castling options (if eligible). Legal castling destinations (two squares toward the rook, horizontally or vertically) are highlighted blue.
- Click the blue square to castle; the rook moves to the opposite side.
- Horizontal castling includes standard (e.g., king e1 to g1, rook h1 to f1) and mirrored setups (e.g., king e1 to c1, rook a1 to d1).

#### Captures

- Capturing a piece moves it to the opponent's capture display (Black's on left, White's on right).

### Sliding a Section

#### Selecting a Slide

- Click the gap's empty 2x2 section. Adjacent sections are highlighted:
- Blue for legal slides (adjacent sections that don't put the player's king in check).
- Red for illegal slides (non-adjacent sections or slides causing the player's king to be in check).
- Click a blue-highlighted section to slide it into the gap.
- The gap moves to the section's original position, and all pieces in the section shift with it.

#### Strategic Notes

- Use slides to reposition pieces, block opponent attacks, or create discovered checks.
- Example: Sliding a section with a rook may open a check by moving the gap.

### Game Progression

#### Turn Alternation

- After a move or slide, the turn switches to the opponent (e.g., White moves, then Black).
- The game status updates to reflect whose turn it is.

#### Check and Checkmate

- If a move or slide puts the opponent's king in check, the king's square turns red, and the status updates (e.g., "Check. Black to move").
- Checkmate ends the game, with the status displaying "Checkmate, [color] wins!".

#### Draws

- If a stalemate or draw occurs, the status displays "Draw" or the specific condition (e.g., "Stalemate").

### Tips for Players

#### Strategic Use of the Gap

- Position the gap to block opponent checks or restrict their piece movement.
- Use slides to create unexpected attacks or escape threats.

#### Castling Flexibility

- Plan slides to align the king and rook for horizontal (standard or mirrored) or vertical castling.

#### Pawn Play

- Use pawn double moves and en passant opportunities to control key squares after slides.

#### Notation Management

- Use the "Copy" button to save the game record for analysis or sharing.
- Use the "Reset" button to start a new game.
