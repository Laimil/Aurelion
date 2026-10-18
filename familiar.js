// Фамільяр гравця: піксельний малюнок 48×48 з опису форм.
// Один код для кабінету, визирання на сторінках і (пізніше) PNG для бота.
// Усе в window.AuFamiliar; жодних залежностей.
(function () {
  if (window.AuFamiliar) return;

  const SP = [['cat', 'Кіт'], ['owl', 'Сова'], ['crow', 'Крук'], ['fox', 'Лис'], ['dragon', 'Дракончик'], ['slime', 'Слиз']];
  const EYE = [['round', 'Круглі'], ['slit', 'Котячі'], ['button', 'Ґудзики']];
  const PAT = [['none', 'Без'], ['stripe', 'Смужки'], ['spots', 'Плямки']];
  const ACC = [['none', 'Нічого'], ['hat', 'Капелюх'], ['crown', 'Корона'], ['bow', 'Бантик'], ['flower', 'Квітка']];
  const PL = [['none', 'Ніде'], ['pillow', 'Подушка'], ['cloud', 'Хмаринка'], ['branch', 'Гілка']];
  const COLS = ['#d0caff', '#ffd700', '#6495ed', '#7fd1c4', '#e59aa3', '#d6dbe3', '#ffffff', '#3a3a48'];
  const IRIS = ['#ffd700', '#ffb347', '#ff4d4d', '#e59aa3', '#d0caff', '#6495ed', '#7fd1c4', '#8fd18a', '#d6dbe3', '#ffffff'];
  const SHELL = ['#f3ecdb', '#d6dbe3', '#3a3a48', '#ffd700', '#e59aa3', '#d0caff', '#7fd1c4', '#6495ed'];
  const SPOT = ['#d0caff', '#ffd700', '#6495ed', '#7fd1c4', '#e59aa3', '#ff4d4d', '#8fd18a', '#3a3a48', '#ffffff'];
  const DEFAULT_LOOK = { sp: 'cat', eyeSt: 'round', iris: '#ffd700', pat: 'stripe', acc: 'none', place: 'pillow', col: '#d0caff', egg: '#f3ecdb', eggSpot: '#d0caff' };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const key0 = x => Array.isArray(x) ? x[0] : x;
  // Випадковий фамільяр (для «яйця-сюрпризу»): хто вилупиться, видно лише по вилупленні.
  function random(keep) {
    const k = keep || {};
    return { sp: key0(pick(SP)), eyeSt: key0(pick(EYE)), iris: pick(IRIS), pat: key0(pick(PAT)), acc: key0(pick(ACC)), place: key0(pick(PL)), col: pick(COLS),
      egg: k.egg || '#f3ecdb', eggSpot: k.eggSpot || '#d0caff', surprise: !!k.surprise };
  }

  const has = (list, v) => list.some(x => (Array.isArray(x) ? x[0] : x) === v);
  // Те, що прийшло з бази, — тільки відомі значення; решта береться типова.
  function clean(look) {
    const l = look || {}, d = DEFAULT_LOOK;
    return {
      sp: has(SP, l.sp) ? l.sp : d.sp, eyeSt: has(EYE, l.eyeSt) ? l.eyeSt : d.eyeSt,
      iris: has(IRIS, l.iris) ? l.iris : d.iris, pat: has(PAT, l.pat) ? l.pat : d.pat,
      acc: has(ACC, l.acc) ? l.acc : d.acc, place: has(PL, l.place) ? l.place : d.place,
      col: has(COLS, l.col) ? l.col : d.col,
      egg: has(SHELL, l.egg) ? l.egg : d.egg,
      eggSpot: has(SPOT, l.eggSpot) ? l.eggSpot : (has(COLS, l.col) ? l.col : d.eggSpot),
      surprise: !!l.surprise,
    };
  }

  function scene(o) {
    const E = (cx, cy, rx, ry, mat, fx) => ({ t: 'e', cx, cy, rx, ry, mat, fx });
    const T = (a, b, c, mat, n) => ({ t: 'tri', a, b, c, mat, n: n || [0, -0.4] });
    const R = (x0, y0, x1, y1, mat) => ({ t: 'r', x0, y0, x1, y1, mat });
    const G = (a, b, w, mat) => ({ t: 'seg', a, b, w, mat });
    const A = (cx, cy, r, w, mat, up) => ({ t: 'arc', cx, cy, r, w, mat, up });
    const mir = e => e.t === 'e' || e.t === 'arc' ? { ...e, cx: -e.cx } : e.t === 'tri' ? { ...e, a: [-e.a[0], e.a[1]], b: [-e.b[0], e.b[1]], c: [-e.c[0], e.c[1]], n: [-e.n[0], e.n[1]] } : e.t === 'seg' ? { ...e, a: [-e.a[0], e.a[1]], b: [-e.b[0], e.b[1]] } : { ...e, x0: -e.x1, x1: -e.x0 };
    const both = (...l) => l.flatMap(e => [e, mir(e)]);
    const pat = o.pat === 'none' ? null : o.pat;
    const eyes = (cx, cy, r, lid) => {
      const L = [];
      if (o.eyes === 'closed') L.push(A(cx, cy - r * 0.5, r * 0.85, 0.05, 'dark', false));
      else if (o.eyes === 'happy') L.push(A(cx, cy + r * 0.5, r * 0.85, 0.05, 'dark', true));
      else {
        if (o.eyeSt === 'button') L.push(E(cx, cy, r * 0.62, r * 0.75, 'pupil'));
        else { L.push(E(cx, cy, r, r * 1.1, 'eye')); L.push(o.eyeSt === 'slit' ? E(cx, cy, r * 0.26, r * 0.95, 'pupil') : E(cx, cy + r * 0.08, r * 0.55, r * 0.62, 'pupil')); }
        L.push(E(cx - r * 0.38, cy - r * 0.42, r * 0.3, r * 0.3, 'shine'));
        if (o.eyes === 'half') L.push(E(cx, cy - r * 0.78, r * 1.3, r * 0.85, lid || 'fur'));
      }
      return both(...L);
    };
    let body = [], head = [], anchor = [0, -0.56], cheek = [0.32, -0.02];
    if (o.mode === 'egg') return [E(0, 0.4, 0.55, 0.7, 'egg'), E(-0.2, 0.2, 0.1, 0.1, 'spot'), E(0.25, 0.45, 0.12, 0.1, 'spot'), E(-0.12, 0.72, 0.09, 0.08, 'spot'), E(0.15, 0.02, 0.07, 0.07, 'spot'), E(-0.3, 0.5, 0.06, 0.06, 'spot')];
    if (o.sp === 'cat') {
      for (let i = 0; i <= 13; i++) { const t = i / 13; body.push(E(0.45 + 0.38 * Math.sin(t * 1.7), 0.92 - 1.05 * t, 0.1 - 0.03 * t, 0.1 - 0.03 * t, 'fur', pat)); }
      body.push(E(0, 0.42, 0.5, 0.55, 'fur', pat), ...both(E(-0.36, 0.72, 0.22, 0.26, 'fur', pat)), E(0, 0.5, 0.25, 0.42, 'belly'), ...both(E(-0.14, 0.72, 0.1, 0.26, 'fur')), ...both(E(-0.15, 0.94, 0.13, 0.08, 'belly')));
      head.push(...both(T([-0.46, -0.36], [-0.12, -0.52], [-0.38, -0.95], 'fur', [-0.35, -0.5])), ...both(T([-0.39, -0.42], [-0.2, -0.5], [-0.36, -0.8], 'inner', [-0.3, -0.4])), E(0, -0.18, 0.5, 0.4, 'fur', pat), ...both(E(-0.3, 0.0, 0.24, 0.17, 'fur')), E(0, -0.01, 0.21, 0.13, 'belly'), ...eyes(-0.2, -0.2, 0.14), T([-0.055, -0.085], [0.055, -0.085], [0, -0.03], 'nose'), ...both(A(-0.045, -0.03, 0.045, 0.03, 'dark', false)), ...both(G([-0.22, -0.03], [-0.78, -0.1], 0.02, 'whisk'), G([-0.22, 0.03], [-0.74, 0.13], 0.02, 'whisk')));
    } else if (o.sp === 'owl') {
      anchor = [0, -0.8]; cheek = [0.44, -0.2];
      body.push(E(0, 0.33, 0.56, 0.62, 'fur', pat), ...both(E(-0.5, 0.38, 0.2, 0.48, 'wing', 'feather')), E(0, 0.45, 0.36, 0.44, 'belly', 'chev'), ...both(E(-0.16, 0.96, 0.1, 0.06, 'beak')));
      head.push(...both(T([-0.52, -0.58], [-0.22, -0.74], [-0.66, -1.0], 'fur', [-0.4, -0.5])), E(0, -0.38, 0.6, 0.45, 'fur', pat), ...both(E(-0.24, -0.37, 0.23, 0.23, 'belly')), ...eyes(-0.24, -0.37, 0.15, 'belly'), T([-0.065, -0.25], [0.065, -0.25], [0, -0.07], 'beak', [0, 0.2]));
    } else if (o.sp === 'fox') {
      anchor = [0, -0.5]; cheek = [0.3, 0.0];
      for (let i = 0; i <= 12; i++) { const t = i / 12; body.push(E(0.4 + 0.5 * Math.sin(t * 1.5), 0.95 - 0.95 * t, 0.12 + 0.12 * Math.sin(t * 3.0), 0.12 + 0.12 * Math.sin(t * 3.0), t > 0.78 ? 'belly' : 'fur', t > 0.78 ? null : pat)); }
      body.push(E(0, 0.45, 0.45, 0.52, 'fur', pat), E(0, 0.28, 0.25, 0.3, 'belly'), ...both(E(-0.15, 0.8, 0.09, 0.2, 'fur')), ...both(E(-0.15, 0.97, 0.1, 0.06, 'sock')));
      head.push(...both(T([-0.45, -0.3], [-0.12, -0.5], [-0.42, -1.05], 'fur', [-0.35, -0.5])), ...both(T([-0.38, -0.38], [-0.2, -0.48], [-0.39, -0.85], 'inner', [-0.3, -0.4])), E(0, -0.15, 0.48, 0.36, 'fur', pat), ...both(E(-0.32, 0.02, 0.22, 0.15, 'belly')), T([-0.22, -0.04], [0.22, -0.04], [0, 0.22], 'belly', [0, 0.3]), ...eyes(-0.2, -0.2, 0.13), E(0, 0.16, 0.06, 0.045, 'dark'));
    } else if (o.sp === 'dragon') {
      cheek = [0.3, -0.05];
      body.push(...both(T([-0.25, 0.05], [-0.98, -0.5], [-0.78, 0.45], 'wing', [-0.5, -0.3])));
      for (let i = 0; i <= 12; i++) { const t = i / 12; body.push(E(0.35 + 0.55 * t, 0.9 - 0.25 * t - 0.35 * t * t, 0.13 - 0.08 * t, 0.13 - 0.08 * t, 'fur', pat)); }
      body.push(T([0.82, 0.38], [1.02, 0.22], [1.05, 0.48], 'horn', [0.4, -0.3]), E(0, 0.45, 0.48, 0.52, 'fur', pat), E(0, 0.5, 0.27, 0.4, 'belly', 'chev'), ...both(E(-0.28, 0.85, 0.16, 0.14, 'fur')));
      head.push(...both(T([-0.32, -0.5], [-0.16, -0.55], [-0.42, -0.92], 'horn', [-0.3, -0.5])), E(0, -0.2, 0.48, 0.38, 'fur', pat), T([-0.07, -0.56], [0.07, -0.56], [0, -0.72], 'horn'), E(0, 0.03, 0.3, 0.17, 'belly'), ...both(E(-0.08, 0.0, 0.03, 0.025, 'dark')), ...eyes(-0.2, -0.25, 0.14));
    } else if (o.sp === 'crow') {
      anchor = [0, -0.72]; cheek = [0.36, -0.12];
      body.push(T([-0.2, 0.7], [0.2, 0.7], [0, 1.05], 'wing'), ...both(E(-0.18, 0.97, 0.1, 0.05, 'bill')),
        E(0, 0.45, 0.6, 0.55, 'fur', pat), ...both(E(-0.52, 0.42, 0.18, 0.36, 'wing', 'feather')), E(0, 0.55, 0.32, 0.34, 'belly'));
      head.push(E(0, -0.2, 0.55, 0.5, 'fur', pat), ...both(T([-0.04, -0.66], [0.06, -0.68], [-0.1, -0.88], 'fur', [-0.2, -0.5])),
        ...eyes(-0.24, -0.26, 0.16), T([-0.1, -0.06], [0.1, -0.06], [0, 0.14], 'gold', [0, 0.3]), E(0, -0.07, 0.1, 0.04, 'gold'));
    } else {
      anchor = [0, -0.18]; cheek = [0.42, 0.42];
      body.push(E(0, 1.02, 0.85, 0.08, 'wing'), E(0, 0.6, 0.8, 0.45, 'fur', pat), ...both(E(-0.55, 0.92, 0.12, 0.1, 'fur')), E(-0.45, 0.48, 0.09, 0.07, 'shine'));
      head.push(E(0, 0.22, 0.5, 0.42, 'fur', pat), ...eyes(-0.22, 0.25, 0.15), A(0, 0.42, 0.1, 0.035, 'dark', false), E(-0.25, 0.0, 0.08, 0.06, 'shine'));
    }
    if (o.pet && o.mode !== 'small') head.push(...both(E(-cheek[0], cheek[1], 0.09, 0.055, 'blush')));
    const [ax, ay] = anchor, acc = [];
    if (o.mode !== 'small') {
      if (o.acc === 'hat') acc.push(E(ax, ay + 0.02, 0.42, 0.07, 'hat'), T([ax - 0.26, ay], [ax + 0.26, ay], [ax + 0.1, ay - 0.62], 'hat', [0.2, -0.4]), E(ax + 0.03, ay - 0.18, 0.05, 0.05, 'gold'));
      if (o.acc === 'crown') acc.push(R(ax - 0.24, ay - 0.14, ax + 0.24, ay + 0.03, 'gold'), T([ax - 0.24, ay - 0.13], [ax - 0.1, ay - 0.13], [ax - 0.2, ay - 0.34], 'gold'), T([ax - 0.08, ay - 0.13], [ax + 0.08, ay - 0.13], [ax, ay - 0.38], 'gold'), T([ax + 0.1, ay - 0.13], [ax + 0.24, ay - 0.13], [ax + 0.2, ay - 0.34], 'gold'), E(ax, ay - 0.06, 0.05, 0.05, 'gem'));
      if (o.acc === 'bow') { const bx = ax + 0.3, by = ay + 0.06; acc.push(T([bx, by], [bx - 0.26, by - 0.16], [bx - 0.26, by + 0.14], 'bow', [-0.3, -0.3]), T([bx, by], [bx + 0.26, by - 0.16], [bx + 0.26, by + 0.14], 'bow', [0.3, -0.3]), E(bx, by, 0.07, 0.07, 'bow')); }
      if (o.acc === 'flower') { const fx = ax - 0.28, fy = ay + 0.04; for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 - Math.PI / 2; acc.push(E(fx + Math.cos(a) * 0.1, fy + Math.sin(a) * 0.1, 0.075, 0.075, 'petal')); } acc.push(E(fx, fy, 0.055, 0.055, 'gold')); }
    }
    const place = [];
    if (o.mode !== 'small' && !o.noPlace) {
      if (o.place === 'pillow') place.push(E(0, 1.04, 0.98, 0.14, 'pillow'), ...both(E(-0.98, 1.0, 0.06, 0.06, 'gold')));
      if (o.place === 'cloud') place.push(E(-0.55, 1.02, 0.36, 0.16, 'cloud'), E(0.55, 1.02, 0.36, 0.16, 'cloud'), E(-0.22, 0.97, 0.36, 0.2, 'cloud'), E(0.25, 0.98, 0.34, 0.19, 'cloud'), E(0, 1.08, 0.8, 0.12, 'cloud'));
      if (o.place === 'branch') place.push(E(0, 1.0, 1.1, 0.06, 'branch'), E(0.7, 0.9, 0.09, 0.05, 'leaf'), E(-0.8, 1.06, 0.08, 0.045, 'leaf'));
    }
    if (o.away) return place;
    head.forEach(e => { e.up = true; }); acc.forEach(e => { e.up = true; });
    return [...place, ...body, ...head, ...acc];
  }

  const MAT = { fur: v => v, belly: v => v * 0.9 + 0.2, inner: v => v * 0.55, eye: v => 0.65 + 0.35 * v, pupil: () => 0.04, shine: () => 1, nose: () => 0.6, dark: () => 0.05, whisk: () => 0.8, wing: v => v * 0.75, beak: v => 0.55 + 0.4 * v, horn: v => 0.3 + 0.6 * v, hat: v => v, gold: v => 0.3 + 0.7 * v, gem: v => 0.5 + 0.5 * v, bow: v => v, petal: v => 0.4 + 0.6 * v, pillow: v => v, branch: v => 0.2 + 0.6 * v, leaf: v => v, blush: () => 0.7, cloud: v => 0.45 + 0.55 * v, bill: v => 0.3 + 0.5 * v, egg: v => 0.3 + 0.7 * v, spot: v => v, sock: v => v * 0.6 };
  const hx = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  const cache = new Map();

  function draw(cv, o) {
    if (!cv || !cv.getContext) return;
    const key = JSON.stringify(o);
    if (cv._k === key) return;
    const N = 48, X0 = -1.35, X1 = 1.35, Y0 = -1.5, Y1 = 1.2;
    if (cv.width !== N) { cv.width = N; cv.height = N; }
    const ctx = cv.getContext('2d');
    const hitC = cache.get(key);
    if (hitC) { ctx.putImageData(hitC, 0, 0); cv._k = key; return; }
    const els = scene(o);
    const sh = (nx, ny, nz) => 0.15 + 0.85 * Math.max(0, -0.45 * nx - 0.55 * ny + 0.7 * nz);
    const inTri = (x, y, a, b, c) => { const s = (p, q) => (x - q[0]) * (p[1] - q[1]) - (p[0] - q[0]) * (y - q[1]); const d1 = s(a, b), d2 = s(b, c), d3 = s(c, a); return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0)); };
    const segD = (x, y, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1]; let t = ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t)); return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy); };
    const bob = o.bob ? 0.055 : 0;
    const hit = (x0, y0) => {
      let x = x0, y = y0;
      if (o.mode === 'small') { x = x0 / 0.72; y = (y0 - 0.32) / 0.72; }
      if (o.mode === 'egg' && o.bob) x += 0.06;
      for (let i = els.length - 1; i >= 0; i--) {
        const e = els[i], yy = e.up ? y + bob : y; let v = null;
        if (e.t === 'e') {
          const nx = (x - e.cx) / e.rx, ny = (yy - e.cy) / e.ry, d = nx * nx + ny * ny;
          if (d < 1) {
            v = sh(nx, ny, Math.sqrt(1 - d));
            if (e.fx === 'stripe' && Math.sin(yy * 22 + Math.abs(x) * 6) > 0.55) v *= 0.6;
            if (e.fx === 'spots' && Math.sin(x * 17 + 1) * Math.sin(yy * 17) > 0.55) v *= 0.55;
            if (e.fx === 'chev' && Math.sin(yy * 26 - Math.abs(x) * 14) > 0.6) v *= 0.62;
            if (e.fx === 'feather' && Math.sin(yy * 30 + Math.abs(x) * 4) > 0.45) v *= 0.68;
          }
        } else if (e.t === 'tri') { if (inTri(x, yy, e.a, e.b, e.c)) v = sh(e.n[0], e.n[1], Math.sqrt(Math.max(0, 1 - e.n[0] ** 2 - e.n[1] ** 2))); }
        else if (e.t === 'r') { if (x >= e.x0 && x <= e.x1 && yy >= e.y0 && yy <= e.y1) v = 0.5 + 0.4 * (1 - (yy - e.y0) / (e.y1 - e.y0)); }
        else if (e.t === 'seg') { if (segD(x, yy, e.a, e.b) < e.w) v = 1; }
        else if (e.t === 'arc') { const d = Math.hypot(x - e.cx, yy - e.cy); if ((e.up ? yy < e.cy : yy > e.cy) && Math.abs(d - e.r) < e.w) v = 1; }
        if (v !== null) return { m: e.mat, v: Math.max(0, Math.min(1, MAT[e.mat](v))) };
      }
      return null;
    };
    const P = [];
    for (let r = 0; r < N; r++) { const row = []; for (let c = 0; c < N; c++) row.push(hit(X0 + (c + 0.5) * (X1 - X0) / N, Y0 + (r + 0.5) * (Y1 - Y0) / N)); P.push(row); }
    const C = hx(o.col), DK = [20, 16, 28], OL = [8, 6, 12], WH = [255, 255, 255];
    const ramp = (base, v) => { const q = Math.round(v * 4) / 4; return q <= 0.5 ? mix(DK, base, 0.35 + q * 1.3) : mix(base, WH, (q - 0.5) * 0.8); };
    const pink = hx('#e59aa3'), gold = hx('#ffd700');
    const COL = { fur: v => ramp(C, v), belly: v => ramp(mix(C, WH, 0.45), v), wing: v => ramp(mix(C, DK, 0.3), v), sock: v => ramp(mix(C, DK, 0.45), v), inner: v => mix(DK, pink, 0.5 + 0.4 * v), eye: v => ramp(hx(o.iris), v), pupil: () => OL, shine: () => WH, nose: () => pink, dark: () => OL, whisk: () => mix(C, WH, 0.7), beak: v => ramp(gold, v), horn: v => ramp(hx('#f3ecdb'), v), hat: v => ramp(hx('#483d8b'), v), gold: v => ramp(gold, v), gem: v => ramp(pink, v), bow: v => ramp(pink, v), petal: v => ramp(hx('#f3ecdb'), v), pillow: v => ramp(hx('#7d2f38'), v), branch: v => ramp([90, 74, 60], v), leaf: v => ramp(hx('#7fd1c4'), v), blush: () => pink, cloud: v => ramp(hx('#d6dbe3'), v), bill: v => ramp([72, 72, 84], v), egg: v => ramp(hx(o.egg || '#f3ecdb'), v), spot: v => ramp(hx(o.eggSpot || o.col), v) };
    ctx.clearRect(0, 0, N, N);
    const put = (x, y, c) => { ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(x, y, 1, 1); };
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const h = P[y][x]; if (!h) continue;
      const edge = h.m !== 'whisk' && [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => !(P[y + b] && P[y + b][x + a]));
      let c = edge ? OL : COL[h.m](h.v);
      if (o.dim) { const g = (c[0] + c[1] + c[2]) / 3; c = mix(c, [g, g, g], 0.75).map(v => Math.round(v * 0.75)); }
      put(x, y, c);
    }
    const sprite = (rows, x0, y0, c) => { ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; rows.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'x') ctx.fillRect(x0 + i, y0 + j, 1, 1); })); };
    const HEART = ['.xx.xx.', 'xxxxxxx', 'xxxxxxx', '.xxxxx.', '..xxx..', '...x...'];
    const Z = ['xxxx', '..x.', '.x..', 'xxxx'], z = ['xxx', '.x.', 'xxx'];
    const k = (o.tick || 0) % 3;
    if (o.hearts) { sprite(HEART, 36, 9 - k * 2, pink); if (k > 0) sprite(['x.x', 'xxx', '.x.'], 31, 5 - k, pink); }
    if (o.z === 'small') sprite(z, 37 + k, 12 - k * 2, [200, 200, 220]);
    if (o.z === 'big') { sprite(Z, 36, 12 - k * 2, [170, 170, 190]); sprite(z, 42, 6 - k, [140, 140, 160]); }
    cache.set(key, ctx.getImageData(0, 0, N, N));
    if (cache.size > 300) cache.delete(cache.keys().next().value);
    cv._k = key;
  }

  // Кадр за станом із бази: stage 1/2/3, state awake/drowsy/asleep.
  function frame(look, info, t, extra) {
    const l = clean(look), x = extra || {};
    const stage = (info && info.stage) || 3, state = (info && info.state) || 'awake';
    const base = { ...l, tick: t % 6, mode: stage === 1 ? 'egg' : stage === 2 ? 'small' : 'adult', eyes: 'open', noPlace: !!x.noPlace };
    if (x.away) return { ...base, mode: 'adult', away: true, tick: 0 };
    const blink = t % 9 === 0;
    if (x.pet) return { ...base, eyes: 'happy', bob: t % 2, pet: true, hearts: true };
    if (state === 'drowsy') return { ...base, eyes: 'half', bob: t % 4 < 2, z: 'small' };
    if (state === 'asleep') return { ...base, eyes: 'closed', bob: t % 6 < 3, z: 'big', dim: true };
    return { ...base, eyes: blink ? 'closed' : 'open', bob: t % 2 };
  }

  window.AuFamiliar = { draw, frame, clean, random, SP, EYE, PAT, ACC, PL, COLS, IRIS, SHELL, SPOT, DEFAULT_LOOK };
})();
