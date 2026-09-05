/* Aurelion — розбір .docx у вікі-розмітку сайту.
   Усе в браузері: свій маленький читач ZIP (DecompressionStream('deflate-raw'))
   + DOMParser по word/document.xml. Жодних бібліотек і жодних запитів.

   Віддає текст у тій самій розмітці, що її розуміє parseMarkdown сайту
   (## заголовок, **жирний**, *курсив*, - список, > цитата, --- розділювач),
   а картинки — окремим списком File-ів. На місці кожної картинки в тексті
   стоїть заготовка ![Підпис](docx:N): хто імпортує, той і вирішує, куди її
   класти, а тоді підставляє справжні адреси через fill(). */
(function (global) {
  'use strict';

  const R_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const dec = (u8) => new TextDecoder('utf-8').decode(u8);
  const clean = (s) => String(s == null ? '' : s).replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim();

  // ── ZIP ────────────────────────────────────────────────────
  // Читаємо центральний каталог: у ньому справжні розміри, тому дескриптор
  // даних (той, що ставлять при потоковому записі) нас не обходить.
  function readZip(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(buf);
    let eocd = -1;
    for (let i = u8.length - 22; i >= 0 && i > u8.length - 22 - 65536; i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Це не схоже на .docx — архів не читається');
    const count = dv.getUint16(eocd + 10, true);
    let off = dv.getUint32(eocd + 16, true);
    const out = new Map();
    for (let i = 0; i < count; i++) {
      if (off + 46 > u8.length || dv.getUint32(off, true) !== 0x02014b50) break;
      const method = dv.getUint16(off + 10, true);
      const csize  = dv.getUint32(off + 20, true);
      const nlen   = dv.getUint16(off + 28, true);
      const elen   = dv.getUint16(off + 30, true);
      const clen   = dv.getUint16(off + 32, true);
      const lho    = dv.getUint32(off + 42, true);
      const name   = dec(u8.subarray(off + 46, off + 46 + nlen));
      const lnlen  = dv.getUint16(lho + 26, true);
      const lelen  = dv.getUint16(lho + 28, true);
      const start  = lho + 30 + lnlen + lelen;
      out.set(name, { method, raw: u8.subarray(start, start + csize) });
      off += 46 + nlen + elen + clen;
    }
    return out;
  }

  async function unpack(entry) {
    if (!entry) return null;
    if (entry.method === 0) return entry.raw;
    if (entry.method !== 8) throw new Error('У файлі невідомий спосіб стиснення');
    if (typeof DecompressionStream !== 'function') throw new Error('Браузер застарий — не вміє розпаковувати .docx');
    const stream = new Blob([entry.raw]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  // ── XML ────────────────────────────────────────────────────
  const nameOf = (el) => (el.localName || el.nodeName || '').replace(/^.*:/, '');
  const kids = (el, tag) => Array.from(el.children || []).filter(c => nameOf(c) === tag);
  const kid  = (el, tag) => kids(el, tag)[0] || null;
  const attr = (el, name) => {
    if (!el) return '';
    return el.getAttribute('w:' + name) || el.getAttribute(name)
      || el.getAttributeNS('http://schemas.openxmlformats.org/wordprocessingml/2006/main', name) || '';
  };
  const relAttr = (el, name) => el.getAttribute('r:' + name) || el.getAttributeNS(R_NS, name) || '';
  // <w:b/> означає «жирний», <w:b w:val="0"/> — «не жирний».
  const flagOn = (el) => { if (!el) return false; const v = attr(el, 'val'); return !(v === '0' || v === 'false' || v === 'none'); };

  function parseXml(u8, what) {
    const doc = new DOMParser().parseFromString(dec(u8), 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) throw new Error('Не читається ' + what);
    return doc;
  }

  function readRels(u8) {
    const map = new Map();
    if (!u8) return map;
    let doc; try { doc = parseXml(u8, 'звʼязки документа'); } catch (e) { return map; }
    Array.from(doc.getElementsByTagName('*')).forEach(el => {
      if (nameOf(el) !== 'Relationship') return;
      const id = el.getAttribute('Id'), target = el.getAttribute('Target') || '';
      if (id && target) map.set(id, target);
    });
    return map;
  }

  // ── Стилі → рівень заголовка ───────────────────────────────
  // Заголовки бувають стилем («Heading 2», «Заголовок 2»), рівнем структури
  // (w:outlineLvl) або просто жирним рядком. Ловимо всі три.
  function readStyles(u8) {
    const map = new Map();
    if (!u8) return map;
    let doc; try { doc = parseXml(u8, 'стилі'); } catch (e) { return map; }
    Array.from(doc.getElementsByTagName('*')).forEach(el => {
      if (nameOf(el) !== 'style') return;
      const id = attr(el, 'styleId');
      if (!id) return;
      const pPr = kid(el, 'pPr');
      const out = pPr && kid(pPr, 'outlineLvl') ? attr(kid(pPr, 'outlineLvl'), 'val') : '';
      map.set(id, { id, name: kid(el, 'name') ? attr(kid(el, 'name'), 'val') : '', out });
    });
    return map;
  }

  const HEAD_RE = /^(?:heading|title|subtitle|заголовок|назва|подзаголовок|підзаголовок)/i;
  function headLevel(styleId, styleName, outline) {
    const src = String(styleName || styleId || '');
    let lvl = null;
    if (/^(title|назва)/i.test(src)) lvl = 1;
    else if (HEAD_RE.test(src)) {
      const n = parseInt((src.match(/(\d)/) || [])[1] || '1', 10);
      lvl = /^(subtitle|под|під)/i.test(src) ? 2 : n;
    }
    if (lvl == null && outline !== '' && outline != null) {
      const n = parseInt(outline, 10);
      if (!isNaN(n) && n <= 5) lvl = n + 1;
    }
    if (lvl == null) return 0;
    return Math.min(4, Math.max(2, lvl + 1)); // Word H1 → ## , H2 → ### …
  }

  // ── Проходження документа ──────────────────────────────────
  function runsOf(el, out) {
    Array.from(el.children || []).forEach(c => {
      const n = nameOf(c);
      if (n === 'r') out.push({ run: c, link: '' });
      else if (n === 'hyperlink') {
        const id = relAttr(c, 'id');
        const inner = [];
        runsOf(c, inner);
        inner.forEach(x => out.push({ run: x.run, link: id, ...(x.link ? { link: x.link } : {}) }));
      } else if (['smartTag', 'ins', 'sdt', 'sdtContent', 'fldSimple', 'bdo', 'dir'].indexOf(n) !== -1) {
        runsOf(c, out);
      }
    });
    return out;
  }

  // Картинка в руні буває описана двічі: сучасним `a:blip` і старим
  // `v:imagedata` в `mc:Fallback`. Збираємо ВСЕ номери: перший часто веде
  // на .emf/.wmf/.bin (так Word кладе вставлене з буфера), а поряд лежить
  // той самий малюнок звичайним PNG.
  function imgOf(run, rels, ctx) {
    const ids = [];
    let alt = '';
    Array.from(run.getElementsByTagName('*')).forEach(el => {
      const n = nameOf(el);
      if (n === 'blip') { const v = relAttr(el, 'embed') || relAttr(el, 'link'); ids.push(v || ''); }
      else if (n === 'imagedata') { const v = relAttr(el, 'id') || relAttr(el, 'href'); ids.push(v || ''); }
      else if ((n === 'docPr' || n === 'cNvPr') && !alt) alt = clean(el.getAttribute('descr') || el.getAttribute('title') || '');
    });
    if (!ids.length) return null;
    if (ctx) ctx.tags += 1;
    const paths = [];
    ids.forEach(id => {
      const t = id ? (rels.get(id) || '') : '';
      if (!t) return;
      const p = t.replace(/^\.?\/?/, '').replace(/^word\//, '');
      if (paths.indexOf(p) === -1) paths.push(p);
    });
    if (!paths.length) return { path: '', paths: [], alt, blind: true };
    return { path: paths[0], paths, alt };
  }

  function paraText(p, ctx) {
    const rels = ctx.rels;
    const segs = [];
    // Жирний/курсив можуть стояти на цілому абзаці (w:pPr/w:rPr), а не на
    // кожному відрізку — інакше «весь рядок жирний» не розпізнається.
    const pRPr = kid(kid(p, 'pPr') || p, 'rPr');
    const pB = pRPr ? flagOn(kid(pRPr, 'b')) : false;
    const pI = pRPr ? flagOn(kid(pRPr, 'i')) : false;
    runsOf(p, []).forEach(({ run, link }) => {
      const pic = imgOf(run, rels, ctx);
      if (pic) { segs.push({ img: pic }); return; }
      let txt = '';
      Array.from(run.children || []).forEach(c => {
        const n = nameOf(c);
        if (n === 't') txt += c.textContent || '';
        else if (n === 'tab') txt += ' ';
        else if (n === 'br' || n === 'cr') txt += '\n';
        else if (n === 'noBreakHyphen') txt += '-';
      });
      if (!txt) return;
      const rPr = kid(run, 'rPr');
      segs.push({
        text: txt, link,
        b: rPr && kid(rPr, 'b') ? flagOn(kid(rPr, 'b')) : pB,
        i: rPr && kid(rPr, 'i') ? flagOn(kid(rPr, 'i')) : pI,
      });
    });
    return segs;
  }

  // Розмітку ставимо на злитих відрізках: «**жир**» на кожне слово окремо
  // читалося б у тексті як сміття.
  function segsToMd(segs, ctx) {
    let out = '', allBold = segs.length > 0, anyText = false;
    let i = 0;
    while (i < segs.length) {
      const s = segs[i];
      if (s.img) {
        const n = ctx.pushImage(s.img);
        out += (out && !/\s$/.test(out) ? ' ' : '') + '![' + (s.img.alt || '') + '](docx:' + n + ')';
        i++; continue;
      }
      const b = !!s.b, it = !!s.i, link = s.link || '';
      let run = '';
      while (i < segs.length && !segs[i].img && !!segs[i].b === b && !!segs[i].i === it && (segs[i].link || '') === link) {
        run += segs[i].text; i++;
      }
      const body = run.replace(/\s+/g, ' ');
      if (!body.trim()) { out += body; continue; }
      anyText = true;
      if (!b) allBold = false;
      const lead = body.match(/^\s*/)[0], tail = body.match(/\s*$/)[0], core = body.trim();
      let piece = core;
      if (b && it) piece = '***' + core + '***';
      else if (b) piece = '**' + core + '**';
      else if (it) piece = '*' + core + '*';
      if (link) {
        const addr = ctx.rels.get(link) || '';
        if (addr) piece = '[' + core + '](' + addr + ')';
      }
      out += lead + piece + tail;
    }
    return { text: out.replace(/\s+/g, ' ').trim(), allBold: allBold && anyText };
  }

  function cellText(tc, ctx) {
    return kids(tc, 'p').map(p => segsToMd(paraText(p, ctx), ctx).text).filter(Boolean).join(' ');
  }

  function tableLines(tbl, ctx) {
    const out = [];
    kids(tbl, 'tr').forEach(tr => {
      const cells = kids(tr, 'tc').map(tc => cellText(tc, ctx)).filter((v, k, a) => true);
      const filled = cells.filter(Boolean);
      if (!filled.length) return;
      if (cells.length === 2 && filled.length === 2) {
        const lab = cells[0].replace(/\*\*/g, '').replace(/:\s*$/, '');
        out.push('**' + lab + ':** ' + cells[1]);
      } else out.push(filled.join(' · '));
    });
    return out;
  }

  function walk(body, ctx, out) {
    Array.from(body.children || []).forEach(el => {
      const n = nameOf(el);
      if (n === 'p') {
        const pPr = kid(el, 'pPr');
        const st = pPr ? attr(kid(pPr, 'pStyle') || el, 'val') : '';
        const style = ctx.styles.get(st);
        const outline = pPr ? attr(kid(pPr, 'outlineLvl') || el, 'val') : '';
        const segs = paraText(el, ctx);
        const { text, allBold } = segsToMd(segs, ctx);
        if (!text) {
          // Порожній абзац з однією картинкою — все одно рядок з нею.
          if (segs.some(s => s.img)) out.push(segsToMd(segs.filter(s => s.img), ctx).text);
          return;
        }
        let lvl = headLevel(st, style && style.name, outline || (style && style.out) || '');
        if (!lvl && allBold && text.length <= 90 && !/[.!?;]$/.test(text)) lvl = 3;
        if (lvl) { out.push('#'.repeat(lvl) + ' ' + text.replace(/\*\*/g, '').replace(/^\*|\*$/g, '')); return; }
        if (/quote|цитат/i.test(String((style && style.name) || st))) { out.push('> ' + text); return; }
        if (pPr && kid(pPr, 'numPr')) { out.push('- ' + text.replace(/^[-•–—]\s*/, '')); return; }
        if (/^[•‣▪·]\s+/.test(text)) { out.push('- ' + text.replace(/^[•‣▪·]\s+/, '')); return; }
        out.push(text);
      } else if (n === 'tbl') {
        tableLines(el, ctx).forEach(l => out.push(l));
      } else if (n === 'sdt') {
        const c = kid(el, 'sdtContent');
        if (c) walk(c, ctx, out);
      }
    });
    return out;
  }

  // Списки мусять лишитися одним блоком: порожній рядок між пунктами
  // розриває <ul> на кілька окремих.
  function joinLines(lines) {
    let out = '';
    lines.forEach((l, i) => {
      if (!i) { out = l; return; }
      const li = /^-\s/.test(l), prevLi = /^-\s/.test(lines[i - 1]);
      out += (li && prevLi ? '\n' : '\n\n') + l;
    });
    return out;
  }

  const EXT_OK = { png: 'png', jpg: 'jpg', jpeg: 'jpg', jpe: 'jpg', gif: 'gif', webp: 'webp', bmp: 'bmp' };
  const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };
  // Магічні байти надійніші за розширення: Word зве вставлене з буфера
  // і image1.emf, і image1.bin, а всередині звичайний PNG.
  function sniff(b) {
    if (!b || b.length < 12) return '';
    if (b[0] === 0x89 && b[1] === 0x50) return 'png';
    if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
    if (b[0] === 0x47 && b[1] === 0x49) return 'gif';
    if (b[0] === 0x42 && b[1] === 0x4d) return 'bmp';
    if (b[0] === 0x52 && b[1] === 0x49 && b[8] === 0x57 && b[9] === 0x45) return 'webp';
    return '';
  }

  async function bytesOf(zip, path) {
    const entry = zip.get('word/' + path) || zip.get(path);
    if (!entry) return { why: 'немає в архіві' };
    let bytes;
    try { bytes = await unpack(entry); } catch (e) { return { why: 'не розпакувалося' }; }
    const ext = sniff(bytes) || EXT_OK[(path.split('.').pop() || '').toLowerCase()];
    if (!ext) return { why: 'формат .' + (path.split('.').pop() || '?') + ', браузер такого не покаже' };
    return { bytes, ext };
  }
  const fileOf = (r, n, alt) => {
    const nm = 'docx-' + n + '.' + r.ext;
    return { n, alt: alt || '', name: nm, file: new File([r.bytes], nm, { type: MIME[r.ext] }) };
  };

  async function parseFile(file) {
    const buf = await file.arrayBuffer();
    const zip = readZip(buf);
    const docEntry = zip.get('word/document.xml');
    if (!docEntry) throw new Error('У файлі немає word/document.xml — це не документ Word');
    const doc = parseXml(await unpack(docEntry), 'текст документа');
    const rels = readRels(await unpack(zip.get('word/_rels/document.xml.rels')));
    const styles = readStyles(await unpack(zip.get('word/styles.xml')));

    // Усе, що лежить у word/media/ — запасний шлях і міра того, чи ми взагалі
    // все знайшли. Сортуємо числом у назві: image10 не має йти перед image2.
    const media = Array.from(zip.keys())
      .filter(k => /^word\/media\//i.test(k))
      .sort((x, y) => (parseInt((x.match(/(\d+)/) || [])[1] || '0', 10) - parseInt((y.match(/(\d+)/) || [])[1] || '0', 10)) || x.localeCompare(y))
      .map(k => k.replace(/^word\//, ''));

    const picked = [];
    const seen = new Map();
    let blind = 0;
    const ctx = {
      rels, styles, tags: 0,
      pushImage: (pic) => {
        // Звʼязок не прочитався — беремо наступний файл із word/media/ по
        // порядку: у дев'яти випадках з десяти Word кладе їх саме так.
        let paths = (pic.paths && pic.paths.length) ? pic.paths : null;
        if (!paths) {
          const guess = media[blind++];
          if (!guess) return 0;
          paths = [guess];
        }
        const key = paths[0];
        const has = seen.get(key);
        if (has) return has;
        const n = picked.length + 1;
        picked.push({ path: key, paths, alt: pic.alt, n });
        seen.set(key, n);
        return n;
      },
    };

    const bodyEl = Array.from(doc.documentElement.children).find(c => nameOf(c) === 'body') || doc.documentElement;
    const lines = walk(bodyEl, ctx, []).map(clean).filter(Boolean);

    // Файли картинок дістаємо тільки для тих, що справді стоять у тексті.
    const images = [];
    const warnings = [];
    for (const pic of picked) {
      let done = null, why = '';
      for (const path of pic.paths) {
        const r = await bytesOf(zip, path);
        if (r.why) { why = r.why; continue; }
        done = fileOf(r, pic.n, pic.alt);
        break;
      }
      if (done) images.push(done);
      else warnings.push('Картинку ' + (pic.path || '?') + ' пропущено (' + (why || 'не вийшло') + ')');
    }
    const gone = picked.filter(p => !images.some(i => i.n === p.n)).map(p => p.n);

    let text = joinLines(lines);
    if (gone.length) text = drop(text, gone);

    // Картинки в архіві є, а в тексті ні одної — кладемо в кінець, а не
    // викидаємо: краще не на тому місці, ніж безслідно.
    if (!images.length && media.length) {
      for (const path of media) {
        const r = await bytesOf(zip, path);
        if (r.why) continue;
        const n = images.length + 1;
        images.push(fileOf(r, n, ''));
        text += '\n\n![](docx:' + n + ')';
      }
      if (images.length) warnings.push('Місце картинок у тексті не розібралося — ставлю всі в кінець, переставте вручну.');
    }

    const heads = lines.filter(l => /^#{2,4}\s/.test(l)).length;
    const first = lines.find(l => /^#{2,4}\s/.test(l));
    const counts = {
      blocks: lines.length, heads, images: images.length,
      media: media.length, tags: ctx.tags,
      letters: text.replace(/\s+/g, ' ').length,
    };
    try {
      console.log('[docx]', file.name, counts, '\n  звʼязків:', rels.size,
        '\n  media:', media, '\n  взято:', picked.map(p => p.path),
        '\n  попередження:', warnings);
    } catch (e) {}
    return {
      text,
      title: first ? clean(first.replace(/^#+\s*/, '')) : clean(String(file.name || '').replace(/\.docx$/i, '')),
      images, warnings, counts,
    };
  }

  // ── Markdown ───────────────────────────────────────
  // .md розмітка й так майже та сама, що в сайті, — приводимо до ладу лише
  // те, що `parseMarkdown` не читає: H1, setext-заголовки, «*» і нумеровані
  // списки, `__жирний__`, таблиці й огорожі коду.
  const MD_EXT = /\.(md|markdown|mdown|mkd|txt)$/i;
  const isMd = (file) => !!file && (MD_EXT.test(file.name || '')
    || file.type === 'text/markdown' || file.type === 'text/plain');

  const MD_SEP = /^\|?[\s:|-]*\|[\s:|-]*$/;
  const isSep = (t) => t.indexOf('|') !== -1 && /-/.test(t) && MD_SEP.test(t);
  // GFM дозволяє писати таблиці без крайніх труб, і так пишуть часто —
  // тому рядок таблиці це просто «є `|` і це не розділювач».
  const isRow = (t) => t.indexOf('|') !== -1 && !isSep(t) && !/^[>#]/.test(t);

  function mdRow(line) {
    const cells = line.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map(c => clean(c));
    const filled = cells.filter(Boolean);
    if (!filled.length) return '';
    if (cells.length === 2 && filled.length === 2) {
      return '**' + cells[0].replace(/\*\*/g, '').replace(/:\s*$/, '') + ':** ' + cells[1];
    }
    return filled.join(' · ');
  }

  // Google Docs експортує картинки **посилально**: `![][image1]` у тексті, а
  // внизу файлу `[image1]: <data:image/png;base64,…>`. Збираємо визначення,
  // підставляємо в місця вживання й викидаємо самі рядки-визначення.
  const REF_DEF = /^\s{0,3}\[([^\]^][^\]]*)\]:\s*(.+?)\s*$/;
  function refs(lines) {
    const map = new Map();
    const kept = [];
    lines.forEach(l => {
      const m = l.match(REF_DEF);
      if (m) {
        const addr = m[2].replace(/^<([\s\S]*)>$/, '$1').replace(/\s+["'(].*$/, '').trim();
        if (addr) { map.set(m[1].trim().toLowerCase(), addr); return; }
      }
      kept.push(l);
    });
    return { map, kept };
  }
  function useRefs(line, map) {
    if (!map.size || line.indexOf('][') === -1 && line.indexOf('[]') === -1) return line;
    // ![alt][label] і ![alt][] (коли мітка = alt), той самий вигляд для посилань.
    return line.replace(/(!?)\[([^\]]*)\]\[([^\]]*)\]/g, (m, bang, txt, label) => {
      const addr = map.get((label || txt).trim().toLowerCase());
      if (!addr) return bang ? '' : txt;
      return bang + '[' + txt + '](' + addr + ')';
    });
  }

  function mdToWiki(raw) {
    const all = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').split('\n');
    const { map, kept } = refs(all);
    const src = kept;
    const out = [];
    let fence = false, front = false, tbl = false;
    for (let i = 0; i < src.length; i++) {
      let l = src[i];
      // На початку буває YAML-шапка — це мета, не текст.
      if (!out.length && !front && /^---\s*$/.test(l) && i === 0) { front = true; continue; }
      if (front) { if (/^---\s*$/.test(l)) front = false; continue; }
      if (/^\s*(```|~~~)/.test(l)) { fence = !fence; continue; }
      if (fence) { out.push(l.trim()); continue; }

      const t = useRefs(l.trim(), map);
      if (!t) { out.push(''); tbl = false; continue; }
      const nxt = (src[i + 1] || '').trim();
      // Рядок з трубою — таблиця лише всередині таблиці: інакше звичайне
      // речення з «|» розірвалось би на графи. Початок видно з розділювача
      // під шапкою — саму шапку не пишемо, це назви граф, а не твердження.
      if (isSep(t)) { tbl = true; continue; }
      if (isRow(t) && (tbl || isSep(nxt))) {
        if (tbl) { const r = mdRow(t); if (r) out.push(r); }
        continue;
      }
      tbl = false;
      // setext: підкреслення під рядком робить його заголовком.
      if (nxt && /^={2,}$/.test(nxt)) { out.push('## ' + t); i++; continue; }
      if (nxt && /^-{2,}$/.test(nxt) && !/^[-*+>#]/.test(t)) { out.push('### ' + t); i++; continue; }
      if (/^(\*{3,}|_{3,}|-{3,})$/.test(t)) { out.push('---'); continue; }

      let s = t;
      // Google Docs екранує знаки (`\=`, `\+`, `1\.`) — у нашій розмітці це сміття.
      s = s.replace(/\\([\\`*_{}\[\]()#+\-.!|~<>="'$&%^:;,?\/])/g, '$1');
      const h = s.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        const lvl = Math.min(4, Math.max(2, h[1].length + 1)); // # → ## , ## → ###
        // Заголовки з Google Docs приходять як `## **Назва**` — жирний тут
        // зайвий: заголовок і так заголовок, а зірочки видно в тексті.
        const head = h[2].replace(/\s+#+\s*$/, '').trim().replace(/^\*{1,3}([\s\S]*?)\*{1,3}$/, '$1').trim();
        out.push('#'.repeat(lvl) + ' ' + head);
        continue;
      }
      s = s.replace(/^\s*[*+\u2022\u2023\u25aa]\s+/, '- ').replace(/^\s*\d+[.)]\s+/, '- ');
      s = s.replace(/^\s*>\s?/, '> ');
      s = s.replace(/__([^_]+)__/g, '**$1**').replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:!?)]|$)/g, '$1*$2*');
      s = s.replace(/~~([^~]+)~~/g, '$1');
      // Картинка в жирному (`**![](…)**` — частий вивід Google Docs) мусить
      // лишитися голою: інакше це вже не рядок-картинка, а текст.
      s = s.replace(/^\*{1,3}\s*(!\[[^\]]*\]\([^)]+\))\s*\*{1,3}$/, '$1');
      out.push(s);
    }
    // Списки мусять лишитися одним блоком — тому збираємо тим самим
    // joinLines, що й для Word, а не простим злиттям рядків.
    return joinLines(out.map(clean).filter(Boolean));
  }

  // data:image/…;base64 — це самі байти картинки всередині тексту. Залишати їх у
  // `content` не можна — одна стаття роздулася б до мегабайтів у базі; тому
  // вони йдуть тим самим шляхом, що й картинки з Word: файлом у галерею.
  const DATA_URI = /^data:image\/([a-z0-9.+-]+);base64,([\s\S]+)$/i;
  function dataFile(uri, n) {
    const m = String(uri).match(DATA_URI);
    if (!m) return null;
    let bin;
    try { bin = atob(m[2].replace(/\s+/g, '')); } catch (e) { return null; }
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const ext = sniff(bytes) || EXT_OK[m[1].toLowerCase()] || 'png';
    const nm = 'md-' + n + '.' + ext;
    return { name: nm, file: new File([bytes], nm, { type: MIME[ext] || 'image/png' }) };
  }

  async function parseMd(file) {
    let text = mdToWiki(await file.text());
    if (!text.trim()) throw new Error('у файлі не знайшлося тексту');
    const warnings = [];

    // Вбудовані картинки → заготовки docx:N + файли (як у Word).
    const images = [];
    let bad = 0;
    text = text.replace(/!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi, (m, alt, uri) => {
      const n = images.length + 1;
      const f = dataFile(uri, n);
      if (!f) { bad++; return ''; }
      images.push({ n, alt: clean(alt), name: f.name, file: f.file });
      return '![' + clean(alt) + '](docx:' + n + ')';
    });
    if (bad) warnings.push('Не вдалося розкодувати картинок: ' + bad);

    const lines = text.split('\n').filter(Boolean);
    const first = lines.find(l => /^#{2,4}\s/.test(l));
    const linked = (text.match(/!\[[^\]]*\]\((?!docx:)[^)]+\)/g) || []).length;
    if (/!\[[^\]]*\]\((?!https?:\/\/|\/|docx:|data:image\/)/.test(text)) {
      warnings.push('У файлі є картинки за місцевим шляхом — такі не відкриються. Завантажте їх у галерею й вставте кнопкою «→ у текст».');
    }
    const counts = {
      blocks: lines.length,
      heads: lines.filter(l => /^#{2,4}\s/.test(l)).length,
      images: images.length + linked,
      media: 0, tags: 0,
      letters: text.replace(/\s+/g, ' ').length,
    };
    try { console.log('[md]', file.name, counts, '\n  вбудованих:', images.length, '\n  адресами:', linked, '\n  попередження:', warnings); } catch (e) {}
    return {
      text, images, warnings, kind: 'md',
      title: first ? clean(first.replace(/^#+\s*/, '')) : clean(String(file.name || '').replace(MD_EXT, '')),
      counts,
    };
  }

  // Одні двері для обох форматів: той, хто імпортує, розбірностей не знає.
  async function parseAny(file) {
    if (isDocx(file)) return parseFile(file);
    if (isMd(file)) return parseMd(file);
    throw new Error('читаю лише .docx і .md');
  }

  // ── Заготовки → справжні адреси ────────────────────────────
  const rxAll = /!\[([^\]]*)\]\(docx:(\d+)(\|[a-z]+)?\)/g;
  // urls: { [n]: url }; чого немає в мапі — прибираємо, щоб у тексті не
  // лишалося заготовки, яку ніщо не відкриє.
  function fill(text, urls, opts) {
    const o = opts || {};
    return String(text || '').replace(rxAll, (m, alt, n) => {
      const url = urls && urls[n];
      if (!url) return '';
      return '![' + (alt || '') + '](' + url + (o.side ? '|' + o.side : '') + ')';
    }).replace(/\n{3,}/g, '\n\n');
  }
  function drop(text, only) {
    return String(text || '').replace(rxAll, (m, alt, n) =>
      (!only || only.indexOf(Number(n)) !== -1) ? '' : m).replace(/\n{3,}/g, '\n\n');
  }
  const isDocx = (file) => !!file && (/\.docx$/i.test(file.name || '')
    || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

  global.DocxImport = { parseFile, parseMd, parseAny, mdToWiki, fill, drop, isDocx, isMd, readZip, unpack };
})(window);
