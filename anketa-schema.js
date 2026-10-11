/* Aurelion — порядок і склад анкети персонажа.
   Один список на кабінет гравця і на адмінку: пункти завжди ті самі й завжди
   в цьому порядку, а порожній пункт іде в анкету як «Відсутнє». */
(function (global) {
  'use strict';

  const EMPTY_WORD = 'Відсутнє';

  // kind: meta — графа бази (імʼя, вік, зріст/вага, покровителька) — показується
  // в шапці сторінки; sec — розділ тексту анкети (## Заголовок).
  const ITEMS = [
    { id: 'name',  kind: 'meta', label: 'ПІБ' },
    { id: 'age',   kind: 'meta', label: 'Вік/Дата народження',
      hint: 'У даті народження рік не потрібний — лише число й місяць.' },
    { id: 'body',  kind: 'meta', label: 'Ріст/Вага' },
    { id: 'Характер', kind: 'sec', label: 'Характер' },
    { id: 'Біографія', kind: 'sec', label: 'Біографія',
      hint: 'Моменти з дитинства · переломні періоди · як персонаж досягнув успіху і чи взагалі його досягнув · добре написати й вашу позицію щодо релігії.' },
    { id: 'Магічні здібності', kind: 'sec', label: 'Магічні здібності',
      hint: 'Назва здібності та її опис/навички. Ви народжуєтеся з конкретною магією: з двома типами магії народитися не можна, а чужу, не вроджену, — не можна вивчити.' },
    { id: 'Наслідки знищення артефакту', kind: 'sec', label: 'Наслідки знищення артефакту',
      hint: 'У світі 13 сильних артефактів, у яких запечатана магія первородного монстра, на якому лежить світ. Один знищено — хвиля темної магії пройшлася всім світом і могла зачепити кожного, хто не був у столиці імперії під щитом магів. Ваш персонаж може отримати баф, дебаф або імунітет (наслідки відсутні).' },
    { id: 'Розвиток персонажа', kind: 'sec', label: 'Розвиток персонажа',
      hint: 'Цілі персонажа — щоб він не входив у гру вже з максимальною магією і без мети.' },
    { id: 'deity', kind: 'meta', label: 'Божество покровитель',
      hint: 'Орієнтуйтесь на ваші здібності. Якщо важко — завжди можна звернутися до старших рп.' },
    { id: "Сім'я", kind: 'sec', label: "Сім'я" },
    { id: 'Додатково', kind: 'sec', label: 'Додатково',
      hint: 'Звички, особливості чи інші деталі, які допоможуть співролам проникнутися персонажем.' },
    { id: 'Зовнішність', kind: 'sec', label: 'Зовнішність',
      hint: 'Одне фото. Якщо бажаєте більше — їх додадуть у коментарях вашої анкети в анкетниці.' },
    { id: 'Альтернативна зовнішність', kind: 'sec', label: 'Альтр. зовнішність', optional: true,
      hint: 'Імʼя медійної людини з реальності, яка резонує з вашим персонажем, — для зручності відео в ТікТок. Пункт необовʼязковий.' },
  ];
  ITEMS.forEach((it, i) => { it.n = i + 1; it.num = String(i + 1).padStart(2, '0'); });
  const SECS = ITEMS.filter(x => x.kind === 'sec').map(x => x.id);

  const fold = s => String(s == null ? '' : s).toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '').replace(/[ʼ'’`ь]/g, '').replace(/[іїи]/g, 'и').replace(/є/g, 'е');

  // Старі й чужі назви розділів → куди їх класти. Що не впізнали — у «Додатково».
  // same — та сама графа під іншою назвою; into — окрема річ, яка лягає
  // всередину пункту під власним підзаголовком.
  const ALIAS = {};
  const same = (target, ...names) => names.forEach(n => { ALIAS[fold(n)] = { k: target, own: true }; });
  const into = (target, ...names) => names.forEach(n => { ALIAS[fold(n)] = { k: target, own: false }; });
  SECS.forEach(k => same(k, k));
  same('Характер', 'Особистість');
  same('Біографія', 'Історія', 'Передісторія');
  into('Біографія', 'Позиція до релігії', 'Віра', 'Ставлення до релігії');
  same('Магічні здібності', 'Здібності', 'Магія', 'Сила');
  into('Магічні здібності', 'Навички', 'Уміння', 'Обмеження', 'Ціна', 'Ціна сили', 'Слабкості', 'Слабкість', 'Вразливості');
  same('Наслідки знищення артефакту', 'Наслідки знищення', 'Наслідки');
  same('Розвиток персонажа', 'Розвиток', 'Арка');
  into('Розвиток персонажа', 'Поточні цілі', 'Цілі', 'Мета', 'Призначення');
  same("Сім'я", 'Родина', 'Сімʼя', 'Сім’я');
  same('Зовнішність', 'Опис зовнішності');
  same('Альтернативна зовнішність', 'Альтр. зовнішність', 'Альт. зовнішність', 'Альтр зовнішність');
  into('Альтернативна зовнішність', 'Прототип');
  same('Додатково', 'Інше', 'Примітки');

  const NONE = new Set(['', '-', '–', '—', '.', '...', 'відсутнє', 'відсутні', 'відсутній', 'відсутня', 'нема', 'немає', 'фото']
    .map(fold));
  const META = new Set(['ПІБ', "Ім'я", 'Вік/Дата народження', 'Вік', 'Дата народження', 'Ріст/Вага', 'Зріст/Вага',
    'Божество покровитель', 'Божество', 'Покровитель', 'Роль'].map(fold));
  const isNone = v => NONE.has(fold(v));
  const aliasOf = title => ALIAS[fold(title)] || { k: 'Додатково', own: false };

  // Будь-які розділи (обʼєкт або масив {title,text}) → рівно наші дев'ять.
  // Розділ, що ліг у чужий, іде туди з власним підзаголовком — нічого не губиться.
  function normalize(src, keep) {
    const pairs = Array.isArray(src)
      ? src.filter(x => x && x.title).map(x => [x.title, x.text])
      : Object.keys(src || {}).map(k => [k, src[k]]);
    const out = {};
    SECS.forEach(k => { out[k] = ''; });
    pairs.forEach(([title, text]) => {
      const raw = String(text == null ? '' : text);
      const v = keep ? raw : raw.trim();
      if (!v.trim() || isNone(v)) return;
      const { k, own } = aliasOf(title);
      const part = own ? v : `**${String(title).trim()}.**\n\n${v}`;
      out[k] = out[k] ? `${out[k]}\n\n${part}` : part;
    });
    return out;
  }

  // Розділи → вікі-текст: усі пункти по порядку, порожні — «Відсутнє».
  // keep — не обрізати пробіли й переноси (правка наживо: інакше Enter у кінці поля зникав би).
  function toMarkdown(sec, pre, keep) {
    const n = normalize(sec, keep);
    const head2 = k => (ITEMS.find(x => x.id === k) || {}).label || k;
    const body = SECS.map(k => `## ${head2(k)}\n\n${n[k] || EMPTY_WORD}`).join('\n\n');
    const head = String(pre || '').trim();
    return head ? `${head}\n\n${body}` : body;
  }

  // Вікі-текст → {pre, sec}. Ділимо лише по «## »: ### усередині розділу лишаються в ньому.
  function parseMarkdown(md) {
    const lines = String(md || '').replace(/\r/g, '').split('\n');
    const list = [];
    const pre = [];
    let cur = null;
    lines.forEach(l => {
      const m = l.match(/^##\s+(.+?)\s*$/);
      if (m && !/^###/.test(l)) {
        let title = m[1].replace(/^[^\p{L}]+/u, '').trim() || m[1];
        let first = '';
        const c = title.indexOf(':');
        if (c > 0) { first = title.slice(c + 1).trim(); title = title.slice(0, c).trim(); }
        cur = { title, text: first ? [first] : [] };
        list.push(cur);
      } else if (cur) cur.text.push(l);
      else pre.push(l);
    });
    // Графи бази (ПІБ, вік, зріст, божество), що потрапили в текст заголовками, — у вступ.
    const body = list.filter(x => {
      if (!META.has(fold(x.title))) return true;
      const v = x.text.join(' ').trim();
      if (v && !isNone(v)) pre.push(`**${x.title}:** ${v}`);
      return false;
    });
    return {
      pre: pre.join('\n').trim(),
      sec: normalize(body.map(x => ({ title: x.title, text: x.text.join('\n').replace(/^\n/, '').replace(/\n$/, '') })), true),
      // true — у тексті лише наші пункти, і перезапис нічого не переставить.
      known: list.length > 0 && list.every(x => (ALIAS[fold(x.title)] || {}).own),
    };
  }

  global.AnketaSchema = { ITEMS, SECS, EMPTY_WORD, normalize, toMarkdown, parseMarkdown, isNone, fold };
})(typeof window !== 'undefined' ? window : globalThis);
