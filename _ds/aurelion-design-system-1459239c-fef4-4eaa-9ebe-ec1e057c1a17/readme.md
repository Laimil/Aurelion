# Aurelion — Design System

A dark-fantasy design system for **Aurelion** (Ауреліон), a Ukrainian fantasy tabletop role-playing game and its worldbuilding portal — a community hub of character profiles, lore, a five-god pantheon, and branching storylines.

This system distills the look and feel of the live Aurelion site into reusable tokens, components, foundation specimens, and a full interactive UI-kit recreation, so new pages, decks, and prototypes stay on-brand.

## Sources

Built by reading the project's own source. Explore these to do an even better job:

- **GitHub — Laimil/Aurelion** · <https://github.com/Laimil/Aurelion>
  The static worldbuilding portal: `index.html` (world hub), `characterlist.html` + `characters/*.html` (profiles), `religion.html` (pantheon), `script_list.html` (storylines), `rules.html`, `contacts.html`, plus `css/*.css`, `*.json` data and `images/` art. All UI copy is Ukrainian.

> The original site is plain HTML/CSS/vanilla-JS with no formal design system, no webfonts (system Georgia + Arial), and Google Analytics. This design system **systematizes and elevates** that vocabulary — it does not invent a new direction.

---

## Content fundamentals

**Language.** Everything is in **Ukrainian**. Keep it that way for in-world copy; never translate lore or section names to English.

**Voice.** Intimate, warm, a little playful, and *in-world*. The community speaks to its players directly: section descriptions read like a host showing you around — e.g. Characters is captioned *«Так-так, вони ваші»* ("Yep — they're yours"), Contacts is *«Те чим воно є»* ("It is what it is").

**Person.** Second-person **«ви»** and collective **«ми»** ("how we live here…", *«Як ми тут живемо…»*) — the spirit is a shared community project, not a corporate product.

**Register.** Lore and biographies are literary serif prose, often long, justified, and emotionally heavy ("У жорстокості його ростили" — *"He was raised in cruelty"*). UI copy is terse sentence fragments. Aliases get guillemets: **«Садист»**.

**Casing.** Sentence case for body and section titles; ALL-CAPS reserved for the **AURELION** wordmark and Cinzel display headings.

**Emoji.** Not used in lore. The live site used decorative Unicode ornaments as section bullets (`༺࿅ིཽ༼⛩️`); this system replaces them with a restrained gold **✦** marker (`.au-ornament`, the overline, and nav). A single 🐉 appears on deity cards as a lore flourish — use sparingly.

---

## Visual foundations

**Mood.** Dark, painterly, mythic. Near-black grounds with luminous gold and ethereal AI-painted portraits.

**Color.**
- **Ground** is the dark canvas: `--ink-700` (`#1a1a1a`) is the canonical page background, scaling from `--ink-900` void to `--ink-400`.
- **Gold** (`--gold-500` `#ffd700`) is the primary accent — divinity, the "main" storyline, primary buttons, the wordmark glow.
- **Azure** (`--azure-500` `#6495ed`, cornflower) is secondary — side storylines, editorial "edit" actions.
- **Glass**: surfaces are white at low alpha (`--glass-10` default card, `--glass-15` on hover), with white hairline borders (`--line`, α .20). This translucent-glass card system is the single most recognizable trait.
- **Pantheon accents**: one lore color per god — `--god-light` (gold), `--god-dark` (indigo), `--god-fate` (bordeaux), `--god-nature` (teal), `--god-magic` (silver). Use for domain tags and deity cards.
- **Semantic**: `--danger-500` `#ff4d4d`, `--success-500`.

**Type.** Three voices:
- **Display — Cinzel** (engraved Roman caps): titles, deity names, the wordmark. Tracked wide (`--ls-display` 0.06em), often all-caps. *(Added webfont — see Caveats.)*
- **Lore — EB Garamond → Georgia**: long-form worldbuilding & bios, line-height 1.7, frequently justified. *(Georgia is the site's original; EB Garamond elevates it. Added webfont.)*
- **UI — system sans** (the site's Arial): nav, buttons, labels, meta.

**Backgrounds.** Full-bleed painterly imagery for heroes, always under a **protection gradient** fading to `--ink` at the bottom so display type stays legible. No flat color heroes, no synthetic purple gradients.

**Imagery.** Painterly / AI-illustrated, atmospheric: deep blacks and navies, gold flecks, halos, ethereal faces. Warm gold for the divine (Леста), cool desaturated teals/blues for the shadowed (Нокта). Cover images zoom subtly (`scale 1.06`) on card hover.

**Corner radii.** Soft and generous: `--radius-sm` 5 (tags), `--radius-md` 8 (images/inputs), `--radius-lg` 10 (default card), `--radius-xl` 15 (feature cards), `--radius-pill` 999 (buttons, search, status pills).

**Cards.** Translucent glass fill, 1px white hairline border, layered warm-dark drop shadow (`--shadow-md`), rounded corners. On hover they either **lift** (`translateY(-5px)` + `--shadow-lg`) or **grow** (`scale(1.05)`), sometimes gaining a gold glow.

**Elevation.** Warm black shadows, never colored: `--shadow-sm/md/lg`. Accent **glows** (`--glow-gold`, `--glow-azure`) are reserved for hover/active emphasis on primary elements.

**Motion.** Calm and consistent: `transition: all 0.3s ease` everywhere. Hover = grow (tiles) or lift (cards); the wordmark carries a static gold text-shadow. No bounces, no infinite loops.

**Hover / press.** Hover brightens glass (`--glass-10` → `--glass-15`), lifts/grows, and may add a glow; nav links shift from `--text-70` to white. Buttons scale up; primary gains a gold halo.

**Transparency & blur.** The fixed top nav is `--bg-bar` (rgba 34,34,34,.92) with `backdrop-filter: blur(10px)`. Glass cards rely on alpha but not blur (kept cheap).

**Layout.** Centered columns: `--container` 1200 for grids, `--container-read` 900 for lore/profiles. A 60px sticky top nav. 4px spacing grid.

---

## Iconography

The live site uses **almost no icon system** — its "icons" are cropped artwork thumbnails (the top menu was a row of `images/*.jpg`). This system keeps that spirit:

- **Primary "icons" are imagery** — section tiles and deity/character cards lead with cover art, not glyphs.
- **Unicode marks** carry the small symbolic load: **✦** as the brand ornament/bullet (overline, nav, wordmark), **←/→** for nav arrows, a single **🐉** on deity cards. No icon font is bundled.
- **One inline SVG**: the magnifier inside the search `Input` (stroke 2, round caps) — matching a light line-icon weight if you ever need more.
- **No emoji in lore.** If a project needs a broader UI icon set, add **Lucide** (CDN, 2px stroke, round) — it matches the search glyph weight — and flag the addition.

Brand art lives in `assets/`: `images/hero-aurelion.jpg` (the gold-halo hero), section images, `deities/*.jpg` (the five gods), `characters/*.jpg` (portraits). There is **no logo file** — the brand mark is the Cinzel **AURELION** wordmark (see `guidelines/brand-wordmark.html`).

---

## Index / manifest

**Root**
- `styles.css` — the single entry point consumers link (`@import`s only).
- `tokens/` — `fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `base.css`.
- `readme.md` — this guide.
- `SKILL.md` — Agent-Skill wrapper.

**Components** (`components/`) — React primitives, namespace `window.AurelionDesignSystem_145923`:
- `buttons/Button` — gold / glass / azure / ghost pill buttons.
- `feedback/Badge` — story status pills · `feedback/Tag` — pantheon-keyed trait chips.
- `forms/Input` — pill search + glass text fields.
- `surfaces/Card` — glass card w/ image header & hover · `surfaces/Avatar` — gilded portrait · `surfaces/StatList` — profile stat rows.

**Guidelines** (`guidelines/`) — foundation specimen cards for the Design System tab (Colors, Type, Spacing, Brand).

**UI kits** (`ui_kits/`)
- `aurelion-site/` — interactive recreation of the worldbuilding portal: world hub, searchable character gallery, character profile, pantheon, storylines. Open `index.html`.

---

## Caveats / substitutions

- **Fonts are substitutions.** The original site shipped **no webfonts** — only system **Georgia** (lore/profiles) and **Arial** (UI). This system adds **Cinzel** (display) and **EB Garamond** (lore) from Google Fonts to elevate the fantasy character. Georgia and system-sans remain as fallbacks. *Swap or confirm these if the game has official faces.*
- **No official logo** exists in the source; the wordmark is type-set in Cinzel.
- Pantheon accent colors and the ✦ ornament are **interpretations** of the site's intent (it used elaborate Unicode glyphs and untinted gold/blue), introduced for systematic consistency.
