// Черга в арках (бета). Спільна для кабінету й шапки сайту.
// Правило: наступний — той, хто найдавніше відписував серед активних.
// Кілька дописів поспіль від одного персонажа — один хід.
// «Випав з черги» — після нього минуло два кола без нього,
// або його останній допис старший за останній у арці на OUT_DAYS.
// Підписка (`follow`): арку видно й без своїх дописів (стан `watch`),
// а «за кого» з підписки рахується вашим персонажем у цій арці (`viaAs`).
// Передача ходу (`passes`) — хід без допису; «кому» діє, поки ніхто не писав.
(function () {
  const DAY = 86400000;
  const OUT_DAYS = 14;

  function arcRows(a) {
    // Один персонаж може прийти під двома ключами: допис з character_id
    // (k = id) і допис, де бот не впізнав анкету (k = ім'я). Тоді власний
    // останній допис рахувався «чужим», і черга казала «ваш хід».
    // Зводимо ключ по імені до того, що має id.
    const nm = (s) => String(s || '').trim().toLowerCase();
    const byName = {}, mineName = {}, realK = {};
    (a.seq || []).forEach((p) => {
      if (!p || !p.k) return;
      if (p.id && !byName[nm(p.name)]) byName[nm(p.name)] = p.k;
      if (p.mine) mineName[nm(p.name)] = true;
    });
    const fix = (k, name) => (byName[nm(k)] || (!/^\d+$/.test(String(k)) && byName[nm(name)]) || k);
    const posts = [];
    (a.seq || []).forEach((p0) => {
      if (!p0 || !p0.k) return;
      const p = Object.assign({}, p0);
      if (!p.id && byName[nm(p.name)]) p.k = byName[nm(p.name)];
      if (mineName[nm(p.name)]) p.mine = true;
      realK[p.k] = true;
      posts.push(p);
    });
    // Передача ходу (arc_passes) — «допис без тексту»: передавач іде в кінець
    // кола. Беремо лише тих, хто в арці справді писав, — інакше передача
    // вписала б у чергу нового учасника.
    const passes = (a.passes || []).map((x) => ({
      k: fix(x.from, x.from_name), id: null, name: x.from_name || '', at: x.at, pass: true,
      to: x.to ? fix(x.to, x.to_name) : null, toName: x.to_name || '', byMe: !!x.mine, nick: x.nick,
    })).filter((x) => realK[x.k]);
    const ev = posts.concat(passes).map((p, i) => ({ p, i, t: new Date(p.at).getTime() }))
      .sort((x, y) => (x.t - y.t) || ((x.p.pass ? 1 : 0) - (y.p.pass ? 1 : 0)) || (x.i - y.i))
      .map((x) => x.p);

    const seq = [];
    ev.forEach((p) => {
      const t = seq[seq.length - 1];
      if (t && t.k === p.k) {
        t.at = p.at; t.pass = !!p.pass;
        if (p.pass) Object.assign(t, { to: p.to, toName: p.toName, byMe: p.byMe, nick: p.nick });
        else { t.post = p.post; t.parts++; t.realAt = p.at; }
      } else seq.push(Object.assign({}, p, { parts: p.pass ? 0 : 1, realAt: p.pass ? null : p.at }));
    });
    if (!posts.length) return [];
    const by = {};
    seq.forEach((p, i) => {
      const c = by[p.k] || (by[p.k] = { k: p.k, id: null, name: p.name, mine: false, viaAs: false, n: 0, at: null });
      if (p.as) c.viaAs = true;
      c.last = i; c.n++;
      if (p.realAt) c.at = p.realAt;
      if (p.id) c.id = p.id;
      if (p.name && !p.pass) c.name = p.name;
      else if (p.name && !c.name) c.name = p.name;
      if (p.mine) c.mine = true;
    });
    const all = Object.keys(by).map((k) => by[k]);
    const N = all.length;
    const lastEv = seq[seq.length - 1];
    let lastReal = lastEv;
    for (let i = seq.length - 1; i >= 0; i--) if (seq[i].realAt) { lastReal = seq[i]; break; }
    const lastT = new Date(lastReal.realAt || lastReal.at).getTime();
    const lastEvT = new Date(lastEv.at).getTime();
    all.forEach((c) => {
      c.after = seq.length - 1 - c.last;
      c.out = N > 1 && ((N > 2 && c.after >= 2 * (N - 1)) || lastEvT - new Date(c.at || lastEv.at).getTime() > OUT_DAYS * DAY);
    });
    // Передали хід комусь конкретно — він перший, поки ніхто не написав.
    const passEv = lastEv.pass ? lastEv : null;
    const passTo = passEv && passEv.to ? by[passEv.to] || null : null;
    if (passTo && passTo.k !== lastEv.k) passTo.out = false;
    const queue = all.filter((c) => !c.out).sort((x, y) => x.last - y.last);
    if (passTo && passTo.k !== lastEv.k) { queue.splice(queue.indexOf(passTo), 1); queue.unshift(passTo); }
    queue.forEach((c, i) => { c.pos = i; });
    // Відмітка «закрито» чинна, поки після неї ніхто не писав. Новий допис
    // відкриває арку сам: хтось усе ж вирішив, що сцена триває.
    const marks = (a.marks || []).map((m) => Object.assign({}, m, { t: new Date(m.at).getTime() }));
    const closedBy = marks.filter((m) => m.t >= lastT);
    const staleBy = marks.filter((m) => m.t < lastT);
    const closed = closedBy.length > 0;
    // Останній хід ваш (будь-яким із ваших персонажів) — на вас не чекають.
    const lastMine = !!(by[lastEv.k] && by[lastEv.k].mine);

    const follow = a.follow || null;
    const common = {
      arc: a.arc, queue, follow,
      lastBy: by[lastReal.k], lastAt: lastReal.realAt || lastReal.at, lastPost: lastReal.post,
      waitMs: Date.now() - lastEvT,
      dropped: all.filter((o) => o.out && !o.mine),
      all,
      pass: passEv ? { by: by[passEv.k], to: passTo, at: passEv.at, mine: !!passEv.byMe, nick: passEv.nick } : null,
      closedBy, staleBy, closed,
      markedByMe: closedBy.some((m) => m.mine),
    };
    const mineList = all.filter((c) => c.mine);
    // Підписка без власних дописів: арку видно, але черга не ваша —
    // або ви просто стежите, або ваш «за кого» ще не писав.
    if (!mineList.length) {
      if (!follow) return [];
      const nmAs = (follow.as || '').trim();
      return [Object.assign({}, common, {
        me: { k: '~watch', id: null, name: nmAs, mine: false, viaAs: !!nmAs, at: null, after: 0, watch: true },
        state: closed ? 'closed' : 'watch', watching: true,
        ahead: [], up: queue[0] || null,
      })];
    }
    return mineList.map((c) => {
      let state;
      if (closed) state = 'closed';
      else if (passEv && passEv.k === c.k) state = 'passed';
      else if (c.out) state = 'out';
      else if (queue.length < 2) state = 'solo';
      else if (c.pos === 0) state = lastMine ? 'done' : 'turn';
      else if (c.pos === queue.length - 1) state = 'done';
      else if (c.pos === 1) state = 'next';
      else state = 'wait';
      return Object.assign({}, common, {
        me: c, state, watching: false,
        ahead: c.out ? [] : queue.slice(0, c.pos),
        up: queue.find((o) => !o.mine) || queue[0] || null,
      });
    });
  }

  const W = { turn: 0, next: 1, wait: 2, out: 3, passed: 4, done: 4, watch: 5, solo: 6, closed: 7 };
  function rows(d) {
    const out = [];
    ((d && d.arcs) || []).forEach((a) => { arcRows(a).forEach((r) => out.push(r)); });
    out.sort((x, y) => (W[x.state] - W[y.state])
      || (x.state === 'turn' ? y.waitMs - x.waitMs : x.ahead.length - y.ahead.length)
      || String(x.arc).localeCompare(String(y.arc), 'uk'));
    return out;
  }
  function yourTurn(d) { return rows(d).filter((r) => r.state === 'turn').length; }

  window.AuTurns = { rows, yourTurn, OUT_DAYS };
})();
