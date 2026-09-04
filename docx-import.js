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

  function imgOf(run, rels) {
    let id = '', alt = '';
    Array.from(run.getElementsByTagName('*')).forEach(el => {
      const n = nameOf(el);
      if (n === 'blip' && !id) id = relAttr(el, 'embed') || relAttr(el, 'link');
      if (n === 'imagedata' && !id) id = relAttr(el, 'id');
      if (n === 'docPr' && !alt) alt = clean(el.getAttribute('descr') || '');
    });
    if (!id) return null;
    const target = rels.get(id) || '';
    if (!target) return null;
    return { path: target.replace(/^\.?\/?/, '').replace(/^word\//, ''), alt };
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
      const pic = imgOf(run, rels);
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

  const EXT_OK = { png: 'png', jpg: 'jpg', jpeg: 'jpg', gif: 'gif', webp: 'webp', bmp: 'bmp' };
  const MIME = { png: 'image/png', jpg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp' };

  async function parseFile(file) {
    const buf = await file.arrayBuffer();
    const zip = readZip(buf);
    const docEntry = zip.get('word/document.xml');
    if (!docEntry) throw new Error('У файлі немає word/document.xml — це не документ Word');
    const doc = parseXml(await unpack(docEntry), 'текст документа');
    const rels = readRels(await unpack(zip.get('word/_rels/document.xml.rels')));
    const styles = readStyles(await unpack(zip.get('word/styles.xml')));

    const picked = [];   // {path, alt, n}
    const seen = new Map();
    const ctx = {
      rels, styles,
      pushImage: (pic) => {
        const has = seen.get(pic.path);
        if (has) return has;
        const n = picked.length + 1;
        picked.push({ path: pic.path, alt: pic.alt, n });
        seen.set(pic.path, n);
        return n;
      },
    };

    const bodyEl = Array.from(doc.documentElement.children).find(c => nameOf(c) === 'body') || doc.documentElement;
    const lines = walk(bodyEl, ctx, []).map(clean).filter(Boolean);

    // Файли картинок дістаємо тільки для тих, що справді стоять у тексті.
    const images = [];
    const warnings = [];
    for (const pic of picked) {
      const entry = zip.get('word/' + pic.path) || zip.get(pic.path);
      const ext = EXT_OK[(pic.path.split('.').pop() || '').toLowerCase()];
      if (!entry || !ext) { warnings.push('Картинку ' + pic.path + ' пропущено'); continue; }
      try {
        const bytes = await unpack(entry);
        images.push({
          n: pic.n, alt: pic.alt, name: 'docx-' + pic.n + '.' + ext,
          file: new File([bytes], 'docx-' + pic.n + '.' + ext, { type: MIME[ext] }),
        });
      } catch (e) { warnings.push('Картинку ' + pic.path + ' не вдалося розпакувати'); }
    }
    const gone = picked.filter(p => !images.some(i => i.n === p.n)).map(p => p.n);

    let text = joinLines(lines);
    if (gone.length) text = drop(text, gone);

    const heads = lines.filter(l => /^#{2,4}\s/.test(l)).length;
    const first = lines.find(l => /^#{2,4}\s/.test(l));
    return {
      text,
      title: first ? clean(first.replace(/^#+\s*/, '')) : clean(String(file.name || '').replace(/\.docx$/i, '')),
      images, warnings,
      counts: {
        blocks: lines.length,
        heads,
        images: images.length,
        letters: text.replace(/\s+/g, ' ').length,
      },
    };
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

  global.DocxImport = { parseFile, fill, drop, isDocx, readZip, unpack };
})(window);
