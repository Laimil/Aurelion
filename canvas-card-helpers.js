// Спільні хелпери для малювання карток на canvas (PNG для шерингу).
//
// Canvas не розуміє ні `var(--*)`, ні `color-mix()` — усі кольори тут і в
// викликачах лишаються звичайними hex/rgba.
//
// Використовує `Tests.dc.html`. У `Aurelion.dc.html` ті самі функції живуть
// методами класу (`_roundRect`, `_wrapLines`, `_trackedText`, `_loadImageSafe`,
// `_ensureCardFonts`) — там вони викликаються з десятків місць, і переписувати
// робочий файл заради експорту дорожче, ніж лишити копію. Правиш тут — звір з
// тим файлом.

// Пантеонні акценти дизайн-системи, дослівно як у `Tests.dc.html`.
export const ACCENT_HEX = {
  gold: '#ffd700', azure: '#6495ed', light: '#ffd76b',
  dark: '#8f7ee8', fate: '#d2607a', nature: '#5fbfb0', magic: '#cdd2db',
};

// Чекає РЕАЛЬНОГО завантаження шрифтів: без цього canvas малює системним.
export async function ensureCardFonts() {
  if (!document.fonts || !document.fonts.load) return;
  try {
    await Promise.all([
      document.fonts.load('600 20px "Cinzel"'),
      document.fonts.load('700 54px "Cinzel"'),
      document.fonts.load('400 27px "EB Garamond"'),
      document.fonts.load('italic 400 30px "EB Garamond"'),
    ]);
    await document.fonts.ready;
  } catch (e) {}
}

// Текст із трекінгом літер (Cinzel на сайті завжди розріджений).
export function trackedText(ctx, text, cx, y, spacing) {
  const chars = [...String(text)];
  let total = 0;
  const widths = chars.map(ch => { const w = ctx.measureText(ch).width; total += w; return w; });
  total += spacing * (chars.length - 1);
  let x = cx - total / 2;
  const prevAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  chars.forEach((ch, i) => { ctx.fillText(ch, x, y); x += widths[i] + spacing; });
  ctx.textAlign = prevAlign;
}

export function wrapLines(ctx, text, maxWidth) {
  const words = String(text).split(' ');
  const lines = []; let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (ctx.measureText(test).width > maxWidth && cur) { lines.push(cur); cur = w; }
    else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

export function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// Зображення, яке не валить картку: помилка → null, а не reject.
export function loadImageSafe(url) {
  return new Promise((resolve) => {
    if (!url) { resolve(null); return; }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

// '#ffd700' → 'rgba(255,215,0,0.2)'. Для сяйва під акцентним кольором.
export function withAlpha(hex, a) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
  if (!m) return 'rgba(255,215,0,' + a + ')';
  const n = parseInt(m[1], 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
}

// Обрізає перелив рядків трьома точками (останній рядок, без пунктуації).
export function clampLines(lines, max) {
  if (lines.length <= max) return lines;
  const out = lines.slice(0, max);
  out[max - 1] = out[max - 1].replace(/[.,;:!?»]*$/, '') + '…';
  return out;
}
