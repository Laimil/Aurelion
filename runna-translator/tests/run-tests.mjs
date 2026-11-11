import { readFileSync } from 'node:fs';
import { load } from '../tools/load.mjs';
const { t, corpus } = load();
const cases = JSON.parse(readFileSync(new URL('./cases.json', import.meta.url), 'utf8'));
let fail = 0, n = 0;
const eq = (name, got, exp) => { n++; if (got !== exp) { fail++; console.log(`FAIL ${name}\n  got: ${got}\n  exp: ${exp}`); } };
// 1. Канон: кожна фраза корпусу перекладається в обидва боки дослівно (перша поява перемагає при дублях).
const seenU = new Set(), seenR = new Set();
for (const p of corpus.phrases) {
  if (!p.uk) continue;
  const ku = p.uk.toLowerCase(), kr = p.rune.toLowerCase();
  if (!seenU.has(ku)) { seenU.add(ku); eq(`canon uk->rune ${p.id}`, t.toRune(p.uk).text, p.rune); }
  if (!seenR.has(kr)) { seenR.add(kr); eq(`canon rune->uk ${p.id}`, t.toUk(p.rune).text, p.uk); }
}
// 2. Зафіксовані приклади
for (const c of cases.toRune) eq(`toRune "${c.in}" [${c.register ?? 'standard'}]`, t.toRune(c.in, { register: c.register }).text, c.out);
for (const c of cases.toUk) eq(`toUk "${c.in}"`, t.toUk(c.in).text, c.out);
for (const c of cases.generate) eq(`generate "${c.in}"`, t.generate(c.in), c.out);
// 3. Властивості генератора
for (const [a, b] of cases.sameStem) eq(`same stem ${a}/${b}`, t.generate(a), t.generate(b));
// 4. Слова спільноти (extra): мають перевагу й не зсувають генератор для інших слів
{
  const { corpus: c, lexicon: l, rules: r } = load();
  const gen = JSON.parse(readFileSync(new URL('../data/generator.json', import.meta.url), 'utf8'));
  const { createTranslator } = await import('../src/runna-core.js');
  const dict = JSON.parse(readFileSync(new URL('../data/dict.json', import.meta.url), 'utf8'));
  const t2 = createTranslator({ corpus: c, lexicon: l, rules: r, generator: gen, dict, extra: [{ rune: 'mrau', uk: ['кіт'], gloss: 'кіт', status: 'proposed' }, { rune: "sar'their", uk: ['вогонь'], gloss: 'вогонь', status: 'proposed' }, { rune: 'zzkor', uk: ['дракон'], gloss: 'дракон', status: 'canon' }] });
  eq('extra wins', t2.toRune('Дракон.').text, 'Zzkor.');
  eq('extra stems', t2.toRune('Немає вогню.').segments[1].kind, 'proposed');
  for (const w of ['храм', 'ніч', 'літописець', 'світанок']) eq(`extra keeps generator ${w}`, t2.generate(w), t.generate(w));
  eq('extra reverse', t2.toUk('Zzkor.').text, '[дракон]');
  eq('extra by lemma', t2.toRune('Котом.').text, 'Mrau.');
}
// 5. Словник лем: однозначність у зворотний бік і одна руна на лему
{
  const dict = JSON.parse(readFileSync(new URL('../data/dict.json', import.meta.url), 'utf8'));
  const lexRunes = new Set(JSON.parse(readFileSync(new URL('../data/lexicon.json', import.meta.url), 'utf8')).words.map((w) => w.rune));
  const gen = dict.words.filter((w) => w[1] !== '~' && !lexRunes.has(w[1]));
  eq('dict: кожне вигадане слово — одна лема', new Set(gen.map((w) => w[1])).size, gen.length);
  for (const [a, b, c2] of [['війна', 'війною', 'війни'], ['кіт', 'кота', 'котом'], ['ніч', 'ночі', 'вночі'], ['піти', 'пішла', 'пішов'], ['мене', 'мені', 'мною']])
    eq(`dict: одна лема ${a}/${b}/${c2}`, new Set([a, b, c2].map((x) => t.toRune(x).segments[0]?.out?.toLowerCase())).size, a === 'ніч' ? 2 : 1);
  eq('dict: назад — словникова форма', t.toUk(t.toRune('Котом.').text).text, '[кіт]');
  eq('dict: лема', t.lemma('пішла'), 'піти');
  eq('dict: службові форми пропускаються', t.toRune('Цього не буде.').segments.map((s) => s.src).join(' '), 'не буде');
}
console.log(`${n - fail}/${n} passed`); process.exit(fail ? 1 : 0);
