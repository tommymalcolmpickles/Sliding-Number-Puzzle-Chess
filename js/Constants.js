export const SIZE = 800;
export const N = 8;
export const SQ = SIZE / N;
export const SECTION = 2;
export const MAX_HISTORY = 50;
export const SOUND_DELAY = 0; // Sound delay in milliseconds (can be negative to play early)
export const SLIDE_ANIMATION_DURATION = 600; // Slide animation duration in milliseconds
export const GLYPH = { w: { k: '♔', q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' }, b: { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' } };
export const FILES = 'abcdefgh';
export const RANKS = '87654321';

export function clone(o, depth = 0, maxDepth = 50) {
  if (depth > maxDepth) {
    return o;
  }
  if (o === null || o === undefined) return o;
  if (o instanceof Map) return new Map(o);
  if (Array.isArray(o)) {
    // Optimize for arrays of primitives
    if (o.every(item => typeof item === 'number' || typeof item === 'string' || item === null)) {
      return [...o]; // Shallow copy for arrays of primitives
    }
    return o.map(item => clone(item, depth + 1, maxDepth));
  }
  if (o && typeof o === 'object') {
    // Optimize for piece objects { t, c, moved }
    if ('t' in o && 'c' in o && 'moved' in o && Object.keys(o).length === 3) {
      return { ...o };
    }
    const result = {};
    for (const key in o) {
      if (Object.prototype.hasOwnProperty.call(o, key)) {
        result[key] = clone(o[key], depth + 1, maxDepth);
      }
    }
    return result;
  }
  return o;
}

export function secIndex(sr, sc) { return sr * 4 + sc + 1; }
export function squareToSection(r, c) { return { sr: Math.floor(r / SECTION), sc: Math.floor(c / SECTION) }; }
export function sqName(r, c) { return FILES[c] + RANKS[r]; }
export function inBounds(r, c) { return r >= 0 && r < 8 && c >= 0 && c < 8; }
export function opponent(c) { return c === 'w' ? 'b' : 'w'; }

export function ordinal(n) {
  if (n % 10 === 1 && n % 100 !== 11) return n + 'st';
  if (n % 10 === 2 && n % 100 !== 12) return n + 'nd';
  if (n % 10 === 3 && n % 100 !== 13) return n + 'rd';
  return n + 'th';
}

export function getVar(name) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  if (!value) {
    const defaults = {
      '--light': '#f0d9b5',
      '--dark': '#b58863',
      '--grid': '#222',
      '--accent': '#63b3ed',
      '--danger': '#e53e3e'
    };
    return defaults[name] || '#000000';
  }
  return value;
}