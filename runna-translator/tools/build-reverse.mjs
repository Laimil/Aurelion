// Генерує data/generated_reverse.json: рунне слово -> українські слова, для яких генератор його дає.
import { readFileSync, writeFileSync } from 'node:fs';
import { load } from './load.mjs';
const { t, lexicon, rules } = load();
const known = new Set(lexicon.words.flatMap((w) => w.uk.map((u) => t.stem(u))));
const stop = new Set(rules.stopwords);
const filter = JSON.parse(readFileSync(new URL('../data/uk_filter.json', import.meta.url), 'utf8'));
const block = new Set(filter.words), roots = filter.roots.map((r) => new RegExp(r)), ru = new RegExp(filter.russian_letters);
const junk = (w) => block.has(w) || (filter.no_vowels && !/[аеєиіїоуюя]/.test(w)) || ru.test(w) || roots.some((r) => r.test(w));
const all = readFileSync(new URL('../data/uk_frequent.txt', import.meta.url), 'utf8').split('\n').map((w) => w.trim()).filter(Boolean);
const words = all.filter((w) => !junk(w));
console.log(`uk_frequent: ${all.length}, відсіяно фільтром: ${all.length - words.length}`);
const out = {}, seen = new Set();
for (const w of words) {
  const s = t.stem(w);
  if (stop.has(w) || known.has(s) || seen.has(s) || w.length < 2) continue;
  seen.add(s); (out[t.generate(w)] ??= []).push(w);
}
writeFileSync(new URL('../data/generated_reverse.json', import.meta.url), JSON.stringify(out));
const n = Object.keys(out).length, multi = Object.values(out).filter((v) => v.length > 1).length;
console.log(`stems: ${seen.size}, rune words: ${n}, with collisions: ${multi}`);
