/* ═══════════════════════════════════════════════════════════════
   Aurelion UA — плеєр-грамофон
   Одна панель унизу вікна на весь застосунок. Живе ПОЗА React-деревом
   (сама вставляє себе в document.body): будь-яке перемалювання стрічки
   або перехід між розділами перемонтувало б iframe, а перемонтований
   iframe YouTube — це музика, що спинилася на півслові.

   Хто вміє її кликати:
     AuPlayer.play(track, queue)   — почати з цього треку (черга — сусіди)
     AuPlayer.playQueue(list, i)   — «грати все» з i-го
     AuPlayer.current()            — {vid, playing} або null
     AuPlayer.onChange(fn)         — сповіщення для позначок ♪ у стрічці

   track = { vid, title, author, name, arc, postId }
   ═══════════════════════════════════════════════════════════════ */
(function () {
  if (window.AuPlayer) return;

  var KEY = 'au_player';          // що грало й на якій секунді
  var subs = [];
  var Q = [];                     // черга
  var at = -1;                    // місце в черзі
  var yt = null;                  // YT.Player
  var ready = false;              // API під'їхало і плеєр створений
  var pending = null;             // трек, який попросили до того
  var playing = false;
  var big = false;
  var el = {};
  var tick = null;

  /* ── Пам'ять ───────────────────────────────────────────────
     Вкладку закрили посеред пісні — після повернення панель стоїть на
     тому самому треку й тій самій секунді, але МОВЧИТЬ: музика, що сама
     заграла на відкритті сторінки, — це не сервіс, а засідка. */
  function save() {
    try {
      var t = Q[at];
      if (!t) { localStorage.removeItem(KEY); return; }
      localStorage.setItem(KEY, JSON.stringify({
        q: Q, at: at, t: Math.floor(pos()), when: Date.now(),
      }));
    } catch (e) {}
  }
  function load() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!d || !d.q || !d.q.length) return null;
      return d;
    } catch (e) { return null; }
  }

  function pos() { try { return yt && yt.getCurrentTime ? yt.getCurrentTime() : 0; } catch (e) { return 0; } }
  function dur() { try { return yt && yt.getDuration ? yt.getDuration() : 0; } catch (e) { return 0; } }

  function fire() {
    var t = Q[at] || null;
    subs.forEach(function (fn) { try { fn(t ? t.vid : null, playing); } catch (e) {} });
  }

  /* ── Панель ──────────────────────────────────────────────── */
  function css(node, s) { for (var k in s) node.style[k] = s[k]; }
  function mk(tag, s, txt) {
    var n = document.createElement(tag);
    if (s) css(n, s);
    if (txt != null) n.textContent = txt;
    return n;
  }
  function btn(label, title, s) {
    var b = mk('button', Object.assign({
      cursor: 'pointer', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.16)', color: 'rgba(255,255,255,0.75)',
      borderRadius: '999px', font: '400 0.9rem/1 Arial, sans-serif',
      width: '34px', height: '34px', display: 'flex', alignItems: 'center',
      justifyContent: 'center', flex: 'none', transition: 'all 0.25s ease', padding: '0',
    }, s || {}), label);
    b.title = title || '';
    b.onmouseenter = function () { b.style.color = '#fff'; b.style.background = 'rgba(255,255,255,0.12)'; };
    b.onmouseleave = function () { b.style.color = s && s.color ? s.color : 'rgba(255,255,255,0.75)'; b.style.background = s && s.background ? s.background : 'rgba(255,255,255,0.05)'; };
    return b;
  }

  function build() {
    var bar = mk('div', {
      position: 'fixed', left: '0', right: '0', bottom: '0', zIndex: '2147483000',
      background: 'rgba(26,26,26,0.94)', backdropFilter: 'blur(10px)',
      webkitBackdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,215,0,0.22)',
      boxShadow: '0 -14px 44px rgba(0,0,0,0.55)',
      transform: 'translateY(110%)', transition: 'transform 0.32s ease',
      fontFamily: 'Arial, sans-serif',
    });

    // Смужка часу — і показник, і перемотка.
    var line = mk('div', {
      height: '3px', background: 'rgba(255,255,255,0.09)', cursor: 'pointer', position: 'relative',
    });
    var fill = mk('div', {
      position: 'absolute', left: '0', top: '0', bottom: '0', width: '0%',
      background: 'linear-gradient(90deg,rgba(255,215,0,0.55),#ffd700)',
    });
    line.appendChild(fill);
    line.onclick = function (e) {
      var r = line.getBoundingClientRect(), d = dur();
      if (!d || !yt) return;
      try { yt.seekTo(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * d, true); } catch (x) {}
    };

    var row = mk('div', {
      display: 'flex', alignItems: 'center', gap: '14px',
      maxWidth: '1200px', margin: '0 auto', padding: '10px 18px 12px',
      flexWrap: 'wrap',
    });

    // Кадр із відео. YouTube віддає звук лише разом із картинкою, тому
    // ховати його зовсім не можна — тримаємо малим і даємо збільшити.
    var frame = mk('div', {
      width: '104px', height: '59px', flex: 'none', borderRadius: '8px',
      overflow: 'hidden', border: '1px solid rgba(255,255,255,0.14)',
      background: '#000', transition: 'width 0.28s ease,height 0.28s ease',
      position: 'relative',
    });
    var host = mk('div', { width: '100%', height: '100%' });
    frame.appendChild(host);
    var zoom = btn('⤢', 'Показати відео більшим', {
      position: 'absolute', right: '3px', bottom: '3px', width: '22px', height: '22px',
      background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)', fontSize: '0.7rem',
    });
    zoom.onclick = function () {
      big = !big;
      css(frame, big ? { width: '272px', height: '153px' } : { width: '104px', height: '59px' });
    };
    frame.appendChild(zoom);

    var mid = mk('div', { flex: '1 1 200px', minWidth: '0' });
    var kicker = mk('p', {
      margin: '0 0 3px', font: '400 0.6rem/1 Arial, sans-serif', letterSpacing: '0.2em',
      textTransform: 'uppercase', color: 'rgba(255,215,0,0.7)',
    }, '✦ Грає');
    var title = mk('p', {
      margin: '0', font: "700 0.98rem/1.3 'Cinzel', Georgia, serif", letterSpacing: '0.03em',
      color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }, '—');
    var sub = mk('a', {
      display: 'block', marginTop: '3px', font: "italic 0.86rem/1.3 'EB Garamond', Georgia, serif",
      color: 'rgba(255,255,255,0.46)', textDecoration: 'none', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }, '');
    sub.onmouseenter = function () { sub.style.color = 'rgba(255,255,255,0.78)'; };
    sub.onmouseleave = function () { sub.style.color = 'rgba(255,255,255,0.46)'; };
    mid.appendChild(kicker); mid.appendChild(title); mid.appendChild(sub);

    var ctl = mk('div', { display: 'flex', alignItems: 'center', gap: '8px', flex: 'none' });
    var prev = btn('‹', 'Попередній трек');
    var play = btn('▶', 'Грати', {
      width: '42px', height: '42px', fontSize: '1rem',
      background: 'rgba(255,215,0,0.14)', border: '1px solid rgba(255,215,0,0.45)', color: '#ffd700',
    });
    var next = btn('›', 'Наступний трек');
    var count = mk('span', {
      font: '400 0.7rem/1 Arial, sans-serif', color: 'rgba(255,255,255,0.3)',
      letterSpacing: '0.08em', minWidth: '38px', textAlign: 'center',
    }, '');
    var shut = btn('✕', 'Зупинити й закрити');
    prev.onclick = function () { step(-1); };
    next.onclick = function () { step(1); };
    play.onclick = toggle;
    shut.onclick = stop;
    [prev, play, next, count, shut].forEach(function (n) { ctl.appendChild(n); });

    row.appendChild(frame); row.appendChild(mid); row.appendChild(ctl);
    bar.appendChild(line); bar.appendChild(row);
    document.body.appendChild(bar);

    el = { bar: bar, fill: fill, host: host, title: title, sub: sub, play: play, count: count, prev: prev, next: next, frame: frame };
  }

  function show(on) {
    if (!el.bar) return;
    el.bar.style.transform = on ? 'translateY(0)' : 'translateY(110%)';
    // Панель перекриває низ сторінки — відсуваємо вміст, а не накриваємо його.
    document.body.style.paddingBottom = on ? '96px' : '';
  }

  function paint() {
    var t = Q[at];
    if (!t) return;
    el.title.textContent = t.title || 'Трек із допису';
    var bits = [];
    if (t.name) bits.push(t.name);
    if (t.arc) bits.push(t.arc);
    if (!bits.length && t.author) bits.push(t.author);
    el.sub.textContent = bits.join(' · ') + (t.postId ? ' — до допису ↗' : '');
    el.sub.href = t.postId ? '#posts/' + encodeURIComponent(t.postId) : 'javascript:void(0)';
    el.play.textContent = playing ? '❙❙' : '▶';
    el.play.title = playing ? 'Пауза' : 'Грати';
    el.count.textContent = Q.length > 1 ? (at + 1) + ' / ' + Q.length : '';
    var one = Q.length < 2;
    el.prev.style.opacity = one ? '0.25' : '1';
    el.next.style.opacity = one ? '0.25' : '1';
    fire();
  }

  function meter() {
    var d = dur();
    el.fill.style.width = d ? Math.min(100, (pos() / d) * 100) + '%' : '0%';
  }

  /* ── YouTube IFrame API ──────────────────────────────────── */
  function api(cb) {
    if (window.YT && window.YT.Player) { cb(); return; }
    var prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = function () {
      if (typeof prev === 'function') { try { prev(); } catch (e) {} }
      cb();
    };
    if (!document.querySelector('script[data-au-yt]')) {
      var s = document.createElement('script');
      s.src = 'https://www.youtube.com/iframe_api';
      s.setAttribute('data-au-yt', '1');
      document.head.appendChild(s);
    }
  }

  function make(vid, seek, auto) {
    api(function () {
      if (yt) { swap(vid, seek, auto); return; }
      yt = new window.YT.Player(el.host, {
        videoId: vid,
        playerVars: {
          autoplay: auto ? 1 : 0, playsinline: 1, rel: 0, modestbranding: 1,
          controls: 0, disablekb: 1, iv_load_policy: 3, start: Math.floor(seek || 0),
        },
        events: {
          onReady: function () {
            ready = true;
            if (pending) { var p = pending; pending = null; swap(p.vid, p.seek, p.auto); }
            else if (auto) { try { yt.playVideo(); } catch (e) {} }
            named();
          },
          onStateChange: function (e) {
            var S = window.YT.PlayerState;
            playing = e.data === S.PLAYING;
            if (e.data === S.ENDED) { step(1, true); return; }
            if (playing) named();
            paint(); save();
          },
          onError: function () {
            // Пісню зняли з YouTube або заборонили вбудовування — це не
            // причина спиняти чергу. Через секунду беремо наступну.
            var t = Q[at];
            el.title.textContent = (t && t.title) || 'Цей трек не грає';
            el.sub.textContent = 'YouTube не дав його відтворити' + (Q.length > 1 ? ' — беру наступний' : '');
            if (Q.length > 1) setTimeout(function () { step(1, true); }, 1200);
          },
        },
      });
    });
  }

  function swap(vid, seek, auto) {
    if (!ready) { pending = { vid: vid, seek: seek, auto: auto }; return; }
    try {
      if (auto) yt.loadVideoById({ videoId: vid, startSeconds: Math.floor(seek || 0) });
      else yt.cueVideoById({ videoId: vid, startSeconds: Math.floor(seek || 0) });
    } catch (e) {}
    named();
  }

  /* Назва з бази буває порожня (бот не встиг, архів не дозаповнили) —
     тоді беремо ту, що плеєр і так знає про завантажене відео. */
  function named() {
    setTimeout(function () {
      var t = Q[at];
      if (!t || t.title) return;
      try {
        var d = yt.getVideoData && yt.getVideoData();
        if (d && d.title) { t.title = d.title; if (!t.author) t.author = d.author; paint(); }
      } catch (e) {}
    }, 700);
  }

  function step(d, auto) {
    if (!Q.length) return;
    var n = at + d;
    if (n < 0) n = Q.length - 1;
    if (n >= Q.length) { if (!auto) n = 0; else { stop(); return; } }
    at = n;
    swap(Q[at].vid, 0, true);
    playing = true;
    paint(); save();
  }

  function toggle() {
    if (!yt) return;
    try { playing ? yt.pauseVideo() : yt.playVideo(); } catch (e) {}
  }

  function stop() {
    try { if (yt) yt.stopVideo(); } catch (e) {}
    playing = false;
    show(false);
    Q = []; at = -1;
    try { localStorage.removeItem(KEY); } catch (e) {}
    fire();
  }

  function start(queue, i, seek, auto) {
    if (!el.bar) build();
    Q = (queue || []).filter(function (t) { return t && t.vid; });
    at = Math.max(0, Math.min(Q.length - 1, i || 0));
    if (!Q.length) return;
    show(true);
    paint();
    playing = !!auto;
    if (!yt) make(Q[at].vid, seek, auto);
    else swap(Q[at].vid, seek, auto);
    if (!tick) tick = setInterval(function () { if (el.bar) { meter(); if (playing) save(); } }, 900);
  }

  window.AuPlayer = {
    play: function (track, queue) {
      var list = (queue && queue.length) ? queue : [track];
      var i = list.findIndex(function (t) { return t && t.vid === track.vid && (t.postId == null || t.postId === track.postId); });
      start(list, i < 0 ? 0 : i, 0, true);
    },
    playQueue: function (list, i) { start(list, i || 0, 0, true); },
    current: function () { var t = Q[at]; return t ? { vid: t.vid, playing: playing } : null; },
    toggle: toggle,
    stop: stop,
    onChange: function (fn) { if (typeof fn === 'function') subs.push(fn); },
    // Панель повертається з пам'яті на паузі — жодного звуку без кліку.
    restore: function () {
      var d = load();
      if (!d || Q.length) return false;
      start(d.q, d.at, d.t, false);
      return true;
    },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { window.AuPlayer.restore(); });
  } else {
    setTimeout(function () { window.AuPlayer.restore(); }, 0);
  }

  /* ── Назви треків ──────────────────────────────────────────
     Назву в базу кладе бот, а старий архів вилито міграцією — там її
     немає взагалі. Виявилося, що YouTube віддає oEmbed і в браузер (CORS
     відкритий), тому сторінка добирає назви сама й не чекає на
     /telegram-report?tracks=1. Свій кеш у localStorage: та сама пісня
     стоїть у десятках дописів, і платити за неї щоразу немає за що. */
  var TKEY = 'au_titles';
  var mem = null;

  function shelf() {
    if (mem) return mem;
    try { mem = JSON.parse(localStorage.getItem(TKEY) || '{}'); } catch (e) { mem = {}; }
    return mem;
  }
  function keep(vid, rec) {
    var s = shelf();
    s[vid] = rec;
    try { localStorage.setItem(TKEY, JSON.stringify(s)); } catch (e) {}
  }

  function one(vid) {
    return fetch(
      'https://www.youtube.com/oembed?format=json&url=' +
      encodeURIComponent('https://www.youtube.com/watch?v=' + vid)
    ).then(function (r) {
      // Знято або приватне — записуємо заглушку, інакше кожен захід
      // сторінки бився б об ті самі мертві посилання.
      if (!r.ok) { keep(vid, { t: r.status === 404 || r.status === 401 ? 'Відео недоступне' : '', a: '' }); return; }
      return r.json().then(function (d) {
        keep(vid, { t: (d && d.title) || '', a: (d && d.author_name) || '' });
      });
    }).catch(function () { /* мережа — спробуємо наступного разу */ });
  }

  window.AuTitles = {
    known: function () { return shelf(); },
    // Пачками по п'ять: сотня карток одним залпом виглядає для YouTube
    // як напад, а нам потрібні лише ті, що на видноті.
    fetch: function (vids, done) {
      var need = (vids || []).filter(function (v) { return v && !shelf()[v]; });
      if (!need.length) { if (done) done(shelf(), false); return; }
      var i = 0;
      var lane = function () {
        if (i >= need.length) return Promise.resolve();
        return one(need[i++]).then(lane);
      };
      Promise.all([lane(), lane(), lane(), lane(), lane()])
        .then(function () { if (done) done(shelf(), true); });
    },
  };
})();
