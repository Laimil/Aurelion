// Рунна мова — еталонне ядро перекладача. Без залежностей, без мережі, детерміноване.
// createTranslator({corpus, lexicon, rules, generator, dict?, extra?, reverse?}) -> { toRune, toUk, stem, generate, lemma }

const APOS = /[’‘ʼ`´]/g;
const UK_WORD = /[а-яіїєґ]+(?:'[а-яіїєґ]+)*/giu;
const RUNE_WORD = /[a-z]+(?:['-][a-z]+)*/gi;

const normUk = (s) =>
  s.toLowerCase().replace(APOS, "'").replace(/[^а-яіїєґ' ]+/gu, ' ').replace(/\s+/g, ' ').trim();
const normRune = (s) =>
  s.toLowerCase().replace(APOS, "'").replace(/а/g, 'a').replace(/[^a-z' -]+/g, ' ')
    .replace(/(^|\s)[-']+|[-']+(\s|$)/g, ' ').replace(/\s+/g, ' ').trim();

function fnv1a(str) {
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(str)) { h ^= b; h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return () => {
    a = (a + 0x6d2b79f5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick(table, rnd) {
  const total = table.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [v, w] of table) { if ((x -= w) < 0) return v; }
  return table[table.length - 1][0];
}
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// extra — слова спільноти, закріплені на сайті (runna_words у базі): ті самі поля, що в lexicon.words.
// Мають перевагу над словником, але НЕ впливають на генератор: інакше кожне закріплене слово
// змінювало б вигадані слова для інших.
export function createTranslator({ corpus, lexicon, rules, generator, reverse = {}, extra = [], dict = null }) {
  const st = rules.stemmer;
  const endings = [...st.endings].sort((a, b) => b.length - a.length);

  const fleeting = st.fleeting ?? [], alternations = st.alternations ?? {};
  function stem(word) {
    let w = word.toLowerCase().replace(APOS, "'").replace(/'/g, '');
    // випадний голосний: «світанок» зводиться до тієї ж основи, що й «світанку»
    for (const [suf, to] of fleeting) if (w.endsWith(suf) && w.length - suf.length >= st.min_stem) return w.slice(0, -suf.length) + to;
    for (const r of st.reflexive) if (w.endsWith(r) && w.length - r.length >= st.min_stem) { w = w.slice(0, -r.length); break; }
    for (const e of endings) if (w.endsWith(e) && w.length - e.length >= st.min_stem) { w = w.slice(0, -e.length); break; }
    return alternations[w] ?? w;
  }

  // ---- indexes
  const exact = new Map(), byStem = new Map(), runeIdx = new Map();
  for (const w of [...extra, ...lexicon.words]) {
    if (!runeIdx.has(w.rune)) runeIdx.set(w.rune, w);
    for (const u of w.uk) {
      const k = u.toLowerCase().replace(/'/g, '');
      if (!exact.has(k)) exact.set(k, w);
      const s = stem(u);
      if (!byStem.has(s)) byStem.set(s, w);
    }
  }
  const runeSet = new Set(lexicon.words.map((w) => w.rune));
  // корені, що вже щось означають: генератор не має права складати з них нові слова
  const morphSet = new Set([...runeSet].flatMap((r) => r.split(/['-]/)));
  const memUk = new Map(), memRune = new Map();
  for (const p of corpus.phrases) {
    if (p.uk && !memUk.has(normUk(p.uk))) memUk.set(normUk(p.uk), p);
    if (p.uk && !memRune.has(normRune(p.rune))) memRune.set(normRune(p.rune), p);
  }
  const stop = new Set(rules.stopwords), hon = new Set(rules.honorifics);

  // Сирий генератор: основа → слово. taken — уже зайняті слова (словник лем), їх пропускаємо
  // тим самим потоком чисел; коротким основам, якщо односкладові вичерпались, дається два склади.
  function rawGenerate(s, taken) {
    const rnd = mulberry32(fnv1a(s));
    const syl = () => pick(generator.onsets, rnd) + pick(generator.nuclei, rnd) + pick(generator.codas, rnd);
    const one = s.length <= generator.one_syllable_max_stem;
    for (let i = 0; i < 60; i++) {
      const parts = one && i < 20 ? [syl()] : [syl(), syl()];
      const w = parts.join(generator.joiner);
      if (parts.every((x) => !morphSet.has(x)) && !(taken && taken.has(w))) return w;
    }
    return 'x' + syl(); // практично недосяжно; гарантує завершення
  }

  // ---- словник лем (data/dict.json, tools/build-dict.mjs)
  // Кожна частотна українська лема має одне рунне слово, і кожне вигадане слово — одну лему:
  // «вогонь / вогню / вогнем» дають одне слово, а назад воно читається однозначно.
  // Леми статичного словника теж тут — так «мені», «мною» знаходять drau без ручних форм.
  // dict.forms — часті форми, чию основу стемер віддав іншій, частішій лемі («ночі» ≠ «нічого»).
  const lexIdx = new Map(lexicon.words.map((w) => [w.rune, w]));
  const dictStem = new Map(), dictRune = new Map(), dictForm = new Map(Object.entries(dict?.forms ?? {}));
  if (dict) {
    for (const [lemma, rune, stems] of dict.words) {
      if (rune !== '~' && !lexIdx.has(rune)) dictRune.set(rune, lemma); // «~» — службове слово, пропускається
      for (let x of stems ? stems.split(' ') : []) {
        if (dict.v >= 2) x = lemma.slice(0, +x[0]) + x.slice(1); // «N+хвіст» → повна основа
        if (!dictStem.has(x)) dictStem.set(x, rune);
      }
    }
  }
  // Слово спільноти перекриває лему цілком: закріплене «кіт» діє і для «кота», «котом».
  const extraByLemma = new Map();
  const dictOf = (k, s) => dictForm.get(k) ?? dictStem.get(s);
  for (const w of extra) for (const u of w.uk) { const r = dictOf(u.toLowerCase().replace(/'/g, ''), stem(u)); if (r && !extraByLemma.has(r)) extraByLemma.set(r, w); }

  function generate(ukWord) {
    const s = stem(ukWord);
    return dictOf(ukWord.toLowerCase().replace(APOS, "'").replace(/'/g, ''), s) ?? rawGenerate(s, dictRune);
  }
  // Словникова форма слова, якщо вона відома (для пропозицій спільноти)
  function lemma(ukWord) {
    const r = dictOf(ukWord.toLowerCase().replace(APOS, "'").replace(/'/g, ''), stem(ukWord));
    return r ? dictRune.get(r) : ukWord.toLowerCase();
  }
  // Пошук: точна форма словника → лема (спільнота, статичний словник) → основа словника.
  // Якщо лема відома, але слова для неї в словниках нема, — null: далі піде вигадане слово цієї леми.
  function lookup(k, low) {
    const s = stem(low), ex = exact.get(k);
    if (ex) return ex;
    const r = dictOf(k, s);
    if (r) return extraByLemma.get(r) ?? lexIdx.get(r) ?? null;
    return byStem.get(s) ?? null;
  }
  const translit = (w) => cap([...w.toLowerCase().replace(APOS, "'")].map((c) => rules.translit[c] ?? c).join(''));

  // ---- українська -> рунна
  function sentenceToRune(sent, register) {
    const key = normUk(sent);
    if (!key) return { rune: sent.trim(), segments: [] };
    const hit = memUk.get(key);
    if (hit) return { rune: hit.rune, segments: [{ src: sent.trim(), out: hit.rune, kind: 'canon-phrase', ref: hit.id }] };

    const ov = rules.registers[register]?.overrides ?? {};
    const isQ = /\?/.test(sent);
    const words = [...sent.replace(APOS, "'").matchAll(UK_WORD)];
    const segs = []; let pendingHon = false, pendingNo = false;
    words.forEach((m, i) => {
      const raw = m[0], low = raw.toLowerCase(), k = low.replace(/'/g, '');
      const isCap = raw[0] !== raw[0].toLowerCase();
      if (hon.has(low) && i + 1 < words.length) { pendingHon = true; return; }
      let out, kind, ref;
      // Слово з великої посеред речення спершу шукається у словнику («прийде Темрява» = thuur);
      // транслітерується лише те, чого словник не знає, — справжні імена.
      const known = isCap && i > 0 && !pendingHon ? lookup(k, low) : null;
      if (rules.names[k]) { out = rules.names[k]; kind = 'name'; }
      else if (pendingHon || (isCap && i > 0 && !known)) { out = translit(raw); kind = 'name'; }
      else if (stop.has(low) || (!exact.has(k) && dictOf(k, stem(low)) === '~')) return;
      else if (low === 'що') { const w = runeIdx.get(i === 0 ? 'hraen' : "vaer'n"); out = w.rune; kind = w.status; }
      else {
        const w = lookup(k, low);
        if (w) { out = ov[w.rune] ?? w.rune; kind = w.status; ref = w.rune; }
        else { out = generate(low); kind = 'generated'; }
      }
      if (pendingHon) { out += rules.honorific_suffix; pendingHon = false; }
      if (out === 'no') { pendingNo = true; return; }
      if (pendingNo) { segs.push({ src: 'не', out: 'no', kind: 'proposed' }); pendingNo = false; }
      segs.push({ src: raw, out, kind, ref });
    });
    if (isQ && segs.length && !rules.question_words.includes(segs[0].out.toLowerCase()))
      segs.unshift({ src: '?', out: rules.question_prefix, kind: 'derived' });
    if (!segs.length) return { rune: '', segments: [] };
    const end = (sent.trim().match(/[.!?…]+$/) || ['.'])[0];
    const text = segs.map((s) => s.out).join(' ');
    return { rune: cap(text) + end, segments: segs };
  }

  function toRune(text, { register = 'standard' } = {}) {
    const whole = memUk.get(normUk(text));
    if (whole) return { text: whole.rune, segments: [{ src: text.trim(), out: whole.rune, kind: 'canon-phrase', ref: whole.id }] };
    const sents = text.match(/[^.!?…]+[.!?…]*/g) ?? [];
    const parts = sents.map((s) => sentenceToRune(s, register)).filter((p) => p.rune);
    return { text: parts.map((p) => p.rune).join(' '), segments: parts.flatMap((p) => p.segments) };
  }

  // ---- рунна -> українська (підрядник)
  function senseOf(rune, i, toks) {
    const w = runeIdx.get(rune);
    for (const s of lexicon.senses[rune] ?? []) {
      const c = s.if;
      if (c.first && i !== 0) continue;
      if (c.last && i !== toks.length - 1) continue;
      if (c.prev && !c.prev.includes(toks[i - 1])) continue;
      if (c.next && !c.next.includes(toks[i + 1])) continue;
      if (c.next2 && !c.next2.includes(toks[i + 2])) continue;
      return s.uk;
    }
    return w?.gloss;
  }
  function sentenceToUk(sent) {
    const hit = memRune.get(normRune(sent));
    if (hit) return { uk: hit.uk, segments: [{ src: sent.trim(), out: hit.uk, kind: 'canon-phrase', ref: hit.id }] };
    const toks = (normRune(sent).match(RUNE_WORD) ?? []).map((t) => lexicon.variants[t] ?? t);
    const segs = toks.map((t, i) => {
      if (runeIdx.has(t)) return { src: t, out: senseOf(t, i, toks), kind: runeIdx.get(t).status };
      if (dictRune.has(t)) return { src: t, out: dictRune.get(t), kind: 'generated' };
      if (reverse[t]) return { src: t, out: reverse[t].join(' / '), kind: 'generated' };
      if (t.endsWith("'na")) return { src: t, out: 'пані/пан ' + cap(t.slice(0, -3)), kind: 'name' };
      const parts = t.split(/['-]/);
      if (parts.length > 1 && parts.some((p) => runeIdx.has(p)))
        return { src: t, out: parts.map((p) => runeIdx.get(p)?.gloss ?? `‹${p}›`).join(' + '), kind: 'compound-guess' };
      return { src: t, out: `‹${t}›`, kind: 'unknown' };
    });
    return { uk: segs.map((s) => `[${s.out}]`).join(' '), segments: segs };
  }
  function toUk(text) {
    const whole = memRune.get(normRune(text));
    if (whole) return { text: whole.uk, segments: [{ src: text.trim(), out: whole.uk, kind: 'canon-phrase', ref: whole.id }] };
    const sents = text.match(/[^.!?…~]+[.!?…~]*/g) ?? [];
    const parts = sents.map(sentenceToUk).filter((p) => p.uk);
    return { text: parts.map((p) => p.uk).join(' '), segments: parts.flatMap((p) => p.segments) };
  }

  return { toRune, toUk, stem, generate, lemma, _raw: rawGenerate, _dictRune: dictRune };
}
