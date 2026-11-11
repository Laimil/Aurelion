# Потрібно: pip install pymorphy3 pymorphy3-dicts-uk wordfreq   ·   запуск: python3 tools/build_lemmas.py [30000]
# Збирає леми: частотні форми (wordfreq) → найімовірніша лема (pymorphy3, за частотою леми) → усі форми парадигми.
import json, os, re, sys, pymorphy3
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
from wordfreq import top_n_list, word_frequency
N = int(sys.argv[1]) if len(sys.argv) > 1 else 30000
filt = json.load(open(os.path.join(ROOT, 'data/uk_filter.json'), encoding='utf-8'))
block = set(filt['words']); roots = [re.compile(r) for r in filt['roots']]; ru = re.compile(filt['russian_letters'])
UK = re.compile(r"^[а-яіїєґ']+$")
BAD = {'Abbr', 'Name', 'Surn', 'Patr', 'Geox', 'Orgn', 'UNKN', 'LATN', 'Litr', 'Fixd'}
junk = lambda w: w in block or not re.search('[аеєиіїоуюя]', w) or ru.search(w) or any(r.search(w) for r in roots)
m = pymorphy3.MorphAnalyzer(lang='uk')
# Прохід 1: кандидати-леми для кожної частої форми.
cand = {}   # форма -> [(лема, розбір)]
skipped = 0
for w in top_n_list('uk', N):
    w = w.replace('’', "'").replace('ʼ', "'")
    if not UK.match(w) or junk(w): skipped += 1; continue
    ps = [p for p in m.parse(w) if not (BAD & set(str(p.tag).replace(' ', ',').split(',')))]
    ps = [p for p in ps if not junk(p.normal_form)]
    if not ps: skipped += 1; continue
    seen_l = {}
    for p in ps: seen_l.setdefault(p.normal_form, p)
    cand[w] = list(seen_l.items())
# Вага леми — сумарна частота частих форм, які можуть їй належати (+ частота самої леми як слова).
# Так «вересня» дістається «вересень», а не рідкісному слову «вересня», а «мене» — «я», а не «мен».
score = {}
for w, cs in cand.items():
    for L, _ in cs: score[L] = score.get(L, 0.0) + word_frequency(w, 'uk')
lem = {}   # lemma -> {f, forms:set, pos}
seen = set()
for w, cs in cand.items():
    L, best = max(cs, key=lambda c: (score[c[0]], c[0] == w))
    e = lem.get(L)
    if not e:
        forms = {x.word for x in best.lexeme if UK.match(x.word)}
        e = lem[L] = {'f': 0.0, 'forms': forms | {L}, 'pos': str(best.tag.POS)}
    e['forms'].add(w); e['f'] += word_frequency(w, 'uk'); seen.add(w)
out = sorted(([L, e['f'], e['pos'], sorted(e['forms'])] for L, e in lem.items()), key=lambda x: -x[1])
json.dump(out, open(os.path.join(ROOT, 'data/lemmas.json'), 'w', encoding='utf-8'), ensure_ascii=False)
# форми, що справді трапляються часто (для поштучних винятків у dict.json)
json.dump(sorted(seen), open(os.path.join(ROOT, 'data/lemmas_frequent.json'), 'w', encoding='utf-8'), ensure_ascii=False)
print('lemmas', len(out), 'skipped forms', skipped, 'forms total', sum(len(x[3]) for x in out))

