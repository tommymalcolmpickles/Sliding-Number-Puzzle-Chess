import { GLYPH, sqName } from './Constants.js';

export default class PromotionManager {
  constructor(game, promoEl, promoTitle, promoChoices, promoHint) {
    this.game = game;
    this.promoEl = promoEl;
    this.promoTitle = promoTitle;
    this.promoChoices = promoChoices;
    this.promoHint = promoHint;
    this.promotingSq = null;
  }

  handleSlidePromotions(done) {
    const promos = this.game.board.findBackRankPromos();
    if (promos.length) {
      this.game.needPromos.push(...promos);
      this.askPromotionQueue(() => {
        this.promotingSq = null;
        done();
      });
    } else done();
  }

  askPromotionQueue(done) {
    const next = this.game.needPromos.shift();
    if (!next) { done(); return; }
    this.promotingSq = { r: next.r, c: next.c };
    this.showPromotion(next.color, next.r, next.c, piece => {
      this.game.board.board[next.r][next.c] = { t: piece, c: next.color, moved: true };
      this.promotingSq = null;
      this.askPromotionQueue(done);
    });
  }

  showPromotion(color, r, c, cb) {
    this.promoChoices.innerHTML = '';
    this.promoTitle.textContent = `Promote ${color === 'w' ? 'White' : 'Black'} pawn at ${sqName(r, c)}`;
    this.promoHint.textContent = 'Choose the piece:';
    const pieces = ['q', 'r', 'b', 'n'];
    for (const t of pieces) {
      const btn = document.createElement('button');
      btn.className = 'btn';
      btn.style.fontSize = '28px';
      btn.style.width = '100%';
      btn.style.padding = '10px 6px';
      btn.textContent = GLYPH[color][t];
      btn.onclick = () => {
        this.promoEl.style.display = 'none';
        cb(t);
        this.game.redraw();
      };
      this.promoChoices.appendChild(btn);
    }
    this.promoEl.style.display = 'flex';
  }
}