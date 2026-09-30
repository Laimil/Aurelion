// Черга в арках (бета). Спільна для кабінету й шапки сайту.
// Правило: наступний — той, хто найдавніше відписував серед активних.
// Кілька дописів поспіль від одного персонажа — один хід.
// «Випав з черги» — після нього минуло два кола без нього,
// або його останній допис старший за останній у арці на OUT_DAYS.
(function () {
  const DAY = 86400000;
  const OUT_DAYS = 14;

  function arcRows(a) {
    const seq = [];
    (a.seq || []).forEach((p) => {
      if (!p || !p.k) return;
      const t = seq[seq.length - 1];
      if (t && t.k === p.k) { t.at = p.at; t.post = p.post; t.parts++; }
      else seq.push(Object.assign({}, p, { parts: 1 }));
    });
    if (!seq.length) return [];
    const by = {};
    seq.forEach((p, i) => {
      const c = by[p.k] || (by[p.k] = { k: p.k, id: null, name: p.name, mine: false, n: 0 });
      c.last = i; c.at = p.at; c.n++;
      if (p.id) c.id = p.id;
      if (p.name) c.name = p.name;
      if (p.mine) c.mine = true;
    });
    const all = Object.keys(by).map((k) => by[k]);
    const N = all.length;
    const lastT = new Date(seq[seq.length - 1].at).getTime();
    all.forEach((c) => {
      c.after = seq.length - 1 - c.last;
      c.out = N > 1 && ((N > 2 && c.after >= 2 * (N - 1)) || lastT - new Date(c.at).getTime() > OUT_DAYS * DAY);
    });
    const queue = all.filter((c) => !c.out).sort((x, y) => x.last - y.last);
    queue.forEach((c, i) => { c.pos = i; });
    const lastBy = seq[seq.length - 1];
    // Відмітка «закрито» чинна, поки після неї ніхто не писав. Новий допис
    // відкриває арку сам: хтось усе ж вирішив, що сцена триває.
    const marks = (a.marks || []).map((m) => Object.assign({}, m, { t: new Date(m.at).getTime() }));
    const closedBy = marks.filter((m) => m.t >= lastT);
    const staleBy = marks.filter((m) => m.t < lastT);
    const closed = closedBy.length > 0;

    return all.filter((c) => c.mine).map((c) => {
      let state;
      if (closed) state = 'closed';
      else if (c.out) state = 'out';
      else if (queue.length < 2) state = 'solo';
      else if (c.pos === 0) state = 'turn';
      else if (c.pos === queue.length - 1) state = 'done';
      else if (c.pos === 1) state = 'next';
      else state = 'wait';
      return {
        arc: a.arc, me: c, state, queue,
        ahead: c.out ? [] : queue.slice(0, c.pos),
        up: queue[0] || null,
        lastBy: by[lastBy.k], lastAt: lastBy.at, lastPost: lastBy.post,
        waitMs: Date.now() - lastT,
        dropped: all.filter((o) => o.out && !o.mine),
        closedBy, staleBy,
        markedByMe: closedBy.some((m) => m.mine),
      };
    });
  }

  const W = { turn: 0, next: 1, wait: 2, out: 3, done: 4, solo: 5, closed: 6 };
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
