// ═══════════════════════════════════════════════════════════════
// Тести — спільний словник формату: перевірка, розбір вставки,
// порожні заготовки, переклад «рядок бази ↔ обʼєкт тесту».
//
// ⚠ Копія перевірки живе в `admin.dc.html` (`_testCheck`, `_testParseSource`):
// там вона працює на вставці від Клода й переписувати робочий файл заради
// експорту дорожче за копію. Правиш правила тут — звіряй там, інакше
// конструктор і адмінка почнуть казати різне про той самий тест.
//
// Вантажиться динамічним import() з `Test Builder.dc.html`.
// ═══════════════════════════════════════════════════════════════

// Пантеонні кольори дизайн-системи. Ключ — те, що лежить у базі;
// підпис — те, що видно авторові в конструкторі.
export const ACCENTS = {
  gold:   { label: 'Золото',  hex: '#ffd700' },
  azure:  { label: 'Лазур',   hex: '#6495ed' },
  light:  { label: 'Світло',  hex: '#ffd76b' },
  dark:   { label: 'Морок',   hex: '#8f7ee8' },
  fate:   { label: 'Доля',    hex: '#d2607a' },
  nature: { label: 'Природа', hex: '#5fbfb0' },
  magic:  { label: 'Магія',   hex: '#cdd2db' },
};

export const ACCENT_KEYS = Object.keys(ACCENTS);

export const KINDS = [
  { id: 'likert', label: 'Твердження + шкала', hint: 'Класика: 12–16 тверджень, згода від 1 до 5, перемагає найсильніший тип.' },
  { id: 'axes',   label: 'Осі-дихотомії',      hint: 'Як MBTI: 3–4 осі, кожна з двох полюсів, результат — код на кілька літер.' },
  { id: 'alloc',  label: 'Розподіл',           hint: '«Виберіть 3 з 9» або «розкиньте 5 балів» — типи виходять частками.' },
];

export const SCALE_5 = [
  { value: 1, label: 'Зовсім не про мене' },
  { value: 2, label: 'Скоріше ні' },
  { value: 3, label: 'Як подивитися' },
  { value: 4, label: 'Скоріше так' },
  { value: 5, label: 'Точно про мене' },
];

const S = (v) => (typeof v === 'string' ? v.trim() : '');
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

export function slugify(text) {
  const map = {
    а:'a',б:'b',в:'v',г:'h',ґ:'g',д:'d',е:'e',є:'ie',ж:'zh',з:'z',и:'y',і:'i',ї:'i',й:'i',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',
    ш:'sh',щ:'shch',ь:'',ю:'iu',я:'ia',ъ:'',ы:'y',э:'e',ё:'e',
  };
  return String(text || '').toLowerCase()
    .split('').map(ch => (map[ch] != null ? map[ch] : ch)).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'test';
}

// ── Порожня заготовка ────────────────────────────────────────
// Не «пустий бланк», а найменший тест, який уже можна пройти: інакше
// автор дивиться на десять порожніх полів і не бачить, що з чим звʼязано.
export function blankTest(kind) {
  const base = {
    id: '', kind: kind || 'likert', title: '', tagline: '', description: '',
    resultLabel: 'Ваш тип', scale: SCALE_5.map(x => ({ ...x })),
    traits: {}, axes: [], results: {}, rules: [], questions: [],
  };
  if (kind === 'axes') {
    base.scale = SCALE_5.map(x => ({ ...x }));
    base.axes = [
      { key: 'axis1', left: pole('Л'), right: pole('П') },
      { key: 'axis2', left: pole('Т'), right: pole('С') },
    ];
    base.questions = [{ text: '', axis: 'axis1', pole: 'left' }];
    return base;
  }
  base.traits = {
    t1: trait('gold'), t2: trait('azure'), t3: trait('nature'),
  };
  base.questions = kind === 'alloc'
    ? [{ text: '', pick: 3, options: [] }]
    : [{ text: '', trait: 't1' }];
  return base;
}

const trait = (accent) => ({ name: '', tagline: '', desc: '', accent, quote: '', rarity: null });
const pole  = (code)   => ({ code, name: '', tagline: '', desc: '', accent: '' });

export const blankTrait = trait;
export const blankPole = pole;

// ── Рядок бази ↔ обʼєкт тесту ────────────────────────────────
export function rowToTest(row) {
  const r = row || {};
  const t = blankTest(S(r.kind) || 'likert');
  return {
    ...t,
    id: S(r.test_id),
    kind: S(r.kind) || 'likert',
    title: S(r.title),
    tagline: S(r.tagline),
    description: S(r.description),
    resultLabel: S(r.result_label) || 'Ваш тип',
    scale: Array.isArray(r.scale) && r.scale.length ? r.scale : t.scale,
    traits: isObj(r.traits) ? r.traits : {},
    axes: Array.isArray(r.axes) ? r.axes : [],
    results: isObj(r.results) ? r.results : {},
    rules: Array.isArray(r.rules) ? r.rules : [],
    questions: Array.isArray(r.questions) ? r.questions : [],
  };
}

export function testToRow(t) {
  const o = t || {};
  return {
    test_id: S(o.id),
    kind: S(o.kind) || 'likert',
    title: S(o.title),
    tagline: S(o.tagline),
    description: S(o.description),
    result_label: S(o.resultLabel),
    scale: Array.isArray(o.scale) ? o.scale : null,
    traits: isObj(o.traits) ? o.traits : {},
    axes: Array.isArray(o.axes) ? o.axes : [],
    results: isObj(o.results) ? o.results : {},
    rules: Array.isArray(o.rules) ? o.rules : [],
    questions: Array.isArray(o.questions) ? o.questions : [],
  };
}

// ── Розбір вставки (JSON або JS-обʼєкт від моделі) ────────────
export function parseTestSource(raw) {
  let src = String(raw || '').trim();
  if (!src) throw new Error('Порожньо — встав обʼєкт тесту.');
  src = src.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '').trim();
  src = src.replace(/^(?:export\s+)?(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*/, '').trim();
  src = src.replace(/;+\s*$/, '').trim();
  src = src.replace(/^,+/, '').replace(/,+$/, '').trim();
  let val = null;
  try { val = JSON.parse(src); }
  catch (e1) {
    try { val = new Function('"use strict";return (' + src + ');')(); }
    catch (e2) { throw new Error('Не читається ні як JSON, ні як JS-обʼєкт: ' + (e2.message || e1.message)); }
  }
  const arr = (Array.isArray(val) ? val : [val]).filter(isObj);
  if (!arr.length) throw new Error('У вставці немає жодного обʼєкта тесту.');
  return arr;
}

// ── Перевірка ────────────────────────────────────────────────
// Помилки блокують подання, зауваження лише показуються: рушій мусить
// уміти порахувати кожен тест, який дійшов до модерації.
export function checkTest(t) {
  const errors = [], warns = [];
  const ACC = ACCENT_KEYS.join(', ');
  const kind = S(t.kind) || 'likert';
  if (!['likert', 'axes', 'alloc'].includes(kind)) errors.push('kind «' + kind + '» — має бути likert, axes або alloc');

  if (!S(t.id)) errors.push('немає id (адреса латиницею)');
  else if (!/^[a-z0-9-]+$/.test(S(t.id))) errors.push('id «' + S(t.id) + '» — лише малі латинські літери, цифри й дефіс');
  if (!S(t.title)) errors.push('немає назви');
  if (!S(t.tagline)) warns.push('немає підзаголовка');
  if (!S(t.description)) warns.push('немає опису для екрана вступу');
  if (!S(t.resultLabel)) warns.push('немає підпису результату — картка підпишеться загально');

  const qs = Array.isArray(t.questions) ? t.questions : [];
  const isAlloc = (q) => !!(q && Array.isArray(q.options) && q.options.length);
  const plainQs = qs.filter(q => !isAlloc(q));
  const allocQs = qs.filter(isAlloc);
  if (!qs.length) errors.push('немає питань');

  const scale = Array.isArray(t.scale) ? t.scale : [];
  if (plainQs.length) {
    if (scale.length !== 5) errors.push('шкала має бути з 5 пунктів, а тут ' + scale.length);
    else if (scale.some((x, i) => !x || Number(x.value) !== i + 1 || !S(x.label))) errors.push('пункти шкали мусять мати value 1..5 по порядку і непорожній підпис');
  } else if (scale.length && !allocQs.length) warns.push('шкала є, але жодного питання зі шкалою — вона ніде не згодиться');

  const seenAcc = {};
  const chkRes = (r, what, opts) => {
    const o = r || {};
    if (!S(o.name)) errors.push(what + ': немає назви');
    if (!S(o.desc)) errors.push(what + ': немає опису');
    else if (S(o.desc).length < 60) warns.push(what + ': опис короткий (' + S(o.desc).length + ' символів)');
    if (!S(o.tagline) && (opts || {}).wantTag) warns.push(what + ': немає підзаголовка');
    const a = S(o.accent);
    if (!a) { if ((opts || {}).wantAccent) errors.push(what + ': немає кольору'); }
    else if (!ACCENTS[a]) errors.push(what + ': колір «' + a + '» не з переліку (' + ACC + ')');
    else if ((opts || {}).uniqueAccent) {
      if (seenAcc[a]) errors.push('колір «' + a + '» повторюється: «' + seenAcc[a] + '» і ' + what);
      else seenAcc[a] = what;
    }
    const rar = o.rarity;
    if (rar != null && rar !== '' && !(Number(rar) > 0 && Number(rar) <= 100)) warns.push(what + ': рідкість мусить бути відсотком 1–100');
    if (S(o.quote).length > 120) warns.push(what + ': цитата довга (' + S(o.quote).length + ') — на картці влізе три рядки');
  };

  const traits = isObj(t.traits) ? t.traits : null;
  const keys = (kind === 'axes') ? [] : (traits ? Object.keys(traits) : []);
  const axes = Array.isArray(t.axes) ? t.axes : [];
  const axisKeys = axes.map((a, i) => S(a && a.key) || ('axis' + i));
  const perTrait = {};

  if (kind === 'axes') {
    if (axes.length < 2) errors.push('осей ' + axes.length + ' — потрібно від 2 (найліпше 3–4)');
    if (axes.length > 4) warns.push('осей ' + axes.length + ' — це ' + Math.pow(2, axes.length) + ' фіналів, описати всі важко');
    const codes = {};
    axes.forEach((a, i) => {
      const k = axisKeys[i];
      if (!S(a && a.key)) errors.push('вісь ' + (i + 1) + ': немає ключа');
      ['left', 'right'].forEach(side => {
        const p = (a || {})[side];
        const word = side === 'left' ? 'лівий' : 'правий';
        if (!p) { errors.push('вісь «' + k + '»: немає ' + word + ' полюс'); return; }
        chkRes(p, 'вісь «' + k + '», ' + word + ' полюс', {});
        const c = S(p.code);
        if (!c) errors.push('вісь «' + k + '», ' + word + ' полюс: немає літери коду');
        else if (c.length > 1) warns.push('вісь «' + k + '», ' + word + ' полюс: код «' + c + '» довший за літеру');
        else if (codes[c]) warns.push('літера «' + c + '» уже зайнята (' + codes[c] + ') — коди буде не відрізнити');
        else codes[c] = 'вісь «' + k + '»';
      });
    });
    qs.forEach((q, i) => {
      if (isAlloc(q)) { warns.push('питання ' + (i + 1) + ': розподіл у тесті на осях нічого не дає — бали нікуди не лягають'); return; }
      if (!q || !S(q.text)) errors.push('питання ' + (i + 1) + ': немає тексту');
      const k = S(q && q.axis);
      if (!k) errors.push('питання ' + (i + 1) + ': не вибрано вісь');
      else if (axisKeys.length && !axisKeys.includes(k)) errors.push('питання ' + (i + 1) + ': осі «' + k + '» немає серед осей');
      else perTrait[k] = (perTrait[k] || 0) + 1;
      const pole = S(q && q.pole);
      if (!['left', 'right'].includes(pole)) errors.push('питання ' + (i + 1) + ': не вибрано полюс');
    });
    axisKeys.forEach(k => {
      const n = perTrait[k] || 0;
      if (n < 2) errors.push('вісь «' + k + '»: ' + n + ' питань — потрібно від 3, і в обидва боки');
      else if (n < 3) warns.push('вісь «' + k + '»: лише ' + n + ' питання — полюс визначиться хитко');
      const sides = { left: 0, right: 0 };
      qs.forEach(q => { if (q && S(q.axis) === k) sides[S(q.pole)] = (sides[S(q.pole)] || 0) + 1; });
      if (!sides.left || !sides.right) warns.push('вісь «' + k + '»: усі твердження тягнуть в один бік — це згода, а не вибір');
    });
    const results = isObj(t.results) ? t.results : {};
    const rkeys = Object.keys(results);
    const full = Math.pow(2, axes.length);
    if (!rkeys.length) errors.push('немає жодного фіналу — коду нічого не відповідає');
    rkeys.forEach(code => {
      if (code.length !== axes.length) errors.push('фінал «' + code + '»: у коді ' + code.length + ' літер, а осей ' + axes.length);
      else {
        const bad = code.split('').some((ch, i) => {
          const a = axes[i] || {};
          const l = S((a.left || {}).code).toUpperCase(), r = S((a.right || {}).code).toUpperCase();
          return ch.toUpperCase() !== l && ch.toUpperCase() !== r;
        });
        if (bad) errors.push('фінал «' + code + '»: літери не збігаються з кодами полюсів у тому самому порядку');
      }
      chkRes(results[code], 'фінал «' + code + '»', { wantTag: true });
    });
    if (rkeys.length && rkeys.length < full) warns.push('описано ' + rkeys.length + ' фіналів із ' + full + ' — решта збереться з описів полюсів');
  } else {
    if (!keys.length) errors.push('немає типів результату');
    else {
      if (keys.length < 3) errors.push('типів лише ' + keys.length + ' — потрібно від 3');
      if (keys.length > 6) warns.push('типів ' + keys.length + ' — понад 6 картка результату читається важко');
      keys.forEach(k => chkRes(traits[k], 'тип «' + (S(traits[k] && traits[k].name) || k) + '»', { wantTag: true, wantAccent: true, uniqueAccent: true }));
    }
    plainQs.forEach((q) => {
      const i = qs.indexOf(q);
      if (!q || !S(q.text)) errors.push('питання ' + (i + 1) + ': немає тексту');
      const k = S(q && q.trait);
      if (!k) errors.push('питання ' + (i + 1) + ': не вибрано тип');
      else if (keys.length && !traits[k]) errors.push('питання ' + (i + 1) + ': типу «' + k + '» немає серед типів');
      else perTrait[k] = (perTrait[k] || 0) + 1;
    });
    const allocTraits = {};
    allocQs.forEach((q) => {
      const i = qs.indexOf(q);
      const pre = 'питання ' + (i + 1);
      if (!S(q.text)) errors.push(pre + ': немає тексту');
      const opts = q.options;
      const pick = Math.round(Number(q.pick) || 0);
      const pts = Math.round(Number(q.points) || 0);
      if (!pick && !pts) errors.push(pre + ': потрібно сказати, скільки вибрати або скільки балів розкинути');
      if (pick && pts) errors.push(pre + ': і вибір, і бали разом — рушій візьме бали');
      if (opts.length < 3) errors.push(pre + ': варіантів ' + opts.length + ' — потрібно від 3');
      if (pick && pick >= opts.length) errors.push(pre + ': вибрати ' + pick + ' із ' + opts.length + ' — вибору не лишається');
      if (pts > 12) warns.push(pre + ': ' + pts + ' балів — розкидати стомлює, тримайтесь у межах 4–7');
      opts.forEach((o, j) => {
        if (!o || !S(o.label)) errors.push(pre + ', варіант ' + (j + 1) + ': немає тексту');
        const k = S(o && o.trait);
        if (!k) errors.push(pre + ', варіант ' + (j + 1) + ': не вибрано тип');
        else if (keys.length && !traits[k]) errors.push(pre + ', варіант ' + (j + 1) + ': типу «' + k + '» немає серед типів');
        else { allocTraits[k] = (allocTraits[k] || 0) + 1; perTrait[k] = (perTrait[k] || 0) + 1; }
      });
    });
    keys.forEach(k => {
      const nm = 'тип «' + (S(traits[k] && traits[k].name) || k) + '»';
      const scaleN = plainQs.filter(q => S(q && q.trait) === k).length;
      const allocN = allocTraits[k] || 0;
      if (!scaleN && !allocN) errors.push(nm + ' не покритий ні питанням, ні варіантом');
      else if (scaleN && allocN) warns.push(nm + ' є й у твердженнях, й у розподілі — рушій візьме відсоток зі шкали, бали згорять');
      else if (scaleN === 1) warns.push(nm + ' має лише 1 питання — результат буде хитким');
      else if (!scaleN && allocN === 1) warns.push(nm + ' стоїть лише в одному варіанті — частка вийде випадковою');
    });
  }

  const rules = Array.isArray(t.rules) ? t.rules : [];
  const known = kind === 'axes' ? axisKeys : keys;
  rules.forEach((r, i) => {
    const pre = 'правило ' + (i + 1);
    const conds = Array.isArray(r && r.if) ? r.if : [];
    if (!conds.length) { errors.push(pre + ': немає умов'); return; }
    if (!r.result) { errors.push(pre + ': немає результату'); return; }
    conds.forEach((c, j) => {
      const cp = pre + ', умова ' + (j + 1);
      if (!isObj(c)) { errors.push(cp + ': порожня'); return; }
      if (c.code) {
        if (kind !== 'axes') errors.push(cp + ': умова на код працює лише в тесті на осях');
        return;
      }
      if (c.top) {
        if (!known.includes(String(c.top))) errors.push(cp + ': «' + c.top + '» невідомий');
        return;
      }
      const k = String(c.trait || c.axis || '');
      if (!k) errors.push(cp + ': потрібен тип/вісь, лідер або код');
      else if (known.length && !known.includes(k)) errors.push(cp + ': «' + k + '» немає серед ' + (kind === 'axes' ? 'осей' : 'типів'));
      if (c.min == null && c.max == null) warns.push(cp + ': ні «від», ні «до» — умова зійдеться завжди');
    });
    chkRes(r.result, pre + ' (результат)', { wantTag: true });
  });

  if (plainQs.length && plainQs.length < 12 && !allocQs.length) warns.push('тверджень ' + plainQs.length + ' — за схемою 12–16');
  if (qs.length > 26) warns.push('питань ' + qs.length + ' — довго проходити');
  const texts = qs.map(q => S(q && q.text).toLowerCase()).filter(Boolean);
  if (new Set(texts).size !== texts.length) warns.push('є питання з однаковим текстом');
  return { errors, warns, perTrait, qCount: qs.length, traitKeys: keys, kind, axisKeys, allocCount: allocQs.length };
}
