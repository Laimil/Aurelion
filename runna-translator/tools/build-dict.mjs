// data/lemmas.json (tools/build_lemmas.py) → data/dict.json.
// Усі леми — і зі статичного словника, і решта частотних — розкладаються за частотою:
//   • лема зі словника (lexicon.json) отримує своє рунне слово;
//   • інша лема — унікальне згенероване слово (найуживаніші — «природний» результат генератора,
//     рідші, якщо їхнє слово зайняте, — наступне з того ж потоку чисел);
//   • основа (стем) належить першій, найчастішій лемі; часті форми рідшої леми з тією ж основою
//     записуються поштучно (forms), щоб «ночі» не стало «нічого», а «могла» — «мого».
import { readFileSync, writeFileSync } from 'node:fs';
import { createTranslator } from '../src/runna-core.js';
const j = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const [corpus, lexicon, rules, generator, lemmas, freqForms] = ['corpus', 'lexicon', 'rules', 'generator', 'lemmas', 'lemmas_frequent'].map(j);
const t = createTranslator({ corpus, lexicon, rules, generator });
const stop = new Set(rules.stopwords), stem = t.stem, frequent = new Set(freqForms);
const norm = (f) => f.toLowerCase().replace(/'/g, '');
// Службові леми, які перекладач пропускає в усіх формах («цього», «цим», «собою» — як «цей», «себе»).
// «той» сюди навмисно не входить: «та», «тому» — ще й сполучники.
const STOP_LEMMAS = new Set(['цей', 'це', 'себе']), SKIP = '~';

// 1. Які леми покриває статичний словник
const formLemma = new Map(lemmas.map(([L]) => [L, L])); // слово, що саме є лемою, належить собі («суть», не «бути»)
for (const [L, , , forms] of lemmas) for (const f of forms) if (!formLemma.has(f)) formLemma.set(f, L);
const lexOf = new Map(), clash = [];
for (const w of lexicon.words) for (const u of w.uk) {
  const L = formLemma.get(u.toLowerCase()); if (!L) continue;
  // лема має бути справді цим словом: спільна основа з однією з форм словника або лема є в глосі
  // («мене» → «я» є в «я / мене / мій»; а «суть» → «бути» — ні, це інше слово)
  const glossWords = new Set(w.gloss.toLowerCase().split(/[^а-яіїєґ']+/));
  if (!w.uk.some((x) => stem(x) === stem(L)) && !glossWords.has(L)) continue;
  if (lexOf.has(L) && lexOf.get(L) !== w.rune) { clash.push(`${L}: ${lexOf.get(L)} / ${w.rune}`); continue; }
  lexOf.set(L, w.rune);
}
const lexForms = new Set(lexicon.words.flatMap((w) => w.uk.map(norm))); // точні форми словника — завжди його

// 2. Розкладка
const taken = new Set(lexicon.words.map((w) => w.rune));
const owner = new Map(), lemmaForms = new Map(lemmas.map(([L, , , fs]) => [L, new Set(fs)]));
const words = [], forms = {}; let moved = 0, skipped = 0, lexN = 0;
for (const [L, , , fs] of lemmas) {
  if (stop.has(L) && !lexOf.has(L) && !STOP_LEMMAS.has(L)) { skipped++; continue; }
  const mine = fs.filter((f) => (STOP_LEMMAS.has(L) || !stop.has(f)) && !lexForms.has(norm(f)));
  const stems = [...new Set(mine.map(stem))].filter((s) => !owner.has(s));
  const single = mine.filter((f) => { const o = owner.get(stem(f)); return o && (f === L || frequent.has(f)) && !lemmaForms.get(o).has(f); });
  if (!stems.length && !single.length) { skipped++; continue; }
  let rune = lexOf.get(L) ?? (STOP_LEMMAS.has(L) ? SKIP : null);
  if (rune === SKIP);
  else if (rune) lexN++;
  else { const seed = stem(L); rune = t._raw(seed, taken); if (rune !== t._raw(seed, null)) moved++; taken.add(rune); }
  stems.forEach((s) => owner.set(s, L));
  for (const f of single) { const k = norm(f); if (!(k in forms)) forms[k] = rune; }
  // основи стисло: «N+хвіст», N — скільки перших літер спільні з лемою («мати»: мав → 2в)
  const pre = (x) => { let n = 0; while (n < x.length && n < L.length && x[n] === L[n] && n < 9) n++; return n + x.slice(n); };
  words.push([L, rune, stems.map(pre).join(' ')]);
}
writeFileSync(new URL('../data/dict.json', import.meta.url), JSON.stringify({ v: 2, built: new Date().toISOString().slice(0, 10), forms, words }));
console.log(`лем: ${words.length} (зі словника ${lexN}, пропущено ${skipped}), зсунуто через зайняте: ${moved}, поштучних форм: ${Object.keys(forms).length}`);
if (clash.length) console.log('лема в кількох словах словника (взято перше):', clash.join('; '));
