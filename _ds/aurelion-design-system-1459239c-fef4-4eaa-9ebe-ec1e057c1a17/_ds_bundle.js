/* @ds-bundle: {"format":3,"namespace":"AurelionDesignSystem_145923","components":[{"name":"Button","sourcePath":"components/buttons/Button.jsx"},{"name":"Badge","sourcePath":"components/feedback/Badge.jsx"},{"name":"Tag","sourcePath":"components/feedback/Tag.jsx"},{"name":"Input","sourcePath":"components/forms/Input.jsx"},{"name":"Avatar","sourcePath":"components/surfaces/Avatar.jsx"},{"name":"Card","sourcePath":"components/surfaces/Card.jsx"},{"name":"StatList","sourcePath":"components/surfaces/StatList.jsx"}],"sourceHashes":{"components/buttons/Button.jsx":"60a8b815c914","components/feedback/Badge.jsx":"faa4aebd0efb","components/feedback/Tag.jsx":"ccf5974fa678","components/forms/Input.jsx":"f52af6e87c99","components/surfaces/Avatar.jsx":"0646d18c2a90","components/surfaces/Card.jsx":"ee57199a29d0","components/surfaces/StatList.jsx":"b8fc824ce45f","ui_kits/aurelion-site/app.jsx":"10aeb6bdd274","ui_kits/aurelion-site/data.js":"0cd89525591f","ui_kits/aurelion-site/screens.jsx":"1da5c0cb4f43","ui_kits/aurelion-site/ui.jsx":"86bde2e890c1"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.AurelionDesignSystem_145923 = window.AurelionDesignSystem_145923 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/Button.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Button — the primary action primitive.
 * Gold "primary" for divine/confirm actions, translucent "secondary" glass for
 * neutral actions, azure-outline "edit" for editorial actions, and bare "ghost".
 * Fully pill-shaped, with the site's signature scale-up hover.
 */
function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  iconLeft = null,
  iconRight = null,
  as = 'button',
  ...rest
}) {
  const sizes = {
    sm: {
      padding: '8px 16px',
      fontSize: 'var(--fs-sm)'
    },
    md: {
      padding: '11px 24px',
      fontSize: 'var(--fs-ui)'
    },
    lg: {
      padding: '14px 32px',
      fontSize: 'var(--fs-lg)'
    }
  };
  const variants = {
    primary: {
      background: 'var(--gold-500)',
      color: 'var(--accent-ink)',
      border: '1px solid var(--gold-500)',
      fontWeight: 'var(--fw-bold)'
    },
    secondary: {
      background: 'var(--glass-20)',
      color: 'var(--white)',
      border: '1px solid var(--line)',
      fontWeight: 'var(--fw-semibold)'
    },
    edit: {
      background: 'var(--azure-glass)',
      color: 'var(--azure-300)',
      border: '1px solid var(--azure-500)',
      fontWeight: 'var(--fw-semibold)'
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-80)',
      border: '1px solid transparent',
      fontWeight: 'var(--fw-medium)'
    }
  };
  const Tag = as;
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontFamily: 'var(--font-ui)',
    letterSpacing: 'var(--ls-ui)',
    borderRadius: 'var(--radius-pill)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.45 : 1,
    transition: 'transform var(--dur) var(--ease), background var(--dur) var(--ease), box-shadow var(--dur) var(--ease)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 1,
    ...sizes[size],
    ...variants[variant]
  };
  const onEnter = e => {
    if (disabled) return;
    e.currentTarget.style.transform = 'scale(var(--hover-scale))';
    if (variant === 'primary') e.currentTarget.style.boxShadow = 'var(--glow-gold)';
    if (variant === 'secondary') e.currentTarget.style.background = 'var(--glass-15)';
    if (variant === 'edit') e.currentTarget.style.background = 'rgba(100,149,237,0.38)';
    if (variant === 'ghost') e.currentTarget.style.background = 'var(--glass-06)';
  };
  const onLeave = e => {
    e.currentTarget.style.transform = 'scale(1)';
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.background = variants[variant].background;
  };
  return /*#__PURE__*/React.createElement(Tag, _extends({
    style: style,
    disabled: as === 'button' ? disabled : undefined,
    onMouseEnter: onEnter,
    onMouseLeave: onLeave
  }, rest), iconLeft, children, iconRight);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/Button.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Badge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Badge — the status pill used across story/script listings.
 * "main" = gold (primary storyline), "secondary" = azure, plus neutral/danger/success.
 */
function Badge({
  children,
  tone = 'neutral',
  ...rest
}) {
  const tones = {
    main: {
      background: 'var(--gold-glass)',
      color: 'var(--gold-500)',
      border: '1px solid var(--gold-500)'
    },
    secondary: {
      background: 'var(--azure-glass)',
      color: 'var(--azure-300)',
      border: '1px solid var(--azure-500)'
    },
    neutral: {
      background: 'var(--glass-10)',
      color: 'var(--text-80)',
      border: '1px solid var(--line)'
    },
    danger: {
      background: 'var(--danger-glass)',
      color: 'var(--danger-500)',
      border: '1px solid var(--danger-500)'
    },
    success: {
      background: 'var(--success-glass)',
      color: 'var(--success-500)',
      border: '1px solid var(--success-500)'
    }
  };
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '5px 12px',
      borderRadius: 'var(--radius-pill)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-bold)',
      letterSpacing: 'var(--ls-ui)',
      textTransform: 'uppercase',
      lineHeight: 1,
      ...tones[tone]
    }
  }, rest), children);
}
Object.assign(__ds_scope, { Badge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Badge.jsx", error: String((e && e.message) || e) }); }

// components/feedback/Tag.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Tag — a small soft chip for traits, factions, deity domains, etc.
 * `accent` tints the dot + text with one of the five pantheon colors or an accent.
 */
function Tag({
  children,
  accent = 'neutral',
  dot = true,
  ...rest
}) {
  const accents = {
    neutral: 'var(--text-70)',
    gold: 'var(--gold-500)',
    azure: 'var(--azure-500)',
    light: 'var(--god-light)',
    dark: 'var(--god-dark)',
    fate: 'var(--god-fate)',
    nature: 'var(--god-nature)',
    magic: 'var(--god-magic)'
  };
  const c = accents[accent] || accents.neutral;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '7px',
      padding: '4px 11px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--glass-06)',
      border: '1px solid var(--line-soft)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 'var(--fw-medium)',
      color: 'var(--text-80)',
      lineHeight: 1.4,
      ...rest.style
    }
  }, rest), dot && /*#__PURE__*/React.createElement("span", {
    style: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      background: c,
      flexShrink: 0
    }
  }), children);
}
Object.assign(__ds_scope, { Tag });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/Tag.jsx", error: String((e && e.message) || e) }); }

// components/forms/Input.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Input — pill-shaped field on translucent glass, matching the site's
 * search bars. `variant="search"` adds a leading magnifier and full pill radius;
 * `variant="text"` is a softer-radius standard field.
 */
function Input({
  variant = 'text',
  icon = null,
  placeholder = '',
  fullWidth = false,
  ...rest
}) {
  const [focused, setFocused] = React.useState(false);
  const isSearch = variant === 'search';
  const wrap = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    width: fullWidth ? '100%' : 'auto',
    padding: isSearch ? '11px 20px' : '11px 16px',
    background: focused ? 'var(--glass-15)' : 'var(--glass-10)',
    border: `2px solid ${focused ? 'var(--border-focus)' : 'var(--border-input)'}`,
    borderRadius: isSearch ? 'var(--radius-pill)' : 'var(--radius-md)',
    transition: 'all var(--dur) var(--ease)',
    boxSizing: 'border-box'
  };
  const input = {
    flex: 1,
    minWidth: 0,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: 'var(--white)',
    fontFamily: 'var(--font-ui)',
    fontSize: 'var(--fs-ui)',
    lineHeight: 1.4
  };
  const glyph = /*#__PURE__*/React.createElement("svg", {
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    style: {
      color: 'var(--text-50)',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  }));
  return /*#__PURE__*/React.createElement("label", {
    style: wrap
  }, isSearch ? glyph : icon, /*#__PURE__*/React.createElement("input", _extends({
    style: input,
    placeholder: placeholder,
    onFocus: e => {
      setFocused(true);
      rest.onFocus && rest.onFocus(e);
    },
    onBlur: e => {
      setFocused(false);
      rest.onBlur && rest.onBlur(e);
    }
  }, rest)));
}
Object.assign(__ds_scope, { Input });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/forms/Input.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Avatar.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Avatar — circular or rounded portrait with an optional gilded ring,
 * echoing the gold halo of the site's hero art.
 */
function Avatar({
  src,
  alt = '',
  size = 56,
  shape = 'circle',
  ring = false,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: 'inline-block',
      width: size,
      height: size,
      borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
      padding: ring ? 2 : 0,
      background: ring ? 'linear-gradient(135deg, var(--gold-400), var(--gold-700))' : 'transparent',
      boxShadow: ring ? 'var(--glow-gold)' : 'none',
      flexShrink: 0,
      ...rest.style
    }
  }, rest), /*#__PURE__*/React.createElement("img", {
    src: src,
    alt: alt,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      borderRadius: shape === 'circle' ? '50%' : 'var(--radius-md)',
      border: ring ? '2px solid var(--ink-700)' : '1px solid var(--line)'
    }
  }));
}
Object.assign(__ds_scope, { Avatar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Avatar.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/Card.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion Card — the translucent glass surface used everywhere (world tiles,
 * deity cards, story rows). Optional image header; optional hover behaviour
 * ("lift" rises + deepens shadow, "grow" scales up — both straight from the site).
 */
function Card({
  children,
  image = null,
  imageHeight = 170,
  hover = 'lift',
  padding = 'var(--space-5)',
  glow = null,
  ...rest
}) {
  const [hot, setHot] = React.useState(false);
  const base = {
    background: hot ? 'var(--surface-card-hover)' : 'var(--surface-card)',
    border: '1px solid var(--border-card)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: hot ? glow ? `var(--shadow-lg), ${glow}` : 'var(--shadow-lg)' : 'var(--shadow-md)',
    overflow: 'hidden',
    transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease), background var(--dur) var(--ease)',
    transform: hover === 'lift' ? hot ? 'translateY(var(--hover-lift))' : 'none' : hover === 'grow' ? hot ? 'scale(var(--hover-scale))' : 'none' : 'none',
    ...rest.style
  };
  delete base.style;
  return /*#__PURE__*/React.createElement("div", _extends({
    style: base,
    onMouseEnter: () => hover !== 'none' && setHot(true),
    onMouseLeave: () => setHot(false)
  }, rest), image && /*#__PURE__*/React.createElement("div", {
    style: {
      height: imageHeight,
      width: '100%',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: image,
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      transition: 'transform var(--dur-slow) var(--ease)',
      transform: hot ? 'scale(1.06)' : 'scale(1)'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding
    }
  }, children));
}
Object.assign(__ds_scope, { Card });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/Card.jsx", error: String((e && e.message) || e) }); }

// components/surfaces/StatList.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * Aurelion StatList — the label / value rows used on character profiles
 * (Вік, Ріст, Божество-покровитель, …). Hairline-separated, key in muted caps.
 */
function StatList({
  items = [],
  ...rest
}) {
  return /*#__PURE__*/React.createElement("ul", _extends({
    style: {
      listStyle: 'none',
      margin: 0,
      padding: 0,
      ...rest.style
    }
  }, rest), items.map((it, i) => /*#__PURE__*/React.createElement("li", {
    key: i,
    style: {
      display: 'flex',
      gap: 'var(--space-4)',
      padding: '11px 0',
      borderBottom: i === items.length - 1 ? 'none' : '1px solid var(--line-soft)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--fs-sm)'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-label)',
      fontWeight: 'var(--fw-bold)',
      minWidth: 160,
      flexShrink: 0,
      letterSpacing: 'var(--ls-ui)'
    }
  }, it.label), /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--text-body)'
    }
  }, it.value))));
}
Object.assign(__ds_scope, { StatList });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/surfaces/StatList.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aurelion-site/app.jsx
try { (() => {
// Aurelion site — app shell + state router
function App() {
  const [route, setRoute] = React.useState('world');
  const [char, setChar] = React.useState(null);
  const go = r => {
    setRoute(r);
    window.scrollTo({
      top: 0
    });
  };
  const openProfile = c => {
    setChar(c);
    setRoute('profile');
    window.scrollTo({
      top: 0
    });
  };
  let screen;
  switch (route) {
    case 'world':
      screen = /*#__PURE__*/React.createElement(window.WorldHub, {
        go: go
      });
      break;
    case 'characters':
      screen = /*#__PURE__*/React.createElement(window.CharacterGallery, {
        go: go,
        openProfile: openProfile
      });
      break;
    case 'profile':
      screen = /*#__PURE__*/React.createElement(window.CharacterProfile, {
        char: char,
        back: () => go('characters')
      });
      break;
    case 'pantheon':
      screen = /*#__PURE__*/React.createElement(window.Pantheon, null);
      break;
    case 'stories':
      screen = /*#__PURE__*/React.createElement(window.StoryList, null);
      break;
    default:
      screen = /*#__PURE__*/React.createElement(window.Stub, {
        route: route
      });
  }
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement(window.TopNav, {
    route: route,
    go: go
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      paddingBottom: '24px'
    }
  }, screen), /*#__PURE__*/React.createElement(window.Footer, null));
}
ReactDOM.createRoot(document.getElementById('root')).render(/*#__PURE__*/React.createElement(App, null));
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aurelion-site/app.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aurelion-site/data.js
try { (() => {
// Aurelion site — content lifted from the live worldbuilding portal (Laimil/Aurelion).
// Ukrainian copy preserved verbatim where possible.

window.AURELION_DATA = {
  sections: [{
    title: 'Правила',
    desc: 'Як ми тут живемо…',
    img: 'rules',
    key: 'rules'
  }, {
    title: 'Сюжет',
    desc: 'Сюжет та передісторія',
    img: 'script',
    key: 'stories'
  }, {
    title: 'Світобудова',
    desc: 'Все що потрібно знати про наш світ',
    img: 'world',
    key: 'world'
  }, {
    title: 'Релігія',
    desc: 'Божества та їх можливості',
    img: 'religion',
    key: 'pantheon'
  }, {
    title: 'Персонажі',
    desc: 'Так-так, вони ваші',
    img: 'hero',
    key: 'characters'
  }, {
    title: "Зв'язок",
    desc: 'Те чим воно є',
    img: 'contacts',
    key: 'contacts'
  }],
  deities: [{
    name: 'Леста',
    domain: 'Світло і Життя',
    accent: 'light',
    img: 'lesta',
    drake: 'Золотий дракон зі світними лусками',
    desc: 'Сфера: світло, життя, знання, здоров’я, родючість. Забезпечує здоров’я і благополуччя, підтримує просвітництво, дарує надію та світло.'
  }, {
    name: 'Нокта',
    domain: 'Темрява і Смерть',
    accent: 'dark',
    img: 'nokta',
    drake: 'Чорний дракон з темними крилами',
    desc: 'Сфера: темрява, смерть, таємниці, перехід. Підтримує баланс між життям і смертю, захищає таємниці, забезпечує спокій і завершення.'
  }, {
    name: 'Конкорфату',
    domain: 'Доля і Гармонія',
    accent: 'fate',
    img: 'konkorfatu',
    drake: 'Бордовий дракон з білими очима',
    desc: 'Сфера: доля, баланс, мир, час. Врівноважує визначеність і випадковість, допомагає знаходити своє місце, підтримує мир і стабільність.'
  }, {
    name: 'Флоріана',
    domain: 'Природа',
    accent: 'nature',
    img: 'floriana',
    drake: 'Синій дракон з лісистими крилами',
    desc: 'Сфера: природа, стихії, екологія, відродження. Забезпечує гармонію між людством і природою, підтримує екологічний баланс і регенерацію.'
  }, {
    name: 'Арканія',
    domain: 'Мудрість і Магія',
    accent: 'magic',
    img: 'arcania',
    drake: 'Сріблястий дракон з очима золотистого відтінку',
    desc: 'Сфера: мудрість, магія, знання, навчання. Навчає магів, поширює знання, підтримує магічні науки. Залишається найближчою до людства.'
  }],
  characters: [{
    name: 'Амадей Віллар',
    alias: 'Садист',
    img: 'amadej',
    age: '26 років',
    hw: '190 см / 87 кг',
    patron: 'Нокта',
    tags: [['Тіні', 'dark'], ['Шпигун', 'neutral']],
    bio: 'У жорстокості його ростили, в нюанси жорстокості присвячували. Названий батько викував із нього першокласного шпигуна та найманого вбивцю. Понині живе бажанням мстити.'
  }, {
    name: 'Амелія Бінах',
    alias: '',
    img: 'amelia',
    age: '—',
    hw: '—',
    patron: 'Флоріана',
    tags: [['Природа', 'nature']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Арбо Вірідіс',
    alias: '',
    img: 'arbo',
    age: '—',
    hw: '—',
    patron: 'Флоріана',
    tags: [['Природа', 'nature']],
    bio: 'Профіль персонажа світу Aurelion. Носій прізвища Вірідіс.'
  }, {
    name: 'Генрі Вістрал-Тес',
    alias: '',
    img: 'henry',
    age: '—',
    hw: '—',
    patron: 'Конкорфату',
    tags: [['Доля', 'fate']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Іда Трілл',
    alias: '',
    img: 'idatrill',
    age: '—',
    hw: '—',
    patron: 'Арканія',
    tags: [['Магія', 'magic']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Іксо',
    alias: '',
    img: 'ikso',
    age: '—',
    hw: '—',
    patron: 'Нокта',
    tags: [['Таємниці', 'dark']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Ясмина Хайдісс',
    alias: '',
    img: 'jasmyna',
    age: '—',
    hw: '—',
    patron: 'Арканія',
    tags: [['Магія', 'magic']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: "Каан Ар'Заха",
    alias: '',
    img: 'kaan',
    age: '—',
    hw: '—',
    patron: 'Конкорфату',
    tags: [['Доля', 'fate']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Канделарія Фокс',
    alias: '',
    img: 'kandelaria',
    age: '—',
    hw: '—',
    patron: 'Конкорфату',
    tags: [['Доля', 'fate']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Кастор Атейрос',
    alias: '',
    img: 'kastor',
    age: '—',
    hw: '—',
    patron: 'Арканія',
    tags: [['Магія', 'magic']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Ліам Бреккер',
    alias: '',
    img: 'liam',
    age: '—',
    hw: '—',
    patron: 'Леста',
    tags: [['Світло', 'light']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: "Лýна Рів'єр",
    alias: '',
    img: 'luna',
    age: '—',
    hw: '—',
    patron: 'Леста',
    tags: [['Світло', 'light']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Міхаелла Мор',
    alias: '',
    img: 'mor',
    age: '—',
    hw: '—',
    patron: 'Флоріана',
    tags: [['Природа', 'nature']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: "Наганохара Шин'я",
    alias: '',
    img: 'nagohara',
    age: '—',
    hw: '—',
    patron: 'Нокта',
    tags: [['Таємниці', 'dark']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Рубус Вірідіс',
    alias: '',
    img: 'rubus',
    age: '—',
    hw: '—',
    patron: 'Флоріана',
    tags: [['Природа', 'nature']],
    bio: 'Профіль персонажа світу Aurelion. Носій прізвища Вірідіс.'
  }, {
    name: 'Сальвіан Корвус',
    alias: '',
    img: 'salvian',
    age: '—',
    hw: '—',
    patron: 'Нокта',
    tags: [['Таємниці', 'dark']],
    bio: 'Профіль персонажа світу Aurelion.'
  }, {
    name: 'Сяо Фєй',
    alias: '',
    img: 'sjao',
    age: '—',
    hw: '—',
    patron: 'Арканія',
    tags: [['Магія', 'magic']],
    bio: 'Профіль персонажа світу Aurelion.'
  }],
  stories: [{
    title: 'Ваал',
    status: 'main',
    img: 'script',
    desc: 'Імперія Ауреліон: світ на межі знищення. Головна сюжетна лінія.'
  }, {
    title: 'Работоргівля',
    status: 'secondary',
    img: 'stories',
    desc: 'Другорядна сюжетна гілка, що пронизує тіньові кутки імперії.'
  }]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aurelion-site/data.js", error: String((e && e.message) || e) }); }

// ui_kits/aurelion-site/screens.jsx
try { (() => {
// Aurelion site — screens
const {
  Card,
  Badge,
  Tag,
  Avatar,
  StatList,
  Input,
  Button
} = window.AurelionDesignSystem_145923;

/* ---------- World hub (home) ---------- */
function WorldHub({
  go
}) {
  const D = window.AURELION_DATA;
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'relative',
      height: '340px',
      overflow: 'hidden'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.img('hero'),
    alt: "",
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      objectPosition: 'center 25%'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      background: 'linear-gradient(180deg, rgba(15,15,16,.45) 0%, rgba(15,15,16,.2) 40%, rgba(26,26,26,1) 100%)'
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      position: 'absolute',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "au-overline",
    style: {
      marginBottom: '14px'
    }
  }, "\u0406\u043C\u043F\u0435\u0440\u0456\u044F \u043D\u0430 \u043C\u0435\u0436\u0456 \u0437\u043D\u0438\u0449\u0435\u043D\u043D\u044F"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--fs-display-lg)',
      fontWeight: 900,
      letterSpacing: '0.14em',
      margin: 0,
      textShadow: 'var(--glow-gold)'
    }
  }, "AURELION"), /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      color: 'var(--text-80)',
      fontSize: 'var(--fs-lg)',
      margin: '14px 0 24px'
    }
  }, "\u0421\u0432\u0456\u0442\u043E\u0431\u0443\u0434\u043E\u0432\u0430, \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0456 \u0442\u0430 \u0456\u0441\u0442\u043E\u0440\u0456\u0457 \u0443\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u043E\u0457 \u0444\u0435\u043D\u0442\u0435\u0437\u0456 \u0420\u041F-\u0441\u043F\u0456\u043B\u044C\u043D\u043E\u0442\u0438"), /*#__PURE__*/React.createElement(Button, {
    variant: "primary",
    onClick: () => go('characters')
  }, "\u0417\u0443\u0441\u0442\u0440\u0456\u0442\u0438 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0456\u0432"))), /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '40px 24px 0'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '20px'
    }
  }, D.sections.map(s => /*#__PURE__*/React.createElement("button", {
    key: s.key,
    onClick: () => go(s.key),
    style: {
      all: 'unset',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    image: window.img(s.img),
    imageHeight: 150,
    hover: "grow",
    glow: "var(--glow-gold)"
  }, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-title)',
      color: 'var(--text-100)',
      margin: '0 0 6px',
      letterSpacing: '0.05em'
    }
  }, s.title), /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      margin: 0,
      color: 'var(--text-50)',
      fontSize: 'var(--fs-sm)'
    }
  }, s.desc)))))));
}

/* ---------- Character gallery ---------- */
function CharacterGallery({
  go,
  openProfile
}) {
  const D = window.AURELION_DATA;
  const [q, setQ] = React.useState('');
  const list = D.characters.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || (c.alias || '').toLowerCase().includes(q.toLowerCase()));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement(window.PageHead, {
    kicker: "\u0422\u0430\u043A-\u0442\u0430\u043A, \u0432\u043E\u043D\u0438 \u0432\u0430\u0448\u0456",
    title: "\u041F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0456",
    sub: `${D.characters.length} мешканців імперії Ауреліон`
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: '32px'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '420px',
      maxWidth: '100%'
    }
  }, /*#__PURE__*/React.createElement(Input, {
    variant: "search",
    placeholder: "\u041F\u043E\u0448\u0443\u043A \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430\u2026",
    fullWidth: true,
    value: q,
    onChange: e => setQ(e.target.value)
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(5, 1fr)',
      gap: '16px'
    }
  }, list.map(c => /*#__PURE__*/React.createElement("button", {
    key: c.name,
    onClick: () => openProfile(c),
    style: {
      all: 'unset',
      cursor: 'pointer'
    }
  }, /*#__PURE__*/React.createElement(Card, {
    hover: "lift",
    padding: "12px"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-md)',
      overflow: 'hidden',
      marginBottom: '10px',
      aspectRatio: '3/4'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.img(c.img),
    alt: c.name,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-sm)',
      color: 'var(--text-100)',
      letterSpacing: '0.03em',
      lineHeight: 1.3
    }
  }, c.name), c.alias && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--fs-xs)',
      color: 'var(--text-50)',
      marginTop: '2px'
    }
  }, "\xAB", c.alias, "\xBB")))), list.length === 0 && /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      color: 'var(--text-50)',
      gridColumn: '1/-1',
      textAlign: 'center'
    }
  }, "\u041D\u0456\u043A\u043E\u0433\u043E \u043D\u0435 \u0437\u043D\u0430\u0439\u0434\u0435\u043D\u043E.")));
}

/* ---------- Character profile ---------- */
function CharacterProfile({
  char,
  back
}) {
  const c = char;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-read)',
      margin: '0 auto',
      padding: '28px 24px 0'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "ghost",
    size: "sm",
    onClick: back,
    iconLeft: /*#__PURE__*/React.createElement("span", null, "\u2190")
  }, "\u0412\u0441\u0456 \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0456"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: '300px 1fr',
      gap: '32px',
      marginTop: '20px'
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--line)'
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.img(c.img),
    alt: c.name,
    style: {
      width: '100%',
      display: 'block'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      flexWrap: 'wrap',
      marginTop: '14px'
    }
  }, c.tags.map(([t, a]) => /*#__PURE__*/React.createElement(Tag, {
    key: t,
    accent: a
  }, t)))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "au-overline",
    style: {
      marginBottom: '10px'
    }
  }, "\u041F\u0440\u043E\u0444\u0456\u043B\u044C \u043F\u0435\u0440\u0441\u043E\u043D\u0430\u0436\u0430"), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--fs-display-sm)',
      fontWeight: 900,
      letterSpacing: '0.06em',
      margin: '0 0 4px'
    }
  }, c.name), c.alias && /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: 'var(--font-lore)',
      fontStyle: 'italic',
      color: 'var(--gold-500)',
      fontSize: 'var(--fs-lg)',
      marginBottom: '18px'
    }
  }, "\xAB", c.alias, "\xBB"), /*#__PURE__*/React.createElement(StatList, {
    items: [{
      label: 'Вік',
      value: c.age
    }, {
      label: 'Ріст / Вага',
      value: c.hw
    }, {
      label: 'Божество-покровитель',
      value: c.patron
    }]
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: '22px',
      background: 'var(--surface-card)',
      border: '1px solid var(--border-card)',
      borderRadius: 'var(--radius-xl)',
      padding: '22px'
    }
  }, /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-title)',
      color: 'var(--text-100)',
      margin: '0 0 12px',
      paddingBottom: '10px',
      borderBottom: '1px solid var(--line)',
      letterSpacing: '0.04em'
    }
  }, "\u0411\u0456\u043E\u0433\u0440\u0430\u0444\u0456\u044F"), /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      margin: 0,
      textAlign: 'justify',
      color: 'var(--text-80)'
    }
  }, c.bio)))));
}

/* ---------- Pantheon (religion) ---------- */
function Pantheon() {
  const D = window.AURELION_DATA;
  const [hot, setHot] = React.useState(null);
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container)',
      margin: '0 auto',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement(window.PageHead, {
    kicker: "\u0411\u043E\u0436\u0435\u0441\u0442\u0432\u0430 \u0442\u0430 \u0457\u0445 \u043C\u043E\u0436\u043B\u0438\u0432\u043E\u0441\u0442\u0456",
    title: "\u0420\u0435\u043B\u0456\u0433\u0456\u0457 \u0442\u0430 \u0411\u043E\u0433\u0438",
    sub: "\u041F'\u044F\u0442\u044C \u0431\u043E\u0433\u0456\u0432, \u043F'\u044F\u0442\u044C \u0434\u0440\u0430\u043A\u043E\u043D\u0456\u0432-\u043F\u043E\u0441\u043B\u0430\u043D\u0446\u0456\u0432 \u2014 \u0431\u0430\u043B\u0430\u043D\u0441 \u0441\u0432\u0456\u0442\u0443 \u0410\u0443\u0440\u0435\u043B\u0456\u043E\u043D"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
      gap: '22px'
    }
  }, D.deities.map(d => {
    const on = hot === d.name;
    return /*#__PURE__*/React.createElement("article", {
      key: d.name,
      onMouseEnter: () => setHot(d.name),
      onMouseLeave: () => setHot(null),
      style: {
        background: 'var(--surface-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: on ? `var(--shadow-lg), var(--glow-gold)` : 'var(--shadow-md)',
        transform: on ? 'translateY(-5px)' : 'none',
        transition: 'transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        background: 'var(--bg-void)',
        display: 'flex',
        justifyContent: 'center'
      }
    }, /*#__PURE__*/React.createElement("img", {
      src: window.img(d.img),
      alt: d.name,
      style: {
        width: '100%',
        height: 'auto',
        display: 'block',
        objectFit: 'contain'
      }
    })), /*#__PURE__*/React.createElement("div", {
      style: {
        padding: 'var(--space-5)'
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: `var(--god-${d.accent})`
      }
    }), /*#__PURE__*/React.createElement("h3", {
      style: {
        fontFamily: 'var(--font-display)',
        fontSize: 'var(--fs-title)',
        color: 'var(--text-100)',
        margin: 0,
        letterSpacing: '0.05em'
      }
    }, d.name)), /*#__PURE__*/React.createElement("div", {
      style: {
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-xs)',
        letterSpacing: 'var(--ls-overline)',
        textTransform: 'uppercase',
        color: `var(--god-${d.accent})`,
        marginBottom: '10px'
      }
    }, d.domain), /*#__PURE__*/React.createElement("p", {
      className: "au-lore",
      style: {
        margin: '0 0 12px',
        color: 'var(--text-70)',
        fontSize: 'var(--fs-sm)'
      }
    }, d.desc), /*#__PURE__*/React.createElement("div", {
      style: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        paddingTop: '12px',
        borderTop: '1px solid var(--line-soft)',
        color: 'var(--text-50)',
        fontSize: 'var(--fs-xs)',
        fontFamily: 'var(--font-ui)'
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        color: 'var(--gold-600)'
      }
    }, "\uD83D\uDC09"), d.drake)));
  })));
}

/* ---------- Story list ---------- */
function StoryList() {
  const D = window.AURELION_DATA;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-read)',
      margin: '0 auto',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement(window.PageHead, {
    kicker: "\u0421\u044E\u0436\u0435\u0442 \u0442\u0430 \u043F\u0435\u0440\u0435\u0434\u0456\u0441\u0442\u043E\u0440\u0456\u044F",
    title: "\u0421\u044E\u0436\u0435\u0442\u043D\u0456 \u043B\u0456\u043D\u0456\u0457"
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }
  }, D.stories.map((s, i) => /*#__PURE__*/React.createElement(Card, {
    key: s.title,
    hover: "lift",
    padding: "0"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: i % 2 ? 'row-reverse' : 'row',
      gap: '22px',
      alignItems: 'stretch'
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: '300px',
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("img", {
    src: window.img(s.img),
    alt: s.title,
    style: {
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      display: 'block',
      minHeight: '180px'
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: '24px 24px 24px 0',
      textAlign: 'left'
    }
  }, /*#__PURE__*/React.createElement(Badge, {
    tone: s.status === 'main' ? 'main' : 'secondary'
  }, s.status === 'main' ? 'Головний сюжет' : 'Другорядний'), /*#__PURE__*/React.createElement("h2", {
    style: {
      fontFamily: 'var(--font-display)',
      fontSize: 'var(--fs-display-sm)',
      color: 'var(--text-100)',
      margin: '12px 0 8px',
      letterSpacing: '0.05em'
    }
  }, s.title), /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      color: 'var(--text-70)',
      margin: '0 0 18px'
    }
  }, s.desc), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement(Button, {
    variant: "secondary",
    size: "sm"
  }, "\u0427\u0438\u0442\u0430\u0442\u0438"), /*#__PURE__*/React.createElement(Button, {
    variant: "edit",
    size: "sm"
  }, "\u0420\u0435\u0434\u0430\u0433\u0443\u0432\u0430\u0442\u0438"))))))));
}

/* ---------- Simple stub for rules / contacts ---------- */
function Stub({
  route
}) {
  const map = {
    rules: {
      k: 'Як ми тут живемо…',
      t: 'Правила спільноти',
      s: 'Гайдлайни для учасників RP-спільноти.'
    },
    contacts: {
      k: 'Те чим воно є',
      t: "Зв'язок",
      s: 'Координація спільноти ведеться в Telegram-каналах.'
    }
  };
  const m = map[route] || map.rules;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 'var(--container-read)',
      margin: '0 auto',
      padding: '0 24px'
    }
  }, /*#__PURE__*/React.createElement(window.PageHead, {
    kicker: m.k,
    title: m.t,
    sub: m.s
  }), /*#__PURE__*/React.createElement(Card, {
    hover: "none",
    padding: "40px"
  }, /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      textAlign: 'center',
      color: 'var(--text-50)',
      margin: 0
    }
  }, "\u0426\u0435\u0439 \u0440\u043E\u0437\u0434\u0456\u043B \u0456\u0441\u043D\u0443\u0454 \u043D\u0430 \u0436\u0438\u0432\u043E\u043C\u0443 \u043F\u043E\u0440\u0442\u0430\u043B\u0456; \u0442\u0443\u0442 \u0437\u0430\u043B\u0438\u0448\u0435\u043D\u043E \u043D\u0430\u0432\u043C\u0438\u0441\u043D\u043E \u043F\u043E\u0440\u043E\u0436\u043D\u0456\u043C \u0443 \u043D\u0430\u0431\u043E\u0440\u0456 UI.")));
}
Object.assign(window, {
  WorldHub,
  CharacterGallery,
  CharacterProfile,
  Pantheon,
  StoryList,
  Stub
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aurelion-site/screens.jsx", error: String((e && e.message) || e) }); }

// ui_kits/aurelion-site/ui.jsx
try { (() => {
// Aurelion site — shared chrome (top nav, footer, helpers)
const DS = window.AurelionDesignSystem_145923;
const ASSET = '../../assets';

// resolve a short image key to its real path
function img(key) {
  const chars = ['amadej', 'amelia', 'arbo', 'henry', 'idatrill', 'ikso', 'jasmyna', 'kaan', 'kandelaria', 'kastor', 'liam', 'luna', 'mor', 'nagohara', 'rubus', 'salvian', 'sjao'];
  const png = ['idatrill'];
  const deities = ['lesta', 'nokta', 'konkorfatu', 'floriana', 'arcania'];
  if (chars.includes(key)) return `${ASSET}/characters/${key}.${png.includes(key) ? 'png' : 'jpg'}`;
  if (deities.includes(key)) return `${ASSET}/deities/${key}.jpg`;
  return `${ASSET}/images/${key}.jpg`;
}
const NAV = [{
  key: 'world',
  label: 'Світобудова'
}, {
  key: 'characters',
  label: 'Персонажі'
}, {
  key: 'pantheon',
  label: 'Релігія'
}, {
  key: 'stories',
  label: 'Сюжет'
}, {
  key: 'rules',
  label: 'Правила'
}, {
  key: 'contacts',
  label: "Зв'язок"
}];
function TopNav({
  route,
  go
}) {
  return /*#__PURE__*/React.createElement("nav", {
    style: {
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      height: 'var(--bar-h)',
      background: 'var(--bg-bar)',
      backdropFilter: 'blur(var(--blur))',
      borderBottom: '1px solid var(--line-soft)',
      boxShadow: 'var(--shadow-bar)'
    }
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => go('world'),
    style: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '10px'
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: 'var(--gold-500)',
      fontSize: '14px',
      letterSpacing: '3px'
    }
  }, "\u2726"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: 'var(--font-display)',
      fontWeight: 900,
      fontSize: '1.4rem',
      letterSpacing: '0.14em',
      color: 'var(--text-100)'
    }
  }, "AURELION")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: 'flex',
      gap: '4px'
    }
  }, NAV.map(n => {
    const active = route === n.key || n.key === 'characters' && route === 'profile';
    return /*#__PURE__*/React.createElement("button", {
      key: n.key,
      onClick: () => go(n.key),
      style: {
        background: active ? 'var(--glass-10)' : 'transparent',
        border: '1px solid ' + (active ? 'var(--line)' : 'transparent'),
        color: active ? 'var(--gold-500)' : 'var(--text-70)',
        fontFamily: 'var(--font-ui)',
        fontSize: 'var(--fs-sm)',
        fontWeight: 500,
        padding: '7px 14px',
        borderRadius: 'var(--radius-pill)',
        cursor: 'pointer',
        transition: 'all var(--dur) var(--ease)',
        whiteSpace: 'nowrap'
      },
      onMouseEnter: e => {
        if (!active) {
          e.currentTarget.style.color = 'var(--white)';
          e.currentTarget.style.background = 'var(--glass-06)';
        }
      },
      onMouseLeave: e => {
        if (!active) {
          e.currentTarget.style.color = 'var(--text-70)';
          e.currentTarget.style.background = 'transparent';
        }
      }
    }, n.label);
  })));
}
function PageHead({
  kicker,
  title,
  sub
}) {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      textAlign: 'center',
      padding: '52px 24px 32px'
    }
  }, kicker && /*#__PURE__*/React.createElement("div", {
    className: "au-overline",
    style: {
      marginBottom: '12px'
    }
  }, kicker), /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 'var(--fs-display-md)',
      fontWeight: 900,
      letterSpacing: '0.08em',
      margin: 0
    }
  }, title), sub && /*#__PURE__*/React.createElement("p", {
    className: "au-lore",
    style: {
      color: 'var(--text-50)',
      maxWidth: '52ch',
      margin: '14px auto 0'
    }
  }, sub));
}
function Footer() {
  return /*#__PURE__*/React.createElement("footer", {
    style: {
      marginTop: '64px',
      padding: '28px',
      textAlign: 'center',
      borderTop: '1px solid var(--line-soft)',
      color: 'var(--text-35)',
      fontFamily: 'var(--font-ui)',
      fontSize: 'var(--fs-xs)',
      letterSpacing: 'var(--ls-ui)'
    }
  }, "\u2726 AURELION \xB7 \u0423\u043A\u0440\u0430\u0457\u043D\u0441\u044C\u043A\u0430 \u0444\u0435\u043D\u0442\u0435\u0437\u0456 \u0440\u043E\u043B\u044C\u043E\u0432\u0430 \u0433\u0440\u0430 \xB7 \u0441\u0432\u0456\u0442\u043E\u0431\u0443\u0434\u043E\u0432\u0430 RP-\u0441\u043F\u0456\u043B\u044C\u043D\u043E\u0442\u0438");
}
Object.assign(window, {
  img,
  TopNav,
  PageHead,
  Footer,
  NAV
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/aurelion-site/ui.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.Badge = __ds_scope.Badge;

__ds_ns.Tag = __ds_scope.Tag;

__ds_ns.Input = __ds_scope.Input;

__ds_ns.Avatar = __ds_scope.Avatar;

__ds_ns.Card = __ds_scope.Card;

__ds_ns.StatList = __ds_scope.StatList;

})();
