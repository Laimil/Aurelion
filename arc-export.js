// Вивантаження арки у файл: txt / md / docx. Без бібліотек — docx це
// zip з трьома xml, пакуємо самі (без стиснення, з CRC32).
(function () {
  const tz = { timeZone: 'Europe/Kyiv' };
  const day = (iso) => { try { return new Date(iso).toLocaleDateString('uk-UA', { ...tz, day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } };
  const time = (iso) => { try { return new Date(iso).toLocaleTimeString('uk-UA', { ...tz, hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } };
  const who = (p) => String(p.character_name || p.tag_name || '—').trim();
  const clean = (s) => String(s || '').replace(/\r\n?/g, '\n').trim();
  const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

  function meta(arc, rows) {
    const cast = [];
    rows.forEach((p) => { const w = who(p); if (!cast.includes(w)) cast.push(w); });
    const f = rows[0].created_at, l = rows[rows.length - 1].created_at;
    return {
      title: `Арка · ${arc}`,
      lines: [
        `Ауреліон · вивантажено ${day(new Date().toISOString())}`,
        `${rows.length} ${plural(rows.length, 'допис', 'дописи', 'дописів')} · ${day(f) === day(l) ? day(f) : `з ${day(f)} по ${day(l)}`}`,
        `Учасники: ${cast.join(', ')}`,
      ],
    };
  }
  const postHead = (p) => `✦ ${who(p)} — ${day(p.created_at)}, ${time(p.created_at)}`;

  function txt(arc, rows) {
    const m = meta(arc, rows);
    const head = [m.title.toUpperCase(), ...m.lines, '═'.repeat(40), '', ''].join('\n');
    const body = rows.map((p) => [postHead(p), '', clean(p.body), '', '─'.repeat(24), '', ''].join('\n')).join('');
    return new Blob(['\uFEFF' + head + body], { type: 'text/plain;charset=utf-8' });
  }

  function md(arc, rows) {
    const m = meta(arc, rows);
    // Одинарний перенос у Markdown не ламає рядок — додаємо два пробіли.
    const para = (s) => clean(s).split(/\n{2,}/).map((b) => b.replace(/^([#>])/gm, '\\$1').replace(/\n/g, '  \n')).join('\n\n');
    const out = [`# ${m.title}`, '', ...m.lines.map((l) => `*${l}*  `), '', '---', ''];
    rows.forEach((p) => { out.push(`### ${postHead(p)}`, '', para(p.body), '', '---', ''); });
    return new Blob([out.join('\n')], { type: 'text/markdown;charset=utf-8' });
  }

  // ── docx ──
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
  const run = (t, rpr) => {
    const parts = String(t).split('\n');
    return `<w:r>${rpr ? `<w:rPr>${rpr}</w:rPr>` : ''}${parts.map((x, i) => (i ? '<w:br/>' : '') + `<w:t xml:space="preserve">${esc(x)}</w:t>`).join('')}</w:r>`;
  };
  const p = (t, style, rpr) => `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ''}${run(t, rpr)}</w:p>`;

  function docxXml(arc, rows) {
    const m = meta(arc, rows);
    let b = p(m.title, 'Title');
    m.lines.forEach((l) => { b += p(l, 'Meta'); });
    rows.forEach((x) => {
      b += p(postHead(x), 'PostHead');
      clean(x.body).split(/\n{2,}/).forEach((blk) => { if (blk.trim()) b += p(blk, 'Body'); });
    });
    return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
      + '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>' + b
      + '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr>'
      + '</w:body></w:document>';
  }
  const STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
    + '<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Georgia" w:hAnsi="Georgia" w:cs="Georgia" w:eastAsia="Georgia"/><w:sz w:val="23"/><w:lang w:val="uk-UA"/></w:rPr></w:rPrDefault>'
    + '<w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>'
    + '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="160"/></w:pPr><w:rPr><w:b/><w:caps/><w:spacing w:val="20"/><w:sz w:val="40"/><w:color w:val="8A6D00"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Meta"><w:name w:val="Meta"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="40"/></w:pPr><w:rPr><w:i/><w:sz w:val="20"/><w:color w:val="666666"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="PostHead"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Body"/><w:pPr><w:keepNext/><w:spacing w:before="360" w:after="120"/><w:pBdr><w:top w:val="single" w:sz="4" w:space="8" w:color="CCCCCC"/></w:pBdr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="8A6D00"/></w:rPr></w:style>'
    + '<w:style w:type="paragraph" w:styleId="Body"><w:name w:val="Body"/><w:basedOn w:val="Normal"/><w:pPr><w:jc w:val="both"/></w:pPr></w:style>'
    + '</w:styles>';
  const CT = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
    + '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
    + '<Default Extension="xml" ContentType="application/xml"/>'
    + '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
    + '<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>'
    + '</Types>';
  const RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>';
  const DOC_RELS = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
    + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
    + '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';

  let CRC = null;
  function crc32(u8) {
    if (!CRC) { CRC = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; CRC[n] = c >>> 0; } }
    let c = 0xffffffff;
    for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }
  function zip(files) {
    const enc = new TextEncoder(), parts = [], central = [];
    let off = 0;
    files.forEach(([name, text]) => {
      const nm = enc.encode(name), data = enc.encode(text), crc = crc32(data);
      const h = new DataView(new ArrayBuffer(30));
      h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true);
      h.setUint16(8, 0, true); h.setUint16(10, 0, true); h.setUint16(12, 0x21, true);
      h.setUint32(14, crc, true); h.setUint32(18, data.length, true); h.setUint32(22, data.length, true);
      h.setUint16(26, nm.length, true); h.setUint16(28, 0, true);
      parts.push(new Uint8Array(h.buffer), nm, data);
      const c = new DataView(new ArrayBuffer(46));
      c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true);
      c.setUint16(10, 0, true); c.setUint16(12, 0, true); c.setUint16(14, 0x21, true);
      c.setUint32(16, crc, true); c.setUint32(20, data.length, true); c.setUint32(24, data.length, true);
      c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
      central.push(new Uint8Array(c.buffer), nm);
      off += 30 + nm.length + data.length;
    });
    const cdSize = central.reduce((s, a) => s + a.length, 0);
    const e = new DataView(new ArrayBuffer(22));
    e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true);
    e.setUint32(12, cdSize, true); e.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(e.buffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
  }
  function docx(arc, rows) {
    return zip([
      ['[Content_Types].xml', CT],
      ['_rels/.rels', RELS],
      ['word/document.xml', docxXml(arc, rows)],
      ['word/_rels/document.xml.rels', DOC_RELS],
      ['word/styles.xml', STYLES],
    ]);
  }

  const MAKERS = { txt, md, docx };
  window.AuArcExport = {
    formats: ['txt', 'md', 'docx'],
    build(fmt, arc, rows) { return (MAKERS[fmt] || txt)(arc, rows); },
  };
})();
