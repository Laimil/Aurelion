import { readFileSync } from 'node:fs';
import { createTranslator } from '../src/runna-core.js';
const j = (n) => JSON.parse(readFileSync(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
export function load() {
  let reverse = {}, dict = null; try { dict = j('dict'); } catch {}
  return { t: createTranslator({ corpus: j('corpus'), lexicon: j('lexicon'), rules: j('rules'), generator: j('generator'), reverse, dict }), corpus: j('corpus'), lexicon: j('lexicon'), rules: j('rules') };
}
