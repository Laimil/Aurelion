/* Aurelion — розбір анкети з Telegraph.
   Приймає або сторінку telegra.ph (через публічний API), або вставлений текст.
   Віддає поля анкети + вікі-розмітку в тому вигляді, який очікує сайт. */
(function (global) {
  'use strict';

  const clean = s => String(s == null ? '' : s).replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();
  const fold  = s => clean(s).toLowerCase().replace(/[ʼ'’`\u2010-\u2015\-\s.,/()]+/g, '');

  const EMPTY = new Set(['', '-', '–', '—', '.', '..', '...', '?', '??', 'x', 'х',
    'фото', 'нема', 'немає', 'нема.', 'відсутні', 'відсутнє', 'відсутній', 'відсутня',
    'невідомо', 'невідома', 'невідомий', 'невказано', 'непотрібно', 'null', 'tbd']);
  const isEmptyVal = v => EMPTY.has(fold(v));

  // ── Словник граф анкети ────────────────────────────────────
  const F = {};
  const meta = (key, ...aliases) => aliases.forEach(a => { F[fold(a)] = { kind: 'meta', key }; });
  const sect = (title, ...aliases) => aliases.forEach(a => { F[fold(a)] = { kind: 'section', title }; });
  const skip = (...aliases) => aliases.forEach(a => { F[fold(a)] = { kind: 'skip' }; });

  meta('name', 'ПІБ', "Ім'я", 'Ім’я', 'Імʼя', "Повне ім'я", 'Назва');
  meta('age', 'Вік/Дата народження', 'Вік / Дата народження', 'Вік', 'Дата народження', 'Вік/Д.н.');
  meta('body', 'Ріст/Вага', 'Зріст/Вага', 'Ріст та вага', 'Зріст та вага', 'Ріст і вага');
  meta('height', 'Ріст', 'Зріст');
  meta('weight', 'Вага');
  meta('deity', 'Божество покровитель', 'Божество-покровитель', 'Божество', 'Покровитель', 'Бог');
  meta('role', 'Роль', 'Клас', 'Роль/Клас', 'Професія');
  skip('Джерело', 'Source', 'Автор анкети');

  sect('Характер', 'Характер', 'Особистість');
  sect('Біографія', 'Біографія', 'Історія', 'Передісторія');
  sect('Магічні здібності', 'Магічні здібності', 'Здібності', 'Магія', 'Сила');
  sect('Наслідки знищення артефакту', 'Наслідки знищення артефакту', 'Наслідки знищення');
  sect('Артефакт', 'Артефакт у володінні', 'Артефакт');
  sect('Обмеження', 'Обмеження', 'Ціна', 'Ціна сили');
  sect('Слабкості', 'Слабкість', 'Слабкості', 'Вразливості');
  sect('Розвиток персонажа', 'Розвиток персонажа', 'Розвиток', 'Арка');
  sect("Сім'я", "Сім'я", 'Сім’я', 'Сімʼя', 'Родина');
  sect('Навички', 'Навички', 'Уміння');
  sect('Особливості', 'Особливості');
  sect('Призначення', 'Призначення');
  sect('Поточні цілі', 'Поточні цілі', 'Цілі', 'Мета');
  sect('Позиція до релігії', 'Позиція до релігії', 'Віра');
  sect('Прототип', 'Прототип');
  sect('Зовнішність', 'Зовнішність', 'Опис зовнішності');
  sect('Альтернативна зовнішність', 'Альтр. зовнішність', 'Альтернативна зовнішність', 'Альт. зовнішність');
  sect('Додатково', 'Додатково', 'Інше', 'Примітки');

  // Порядок розділів у готовій анкеті
  const ORDER = ['Характер', 'Зовнішність', 'Альтернативна зовнішність', 'Біографія', "Сім'я",
    'Магічні здібності', 'Навички', 'Артефакт', 'Обмеження', 'Слабкості',
    'Наслідки знищення артефакту', 'Особливості', 'Призначення', 'Прототип',
    'Позиція до релігії', 'Поточні цілі', 'Розвиток персонажа', 'Додатково'];

  // ── Telegraph API ──────────────────────────────────────────
  function pathFromUrl(url) {
    const s = clean(url);
    if (!s) return '';
    const m = s.match(/telegra\.ph\/([^?#\s]+)/i);
    if (m) return m[1].replace(/^\/+|\/+$/g, '');
    if (/^[\w%.-]+$/.test(s)) return s;
    return '';
  }

  async function fetchPage(url) {
    const path = pathFromUrl(url);
    if (!path) throw new Error('Не схоже на посилання telegra.ph');
    const r = await fetch('https://api.telegra.ph/getPage/' + path + '?return_content=true');
    const j = await r.json().catch(() => ({}));
    if (!j || !j.ok) throw new Error((j && j.error) || 'Telegraph не віддав сторінку');
    return j.result;
  }

  // ── Вузли Telegraph → рядки тексту ────────────────────────
  const imgSrc = n => {
    let s = (n.attrs && (n.attrs.src || n.attrs.href)) || '';
    if (s && s.charAt(0) === '/') s = 'https://telegra.ph' + s;
    return s;
  };

  function inline(node, ctx) {
    if (node == null) return '';
    if (typeof node === 'string') return node;
    const kids = (node.children || []).map(n => inline(n, ctx)).join('');
    switch (node.tag) {
      case 'br': return '\n';
      case 'strong': case 'b': return kids.trim() ? '**' + kids.trim() + '**' : '';
      case 'em': case 'i': return kids.trim() ? '*' + kids.trim() + '*' : '';
      case 'code': return kids.trim() ? '`' + kids.trim() + '`' : '';
      case 'a': {
        const h = (node.attrs && node.attrs.href) || '';
        return h ? '[' + (kids.trim() || h) + '](' + h + ')' : kids;
      }
      case 'img': { const s = imgSrc(node); if (s) ctx.images.push(s); return ''; }
      case 'video': case 'iframe': { const s = imgSrc(node); if (s) ctx.embeds.push(s); return ''; }
      default: return kids;
    }
  }

  function block(node, ctx, out) {
    if (node == null) return;
    if (typeof node === 'string') { pushText(out, node); return; }
    const t = node.tag;
    if (t === 'img') { const s = imgSrc(node); if (s) ctx.images.push(s); return; }
    if (t === 'video' || t === 'iframe') { const s = imgSrc(node); if (s) ctx.embeds.push(s); return; }
    if (t === 'hr') { out.push('---'); return; }
    if (t === 'figure' || t === 'div' || t === 'aside') {
      (node.children || []).forEach(n => block(n, ctx, out));
      return;
    }
    if (t === 'ul' || t === 'ol') {
      (node.children || []).forEach((li, i) => {
        const txt = clean(inline(li, ctx));
        if (txt) out.push((t === 'ol' ? (i + 1) + '. ' : '• ') + txt);
      });
      return;
    }
    if (t === 'blockquote') {
      clean(inline(node, ctx)).split('\n').forEach(l => { if (clean(l)) out.push('> ' + clean(l)); });
      return;
    }
    if (/^h[1-6]$/.test(t || '')) {
      const txt = clean(inline(node, ctx));
      if (txt) out.push('### ' + txt);
      return;
    }
    pushText(out, inline(node, ctx));
  }

  function pushText(out, raw) {
    String(raw || '').split('\n').forEach(l => { const c = clean(l); if (c) out.push(c); });
  }

  function linesFromNodes(nodes) {
    const ctx = { images: [], embeds: [] };
    const out = [];
    (nodes || []).forEach(n => block(n, ctx, out));
    return { lines: out, images: ctx.images, embeds: ctx.embeds };
  }

  // ── Розбір рядків ─────────────────────────────────────────
  const ORN = /[༺-༿࿀-࿿\u200d\uFE0F\u2B50\u2600-\u27BF\u{1F300}-\u{1FAFF}]/u;

  function headerOf(line) {
    const s = clean(line);
    const md = s.match(/^#{2,4}\s+(.+?)\s*:?\s*$/);
    if (md) {
      const known = F[fold(md[1])];
      return { label: clean(md[1]), rest: '', known: known || null, fromHeading: true };
    }
    const m = s.match(/^([^\p{L}\p{N}]*)([\p{L}][^:]{0,44}?)\s*:\s*([\s\S]*)$/u);
    if (!m) return null;
    const label = clean(m[2]);
    const known = F[fold(label)];
    const marked = ORN.test(m[1]) && label.split(/\s+/).length <= 4;
    if (!known && !marked) return null;
    return { label, rest: clean(m[3]), known: known || null, fromHeading: false };
  }

  function splitName(raw) {
    let s = clean(raw), alias = '';
    const m = s.match(/[\[(«"]([^\])»"]{1,70})[\])»"]/);
    if (m) { alias = clean(m[1]); s = clean(s.replace(m[0], '')); }
    if (alias) {
      const tail = alias.match(/^(.*?)[\u2010-\u2015\-:]\s*([^\u2010-\u2015\-:]+)$/);
      if (tail && /для|звуть|відом|знають|більшост|псевдо|прізвис|ім/i.test(tail[1])) alias = clean(tail[2]);
      alias = clean(alias.replace(/^(друге|справжнє|нове|інше)?\s*(псевдо\w*|прізвисько|ім\S*|також|звати|звуть|відом\w*)\s*[:\u2010-\u2015\-]?\s*/i, ''));
      if (alias.split(/\s+/).length > 2) {
        const capRun = alias.match(/((?:[\p{Lu}][\p{L}'ʼ’-]*\s*){1,3})$/u);
        if (capRun) alias = clean(capRun[1]);
      }
    }
    return { name: clean(s.replace(/\s{2,}/g, ' ')).replace(/[.,\s]+$/, ''), alias };
  }

  const MONTHS = 'січн|лют|березн|квітн|травн|червн|липн|серпн|вересн|жовтн|листопад|грудн';

  function splitAge(raw) {
    let c = clean(raw).replace(/Дата народження\s*:\s*/i, '');
    let bd = '';
    const mName = c.match(new RegExp('(\\d{1,2}\\s+(?:' + MONTHS + ')\\p{L}*)', 'iu'));
    if (mName) bd = clean(mName[1]);
    if (!bd) {
      const pair = c.match(/^\s*(\d{1,3})\s*[\/,|–—-]\s*(\d{1,2}[.\/]\d{1,2}(?:[.\/]\d{2,4})?)/);
      if (pair) bd = pair[2];
      else bd = (c.match(/\b(\d{1,2}[.\/]\d{1,2}(?:[.\/]\d{2,4})?)\b/) || [])[1] || '';
    }
    bd = bd.replace(/[.,\s]+$/, '');
    const rest = bd ? c.replace(bd, ' ') : c;
    let age = (rest.match(/\b(\d{1,3})\s*(?:рок\w*|рік)/i) || [])[1] || '';
    if (!age) age = (rest.match(/\b(\d{1,3})\b/) || [])[1] || '';
    const note = (!age && !bd && c.length > 3) ? c : '';
    return { age, birthday: bd, note };
  }

  function splitBody(raw) {
    const c = clean(raw);
    let height = (c.match(/(\d{2,3})\s*см/i) || [])[1] || '';
    if (!height) {
      const m = c.match(/(\d)[.,](\d{1,2})\s*м(?![а-яіїє])/i);
      if (m) height = String(Math.round(parseFloat(m[1] + '.' + m[2]) * 100));
    }
    let weight = (c.match(/(\d{2,3})\s*кг/i) || [])[1] || '';
    if (!height || !weight) {
      const nums = c.match(/\d{2,3}/g) || [];
      if (!height && nums[0]) height = nums[0];
      if (!weight && nums[height && nums[0] === height ? 1 : 0]) weight = nums[height && nums[0] === height ? 1 : 0];
    }
    const tail = clean(c.replace(/[\d.,]+\s*(см|кг|м)?/gi, ' ').replace(/^[\s\/|-]+/, ''));
    return {
      height: height ? height + ' см' : '',
      weight: weight ? weight + ' кг' : '',
      note: tail.length > 20 ? tail : '',
    };
  }

  function polish(lines, sectionTitle) {
    const out = [];
    lines.forEach(raw => {
      let l = clean(raw);
      if (!l) return;
      const div = l.match(/^[\u2010-\u2015\-]{3,}\s*(.*?)\s*[\u2010-\u2015\-]{3,}$/);
      if (div) { out.push(div[1] ? '*' + clean(div[1]) + '*' : '---'); return; }
      if (sectionTitle === 'Магічні здібності') {
        const num = l.match(/^(\d{1,2})[.)]\s+(\S.{0,68})$/);
        if (num && !/[.,;:]$/.test(num[2])) { out.push('### ' + num[1] + '. ' + num[2]); return; }
      }
      const lab = l.match(/^[\u2010-\u2015\-•]?\s*([\p{L}][\p{L}\s'ʼ’-]{1,28}):\s+(\S.*)$/u);
      if (lab && lab[1].split(/\s+/).length <= 4 && !/\*\*/.test(l)) {
        out.push('**' + clean(lab[1]) + ':** ' + clean(lab[2]));
        return;
      }
      out.push(l);
    });
    return out.join('\n\n');
  }

  function shortBio(text) {
    if (!text) return '';
    const plain = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\*\*/g, '').replace(/\*/g, '').split(/\n+/).find(l => clean(l).length > 40) || '';
    const sents = plain.match(/[^.!?…]+[.!?…]+/g) || [plain];
    let out = '';
    for (const s of sents) { if (out && (out + s).length > 260) break; out += s; }
    return clean(out).slice(0, 320);
  }

  function parseLines(lines, opts) {
    const o = opts || {};
    const metaVals = {};
    const buckets = new Map();   // title → рядки
    const unknown = [];
    let cur = null;              // поточний розділ
    let curTitle = '';

    const put = (title, line) => {
      if (!buckets.has(title)) buckets.set(title, []);
      buckets.get(title).push(line);
    };

    lines.forEach(line => {
      const h = headerOf(line);
      if (h) {
        const k = h.known;
        if (k && k.kind === 'skip') { cur = null; curTitle = ''; return; }
        if (k && k.kind === 'meta') {
          if (!isEmptyVal(h.rest)) metaVals[k.key] = h.rest;
          cur = null; curTitle = '';
          return;
        }
        const title = k ? k.title : clean(h.label);
        if (!k) unknown.push(title);
        curTitle = title; cur = title;
        if (h.rest && !isEmptyVal(h.rest)) put(title, h.rest);
        else if (h.rest) put(title, '');
        return;
      }
      if (cur) put(cur, line);
      else put('__intro__', line);
    });

    // «Конкорфату. Офіційно — як належить…» → ім'я бога + окремий розділ про віру
    if (metaVals.deity) {
      const d = clean(metaVals.deity).replace(/[.\s]+$/, '');
      const cut = d.match(/^([^.,;(\n]{1,40})([.,;(][\s\S]*)$/);
      const note = cut ? clean(cut[2].replace(/^[.,;(]\s*/, '')) : '';
      let name = (cut && note.length > 12) ? clean(cut[1]) : (d.length > 40 ? '' : d);
      let toFaith = (cut && note.length > 12) ? note : (d.length > 40 ? d : '');
      if (name && (isEmptyVal(name) || /^(відсутн|нема|без|жодн)/i.test(name))) {
        toFaith = toFaith ? name + '. ' + toFaith : '';
        name = '';
      }
      metaVals.deity = name;
      if (toFaith) {
        if (buckets.has('Позиція до релігії')) buckets.get('Позиція до релігії').push(toFaith);
        else buckets.set('Позиція до релігії', [toFaith]);
      }
    }
    if (metaVals.body) {
      const bnote = splitBody(metaVals.body).note;
      if (bnote) {
        if (buckets.has('Зовнішність')) buckets.get('Зовнішність').unshift(bnote);
        else buckets.set('Зовнішність', [bnote]);
      }
    }

    const sections = [];
    const empty = [];
    const titles = Array.from(buckets.keys()).filter(t => t !== '__intro__');
    titles.sort((a, b) => {
      const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
      return (ia < 0 ? 99 + titles.indexOf(a) : ia) - (ib < 0 ? 99 + titles.indexOf(b) : ib);
    });
    titles.forEach(t => {
      const body = polish((buckets.get(t) || []).filter(Boolean), t);
      if (!body || isEmptyVal(body)) { empty.push(t); return; }
      sections.push({ title: t, text: body });
    });

    const nm = splitName(metaVals.name || o.title || '');
    const ag = splitAge(metaVals.age || '');
    const bd = splitBody(metaVals.body || '');
    const height = metaVals.height ? clean(metaVals.height) : bd.height;
    const weight = metaVals.weight ? clean(metaVals.weight) : bd.weight;

    const head = [];
    if (ag.birthday) head.push('**Дата народження:** ' + ag.birthday);
    if (ag.note) head.push('**Вік:** ' + ag.note);
    const md = head.concat(sections.map(s => '## ' + s.title + '\n\n' + s.text)).join('\n\n');

    const character = sections.find(s => s.title === 'Характер');
    const bio = shortBio(character ? character.text : (sections[0] ? sections[0].text : ''));

    return {
      title: clean(o.title || nm.name),
      url: o.url || '',
      name: nm.name || clean(o.title || ''),
      alias: nm.alias,
      age: ag.age,
      birthday: ag.birthday,
      height, weight,
      deity: clean(metaVals.deity || ''),
      role: clean(metaVals.role || ''),
      sections, empty, unknown,
      bio,
      markdown: md,
      images: o.images || [],
      lines,
    };
  }

  function parseText(raw, opts) {
    const o = opts || {};
    const lines = String(raw || '').split(/\r?\n/).map(clean).filter(Boolean);
    const images = [];
    // keepImages: рядок-картинку лишаємо в тексті (це вже вставлена в статтю
    // ілюстрація, а не портрет, який треба витягти окремо).
    const kept = o.keepImages ? lines : lines.filter(l => {
      const m = l.match(/^!?\[[^\]]*\]\((https?:\/\/\S+)\)$/);
      if (m && /\.(jpe?g|png|webp|gif)/i.test(m[1])) { images.push(m[1]); return false; }
      if (/^https?:\/\/\S+\.(jpe?g|png|webp|gif)(\?\S*)?$/i.test(l)) { images.push(l); return false; }
      return true;
    });
    return parseLines(kept, Object.assign({}, opts, { images }));
  }

  async function parseUrl(url) {
    const page = await fetchPage(url);
    const { lines, images } = linesFromNodes(page.content);
    const res = parseLines(lines, { title: page.title, url: 'https://telegra.ph/' + pathFromUrl(url), images });
    res.author = clean(page.author_name || '');
    return res;
  }

  global.TelegraphImport = { parseUrl, parseText, parseLines, linesFromNodes, fetchPage, pathFromUrl, fold, clean, ORDER };
})(window);
