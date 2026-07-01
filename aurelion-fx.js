/* aurelion-fx.js — canvas-based reveal effects for Aurelion character sheets.
 * Custom element: <aurelion-fx effect="sparks" intensity="6" duration-ms="800"
 *                              seed="id" respect-reduced-motion="1" accent="#ffd700">
 * Effects: sparks | smoke | fire | ash | glow | dissolve | runes | none
 * Host it as an absolutely-positioned overlay (pointer-events:none). It (re)plays
 * whenever `effect` or `seed` changes, then fades out and idles. */
(function () {
  if (window.customElements && customElements.get('aurelion-fx')) return;

  var RUNES = ['ᚠ','ᚢ','ᚦ','ᚨ','ᚱ','ᚲ','ᚷ','ᚹ','ᚺ','ᚾ','ᛁ','ᛃ','ᛇ','ᛈ','ᛉ','ᛊ'];

  function rand(a, b) { return a + Math.random() * (b - a); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  class AurelionFx extends HTMLElement {
    static get observedAttributes() {
      return ['effect', 'intensity', 'duration-ms', 'durationms', 'seed', 'respect-reduced-motion', 'respectreducedmotion', 'accent'];
    }
    constructor() {
      super();
      this._canvas = document.createElement('canvas');
      this._ctx = this._canvas.getContext('2d');
      this._raf = null;
      this._playing = false;
      this._particles = [];
      this._canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;pointer-events:none;transition:opacity .35s ease;';
    }
    connectedCallback() {
      var pos = this.style.position;
      if (pos !== 'absolute' && pos !== 'fixed' && pos !== 'relative') {
        this.style.position = 'absolute';
        pos = 'absolute';
      }
      // Self-size: fill the (relatively-positioned) parent even if the host
      // framework dropped inset/width forwarding.
      if (pos === 'absolute' || pos === 'fixed') {
        this.style.top = '0'; this.style.left = '0';
        this.style.right = '0'; this.style.bottom = '0';
      }
      this.style.display = 'block';
      if (!this.style.width) this.style.width = '100%';
      if (!this.style.height) this.style.height = '100%';
      this.style.pointerEvents = 'none';
      this.style.overflow = 'hidden';
      // The host framework may wrap this element in a positioned container
      // (e.g. <div class="sc-host-x" style="pointer-events:auto">) that would
      // otherwise capture clicks meant for elements beneath the overlay.
      // Neutralise that single-child wrapper so the overlay never blocks input.
      var wrap = this.parentElement;
      if (wrap && wrap !== document.body && wrap.children.length === 1) {
        wrap.style.pointerEvents = 'none';
      }
      if (!this._canvas.isConnected) this.appendChild(this._canvas);
      try {
        this._ro = new ResizeObserver(() => this._resize());
        this._ro.observe(this);
      } catch (e) { /* older browser */ }
      this._resize();
      this._play();
    }
    disconnectedCallback() {
      this._stop();
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
    }
    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV || !this.isConnected) return;
      if (name === 'effect' || name === 'seed') this._play();
    }

    _num(attr, def) {
      var raw = this.getAttribute(attr);
      if (raw == null && attr.indexOf('-') >= 0) raw = this.getAttribute(attr.replace(/-/g, ''));
      var v = parseFloat(raw);
      return isNaN(v) ? def : v;
    }
    _resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = this.clientWidth || this.offsetWidth || 600;
      var h = this.clientHeight || this.offsetHeight || 400;
      this._w = w; this._h = h;
      this._canvas.width = Math.max(1, Math.round(w * dpr));
      this._canvas.height = Math.max(1, Math.round(h * dpr));
      this._ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    _reduced() {
      var r = this.getAttribute('respect-reduced-motion');
      if (r == null) r = this.getAttribute('respectreducedmotion');
      if (r === '1' || r === 'true') {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      }
      return false;
    }
    _clear() { if (this._w) this._ctx.clearRect(0, 0, this._w, this._h); }
    _stop() { this._playing = false; if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
    _fadeOut() {
      this._canvas.style.opacity = '0';
      setTimeout(() => { if (!this._playing) this._clear(); }, 380);
    }
    _tail() {
      return ({ sparks: 650, fire: 600, smoke: 1000, ash: 1300, glow: 450, dissolve: 250, runes: 700 })[this._effect] || 550;
    }

    _play() {
      var effect = this.getAttribute('effect') || 'sparks';
      this._stop();
      this._canvas.style.opacity = '1';
      this._clear();
      if (effect === 'none') return;
      this._resize();
      this._effect = effect;
      this._intensity = clamp(this._num('intensity', 6), 1, 10);
      this._duration = Math.max(200, this._num('duration-ms', 800));
      this._accent = this.getAttribute('accent') || '#ffd700';
      if (this._reduced()) {
        // Gentle: shorten and calm everything, favour a soft glow read.
        this._duration = Math.min(this._duration, 520);
        this._intensity = Math.min(this._intensity, 3);
        if (effect === 'fire' || effect === 'dissolve') this._effect = 'glow';
      }
      this._particles = [];
      this._seed();
      this._start = performance.now();
      this._last = this._start;
      this._playing = true;
      var self = this;
      var loop = function (t) {
        if (!self._playing) return;
        var dt = Math.min(50, t - self._last); self._last = t;
        var el = t - self._start;
        self._clear();
        self._step(dt, el);
        if (el > self._duration + self._tail()) { self._stop(); self._fadeOut(); return; }
        self._raf = requestAnimationFrame(loop);
      };
      this._raf = requestAnimationFrame(loop);
    }

    // ── glow-dot helper (additive) ──────────────────────────────
    _dot(x, y, r, col, a) {
      var c = this._ctx;
      c.globalAlpha = a * 0.5;
      c.fillStyle = col;
      c.beginPath(); c.arc(x, y, r * 2.4, 0, 6.2832); c.fill();
      c.globalAlpha = a;
      c.beginPath(); c.arc(x, y, r, 0, 6.2832); c.fill();
    }
    // radial wash that peaks early then fades
    _flash(el, col, peak, maxA) {
      if (el > peak * 4) return;
      var a = el < peak ? (el / peak) : Math.max(0, 1 - (el - peak) / (peak * 3));
      a *= maxA;
      if (a <= 0) return;
      var c = this._ctx, w = this._w, h = this._h;
      var g = c.createRadialGradient(w / 2, h * 0.5, 0, w / 2, h * 0.5, Math.max(w, h) * 0.7);
      g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.globalAlpha = a; c.fillStyle = g;
      c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    }

    _seed() {
      var w = this._w, h = this._h, n = this._intensity, e = this._effect, i, p, k = n / 6;
      if (e === 'sparks') {
        var cx = w / 2, cy = h * 0.6, count = Math.round(26 + n * 12);
        for (i = 0; i < count; i++) {
          var ang = rand(-Math.PI, Math.PI), sp = rand(50, 240) * (0.6 + k * 0.5);
          this._particles.push({
            x: cx + rand(-30, 30), y: cy + rand(-20, 20),
            vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - rand(20, 90),
            r: rand(1, 3.4), life: 0, max: rand(0.55, 1) * this._duration, tw: rand(0, 6.28)
          });
        }
      } else if (e === 'ash') {
        var ca = Math.round(28 + n * 9);
        for (i = 0; i < ca; i++) {
          this._particles.push({
            x: rand(0, w), y: rand(-h * 0.3, h * 0.5),
            vx: rand(-8, 8), vy: rand(18, 55) * (0.7 + k * 0.4),
            r: rand(1, 2.8), life: 0, max: rand(0.7, 1.3) * this._duration,
            sway: rand(0.4, 1.4), ph: rand(0, 6.28), ember: Math.random() < 0.16
          });
        }
      } else if (e === 'smoke') {
        var cs = Math.round(5 + n);
        for (i = 0; i < cs; i++) {
          this._particles.push({
            x: rand(w * 0.25, w * 0.75), y: rand(h * 0.55, h * 0.95),
            vx: rand(-14, 14), vy: -rand(12, 34), r: rand(36, 82),
            gr: rand(18, 44), life: 0, max: rand(0.7, 1) * this._duration
          });
        }
      }
      // fire / glow / dissolve / runes draw procedurally in _step
    }

    _step(dt, el) {
      var e = this._effect;
      if (e === 'sparks') return this._sparks(dt, el);
      if (e === 'fire') return this._fire(dt, el);
      if (e === 'smoke') return this._smoke(dt, el);
      if (e === 'ash') return this._ash(dt, el);
      if (e === 'glow') return this._glow(dt, el);
      if (e === 'dissolve') return this._dissolve(dt, el);
      if (e === 'runes') return this._runes(dt, el);
    }

    _sparks(dt, el) {
      var c = this._ctx, s = dt / 1000;
      this._flash(el, this._accent, this._duration * 0.16, 0.32);
      c.globalCompositeOperation = 'lighter';
      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i]; p.life += dt;
        p.vy += 120 * s; p.vx *= 0.985; p.vy *= 0.985;
        p.x += p.vx * s; p.y += p.vy * s; p.tw += dt * 0.012;
        var t = p.life / p.max; if (t >= 1) continue;
        var a = (1 - t) * (0.7 + 0.3 * Math.sin(p.tw));
        var col = Math.random() < 0.15 ? '#fff6d0' : this._accent;
        this._dot(p.x, p.y, p.r * (0.7 + 0.5 * Math.sin(p.tw)), col, clamp(a, 0, 1));
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    _fire(dt, el) {
      var c = this._ctx, w = this._w, h = this._h, s = dt / 1000;
      // bottom warm glow
      var gl = c.createLinearGradient(0, h, 0, h * 0.5);
      var fade = clamp(1 - el / (this._duration * 1.1), 0, 1);
      gl.addColorStop(0, 'rgba(255,120,20,' + (0.42 * fade) + ')');
      gl.addColorStop(1, 'rgba(255,120,20,0)');
      c.fillStyle = gl; c.fillRect(0, 0, w, h);
      // emit
      if (el < this._duration * 0.72) {
        var em = Math.round(2 + this._intensity * 0.9);
        for (var j = 0; j < em; j++) {
          this._particles.push({
            x: rand(0, w), y: h + 6, vx: rand(-24, 24), vy: -rand(70, 150) * (0.7 + this._intensity / 14),
            r: rand(5, 15), life: 0, max: rand(420, 900), fl: rand(0, 6.28)
          });
        }
      }
      c.globalCompositeOperation = 'lighter';
      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i]; p.life += dt;
        var t = p.life / p.max; if (t >= 1) continue;
        p.vy *= 0.99; p.vx += Math.sin(p.fl + p.life * 0.01) * 6 * s;
        p.x += p.vx * s; p.y += p.vy * s;
        var col = t < 0.3 ? '#fff2c0' : t < 0.6 ? '#ffb020' : '#ff5a12';
        this._dot(p.x, p.y, p.r * (1 - t * 0.7), col, (1 - t) * 0.85);
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    _smoke(dt, el) {
      var c = this._ctx, s = dt / 1000;
      if (el < this._duration * 0.5 && Math.random() < 0.4) {
        this._particles.push({
          x: rand(this._w * 0.3, this._w * 0.7), y: this._h * rand(0.6, 0.9),
          vx: rand(-14, 14), vy: -rand(12, 30), r: rand(30, 60), gr: rand(20, 40),
          life: 0, max: rand(0.6, 1) * this._duration
        });
      }
      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i]; p.life += dt;
        var t = p.life / p.max; if (t >= 1) continue;
        p.x += p.vx * s; p.y += p.vy * s; p.r += p.gr * s;
        var a = Math.sin(Math.min(1, t) * Math.PI) * 0.26;
        var g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, 'rgba(205,208,220,' + a + ')');
        g.addColorStop(1, 'rgba(160,164,180,0)');
        c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
      }
    }

    _ash(dt, el) {
      var c = this._ctx, s = dt / 1000;
      for (var i = 0; i < this._particles.length; i++) {
        var p = this._particles[i]; p.life += dt;
        var t = p.life / p.max; if (t >= 1) continue;
        p.ph += dt * 0.003 * p.sway;
        p.x += (p.vx + Math.sin(p.ph) * 14) * s; p.y += p.vy * s;
        var a = Math.sin(Math.min(1, t) * Math.PI) * 0.9;
        if (p.ember) {
          c.globalCompositeOperation = 'lighter';
          this._dot(p.x, p.y, p.r, '#ff7a1a', a * 0.9);
          c.globalCompositeOperation = 'source-over';
        } else {
          c.globalAlpha = a * 0.6; c.fillStyle = '#9a9aa2';
          c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.2832); c.fill();
        }
      }
      c.globalAlpha = 1;
    }

    _glow(dt, el) {
      var c = this._ctx, w = this._w, h = this._h, cx = w / 2, cy = h * 0.5;
      var p = clamp(el / this._duration, 0, 1), ep = easeOut(p);
      this._flash(el, this._accent, this._duration * 0.28, 0.4);
      // expanding ring
      var R = ep * Math.min(w, h) * 0.5;
      var a = Math.sin(p * Math.PI);
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = this._accent; c.globalAlpha = a * 0.8; c.lineWidth = 2.5 * (1 - p) + 0.5;
      c.shadowColor = this._accent; c.shadowBlur = 24;
      c.beginPath(); c.arc(cx, cy, R, 0, 6.2832); c.stroke();
      c.shadowBlur = 0;
      // a few drifting motes
      if (el < 30) {
        for (var i = 0; i < Math.round(6 + this._intensity * 2); i++) {
          this._particles.push({ x: cx, y: cy, vx: rand(-70, 70), vy: rand(-70, 70), r: rand(1, 2.6), life: 0, max: this._duration * rand(0.6, 1) });
        }
      }
      var s = dt / 1000;
      for (var k = 0; k < this._particles.length; k++) {
        var q = this._particles[k]; q.life += dt; var t = q.life / q.max; if (t >= 1) continue;
        q.x += q.vx * s; q.y += q.vy * s;
        this._dot(q.x, q.y, q.r, '#fff6d0', (1 - t) * 0.9);
      }
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    _dissolve(dt, el) {
      var c = this._ctx, w = this._w, h = this._h;
      var p = clamp(el / this._duration, 0, 1);
      var amt = 1 - p; // glitch calms as it resolves
      var bands = Math.round((4 + this._intensity) * amt) + 1;
      c.globalCompositeOperation = 'lighter';
      var cols = ['rgba(255,215,0,', 'rgba(100,149,237,', 'rgba(255,255,255,'];
      for (var i = 0; i < bands; i++) {
        var by = rand(0, h), bh = rand(2, 20 * amt + 3), off = rand(-40, 40) * amt;
        var col = cols[(Math.random() * cols.length) | 0];
        c.fillStyle = col + (rand(0.05, 0.28) * amt) + ')';
        c.fillRect(off, by, w, bh);
      }
      // scanline sweep
      var sy = ((el / this._duration) * h * 1.4) - h * 0.2;
      var g = c.createLinearGradient(0, sy - 40, 0, sy + 40);
      g.addColorStop(0, 'rgba(255,215,0,0)');
      g.addColorStop(0.5, 'rgba(255,215,0,' + (0.22 * amt) + ')');
      g.addColorStop(1, 'rgba(255,215,0,0)');
      c.fillStyle = g; c.fillRect(0, sy - 40, w, 80);
      // sparse noise dots
      var nd = Math.round(60 * amt);
      c.fillStyle = 'rgba(255,255,255,' + (0.4 * amt) + ')';
      for (var j = 0; j < nd; j++) c.fillRect(rand(0, w), rand(0, h), 2, 2);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }

    _runes(dt, el) {
      var c = this._ctx, w = this._w, h = this._h, cx = w / 2, cy = h * 0.5;
      var p = clamp(el / this._duration, 0, 1);
      var R = Math.min(w, h) * 0.4;
      var fadeIn = clamp(p / 0.25, 0, 1);
      var fadeOut = clamp((1 - p) / 0.25, 0, 1);
      var a = Math.min(fadeIn, fadeOut);
      var rot = el * 0.0006;
      c.save();
      c.translate(cx, cy);
      c.globalCompositeOperation = 'lighter';
      c.strokeStyle = this._accent; c.shadowColor = this._accent; c.shadowBlur = 12;
      // concentric circles
      c.globalAlpha = a * 0.85; c.lineWidth = 1.5;
      c.beginPath(); c.arc(0, 0, R, 0, 6.2832); c.stroke();
      c.beginPath(); c.arc(0, 0, R * 0.7, 0, 6.2832); c.stroke();
      c.globalAlpha = a * 0.5;
      c.beginPath(); c.arc(0, 0, R * 0.86, 0, 6.2832); c.stroke();
      // rotating tick marks
      c.save(); c.rotate(rot); c.globalAlpha = a * 0.6; c.lineWidth = 1;
      for (var t = 0; t < 36; t++) {
        var ang = (t / 36) * 6.2832;
        c.beginPath();
        c.moveTo(Math.cos(ang) * R * 0.72, Math.sin(ang) * R * 0.72);
        c.lineTo(Math.cos(ang) * R * 0.84, Math.sin(ang) * R * 0.84);
        c.stroke();
      }
      c.restore();
      // hexagram
      c.save(); c.rotate(-rot * 1.4); c.globalAlpha = a * 0.4; c.lineWidth = 1;
      for (var tri = 0; tri < 2; tri++) {
        c.beginPath();
        for (var v = 0; v <= 3; v++) {
          var ta = (v / 3) * 6.2832 + tri * Math.PI + Math.PI / 6;
          var px = Math.cos(ta) * R * 0.66, py = Math.sin(ta) * R * 0.66;
          if (v === 0) c.moveTo(px, py); else c.lineTo(px, py);
        }
        c.stroke();
      }
      c.restore();
      // runes igniting sequentially around the ring
      var count = 12;
      c.font = (R * 0.12) + "px 'Cinzel', Georgia, serif";
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = this._accent; c.shadowBlur = 16;
      for (var r = 0; r < count; r++) {
        var ig = clamp((p - (r / count) * 0.55) / 0.18, 0, 1);
        var ang2 = (r / count) * 6.2832 - Math.PI / 2 + rot;
        c.globalAlpha = a * ig;
        c.fillText(RUNES[r % RUNES.length], Math.cos(ang2) * R * 0.93, Math.sin(ang2) * R * 0.93);
      }
      c.shadowBlur = 0; c.restore();
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    }
  }

  customElements.define('aurelion-fx', AurelionFx);
})();
