---
name: theme-engine
description: >-
  Aplica Theme Engine expert. Use when the user asks about token concepts, color vocabulary,
  dimension system, config keys, brand setup, dark mode, architecture, CLI workflows,
  or troubleshooting. Covers N1 (designer), N2 (system designer), and N3 concept questions.
---

# Aplica Theme Engine — Expert Guide

## Level detection

Identify the user's level from their vocabulary before answering:

- **N1 — Product Designer**: asks "what is a token", "how do colors work", "what's dark mode", "brand color", "spacing", uses Figma terms → explain concepts with analogies, no code, no config syntax
- **N2 — System Designer**: asks about "modeResolution", "dilution", "OKLCH", "config file", "pipeline", "build", "semantic group" → explain architecture and all config keys with implications
- **N3 — Design Engineer**: asks about "CSS variable", "dist/", "React", "component code", "dark mode implementation", "portal" → for implementation: route to `aplica-components` skill; use this skill for concept + config questions

Match depth to level. Never explain token anatomy to an N3 asking about CSS variables. Never throw config keys at an N1 asking what dark mode is.

---

## N1 — Token Concepts

### What is a design token?

A token is a **named design decision** — not a raw value. Instead of `#1A73E8`, you name the intent: `interface.function.primary.normal.background`. Every place using that name updates automatically when the brand changes.

**Why this matters:**
- Multi-brand: same token name, different value per brand — no component changes needed
- Dark mode: automatic — the engine generates the dark value, the token name stays the same
- Accessibility: `txtOn` tokens carry WCAG-validated contrast ratios baked in

**Token path anatomy:**
```
semantic . color . interface . function . primary . normal . background
  │          │        │          │          │        │         │
 layer     domain  category  subcategory  variant  state     role
```

### Color — 4 categories

**Brand** — Identity. Not interactive, not status. Use for brand moments (hero backgrounds, brand illustrations).
- 5 levels: `first`, `second`, `third`, `fourth`, `fifth`

**Interface Function** — All interactive elements: buttons, links, toggles, selects.
- States: `normal` → `action` (hover) → `active` (pressed)
- Each state has `background`, `border`, `txtOn` (text on that background), and optionally `txt`
- Primary, secondary, neutral, danger variants

**Interface Feedback** — System status communication. Never for interactive elements.
- Categories: `info`, `success`, `warning`, `danger`
- Variants: `default` (filled, high-visibility) and `secondary` (subtle/tinted)

**Foundation** — Layout helpers, ambient surfaces, neutral text, structural borders.
- Not semantic identity — these are structural tokens
- Examples: page background (`ambient.page.background`), default text, dividers

**Decision tree:**
```
Needs hover/active states?          → Interface Function
Shows a system status message?      → Interface Feedback
Expresses brand identity?           → Brand (branding.*)
Is a layout or structural element?  → Foundation (ambient.*)
```

### Dimension system

Built on a 4pt grid. Everything is derived from these named steps:

| Token      | Value | Common use |
|------------|-------|------------|
| `nano`     | 4px   | Icon padding, hairlines |
| `micro`    | 8px   | Tight internal gaps |
| `extraSmall`| 16px | Standard component padding |
| `small`    | 24px  | Between related groups |
| `medium`   | 32px  | Card padding, section gaps |
| `large`    | 40px  | Generous section breathing room |
| `extraLarge`| 48px | Page margins |
| `mega`     | 56px  | Large layout gaps |
| `giga`     | 88px  | Section separators |
| `tera`     | 144px | Hero spacing |

**Density** — same token name, different resolved values:
- `minor` (compact): for data-dense UIs — values are smaller
- `normal` (default): balanced, works everywhere
- `major` (spacious): for marketing, reading experiences — values are larger

Density is a workspace setting — it is not set per component.

### Typography — 5 categories

| Category | Purpose | Examples |
|----------|---------|---------|
| `Heading` | Page and section titles | H1–H4 |
| `Display` | Hero-scale decorative text | Large hero labels |
| `Content` | Body reading | Body, Caption, Overline |
| `Action` | Interactive labels | Button label, Tab label, Link |
| `Code` | Monospace | Code blocks, Kbd |

Typography tokens are **composite styles** — font, size, weight, line-height together. Use the composite token; never decompose it manually.

---

## N2 — Architecture + Configuration

### 5-layer token pipeline

| Layer | What it controls | How to change |
|-------|-----------------|---------------|
| **Brand** | OKLCH source colors, typography base, interaction contract | Edit `config/<brand>.config.mjs` |
| **Mode** | Light/dark derivation via OKLCH math | Generated — never edit |
| **Surface** | Positive/negative/inverted variants | Generated — never edit |
| **Semantic** | Named roles: branding.*, ambient.*, interface.*, product.* | Generated — never edit |
| **Foundation** | Component-ready CSS variables, composite styles | `dist/` after build |
| **Dimension** | Spacing, font sizes, border radii — orthogonal to color pipeline | Edit `config/global/dimension.config.mjs` |

**Core principle:** Edit config → `theme-engine build` → consume from `dist/`. One-directional. Never edit `data/` or `dist/` directly — they are overwritten on every build.

### Config key reference — full

#### `modeResolution`
**What it does:** Controls the algorithm used to derive dark-mode colors from the light palette.
**Location:** `config/<brand>.config.mjs` → `options.modeResolution` (also settable in `themes.config.json` per brand)
**Values and implications:**
- `'lightness'` — mirrors lightness inversion across the OKLCH scale. Fast, predictable.
- `'chroma'` — adjusts chroma separately. More vibrant dark palettes.
- Custom: pass a resolution object with explicit `lightness` and `chroma` curves.
**When to change:** If your dark palette feels too washed out or too harsh — start here before touching `darkModeChroma`.

#### `darkModeChroma`
**What it does:** Saturation multiplier applied to the entire dark palette. Range: 0–1.
**Location:** `config/<brand>.config.mjs` → `options.darkModeChroma`
**Implication:** `0.6` = 60% of light-mode saturation in dark mode. Below `0.5` produces very muted/grayscale dark palettes. `1.0` = same saturation as light.
**Diagnostic:** Dark mode colors feel washed out → increase toward `1.0`. Colors are too aggressive in dark → decrease.

#### `dilution`
**What it does:** Controls how interaction states (hover, active) are visually derived — how desaturated and how different they are from the normal state.
**Location:** `config/<brand>.config.mjs` → `interaction.dilution`
**Sub-keys:**
- `method`: `'anchor'` = derive from an explicit anchor color; `'linear'` = linear step from normal
- `target`: lightness and chroma targets for the action (hover) state
- `anchor.source`: the reference color used when `method: 'anchor'`
- `canvasAware`: whether the dilution calculation accounts for the surface the element sits on
**Diagnostic:** Hover looks too similar to normal → adjust `target` lightness separation. Active state too harsh → lower `target.chroma`.

#### `txtOnStrategy`
**What it does:** Determines how text color is selected for elements placed on colored surfaces (function, feedback, product backgrounds).
**Location:** `config/<brand>.config.mjs` → `options.txtOnStrategy`
**Values:**
- `'auto'` — engine picks white or black based on WCAG contrast ratio
- `'AA'`, `'AAA'` — enforce specific WCAG compliance level
**Diagnostic:** Text is unreadable on a colored button → check this key, then also verify `generation.colorText.generateTxt: true`.

#### `ghostNormalTxtOnStrategy`
**What it does:** Text color for the `normal` (non-hover) state of ghost-variant elements.
**Location:** `config/<brand>.config.mjs` → `options.ghostNormalTxtOnStrategy`
**Values:**
- `'txt'` — uses the body/ambient text color (looks like a plain text link)
- `'surface'` — uses the page background color (invisible on default surface, only works on colored backgrounds)
**When to change:** Ghost button text looks wrong in either light or dark mode. Toggle between `'txt'` and `'surface'` based on intended visual.

#### `baseAdaptation`
**What it does:** Quadrant-aware adaptation for base surfaces — how the `normal` background adapts when the component sits on different quadrant surfaces (light/dark, positive/negative).
**Location:** `config/<brand>.config.mjs` → `options.baseAdaptation`
**Implication:** Affects how product/default states look on non-page surfaces (e.g., card inside a tinted panel). Without this, elements may not visually pop from their container.

#### `overrides.interaction`
**What it does:** Direct color overrides for specific interaction states — bypasses the derived calculation entirely.
**Location:** `config/<brand>.config.mjs` → `overrides.interaction`
**Structure:** Per function/feedback state, item, and preset. Accepts explicit OKLCH or hex values.
**When to use:** When the derived hover/active colors don't meet brand requirements and dilution tuning isn't enough. Use sparingly — overrides are not responsive to OKLCH derivation.

#### `overrides.grayscale`
**What it does:** Override the entire neutral/grayscale scale used for borders, text, and ambient surfaces.
**Location:** `config/<brand>.config.mjs` → `overrides.grayscale`
**When to use:** Brand uses a warm or cool neutral that the auto-derived scale doesn't match well.

#### `surfacePolarity`
**What it does:** Limits surface output to positive-only, disabling negative surface generation.
**Location:** `aplica-theme-engine.config.mjs` → `global.surfacePolarity`
**Values:** `'positive'` (only positive outputs) or omit for both positive + negative.
**Important:** If set to `'positive'`, never reference negative token paths in components — the CSS variables won't exist.

#### `generation.colorText`
**What it does:** Controls whether `txt` tokens are generated (standalone text color on colored backgrounds, separate from `txtOn`).
**Location:** `aplica-theme-engine.config.mjs` → `generation.colorText`
**Sub-keys:**
- `generateTxt: true/false` — master switch
- `textExposure`: per-group exposure — `feedback`, `interfaceFunction`, `product` — each can be enabled independently
**When to use:** Enable when you need text-only colored elements (e.g., a colored label without a background). Disabled by default — generates additional tokens.

#### `interfaceFunctionPaletteLevels`
**What it does:** Number of palette levels generated for interface function states. Higher = more granular interaction steps.
**Location:** `config/<brand>.config.mjs` → `options.interfaceFunctionPaletteLevels`
**Default:** Usually 3–5 levels. Increase if you need more nuanced state differentiation.

### Foundation structure config (`config/foundations/<brand>.config.mjs`)

The foundation config exposes semantic tokens as component-ready CSS variables. Its `structure` object controls which token groups are included. **This is pure configuration — no engine changes needed.**

The following groups are available:

| Key | What it exposes | Token path in semantic |
|-----|----------------|------------------------|
| `bg` | Background colors by role | `semantic.color.*` |
| `border` | Border colors by role | `semantic.color.*` |
| `txt` | Text colors by role | `semantic.color.*` |
| `opacity` | Opacity scale items | `semantic.opacity.*` |
| `spacing` | Layout spacing scale | `semantic.dimension.spacing.*` |
| `sizing` | Component sizing scale | `semantic.dimension.sizing.*` |
| `borderWidth` | Border width scale | `semantic.border.width.*` |
| `borderRadius` | Border radius scale | `semantic.border.radii.*` |
| `typography` | Composite type styles | `data/foundation/<brand>/styles/typography_styles.json` |
| `gradient` | Gradient definitions | `semantic.color.gradient.*` |

**`borderWidth` and `borderRadius` are commonly overlooked** — they exist in the semantic layer but are not added to the foundation config by default. To expose them:

```js
// config/foundations/<brand>.config.mjs → structure:
borderWidth: {
  items: ['none', 'small', 'medium', 'large', 'extraLarge']
},
borderRadius: {
  items: ['straight', 'micro', 'extraSmall', 'small', 'medium', 'large', 'extraLarge', 'mega', 'circular']
}
```

After adding these and running `theme-engine build`, CSS variables are available in `dist/css/foundation/engine/foundation.css` as `--foundation-borderWidth-*` and `--foundation-borderRadius-*`.

**Diagnostic:** "Can I use border radius tokens in my components?" → Yes. Add `borderRadius` to `structure` in the foundation config. If the section is absent, the tokens exist in the semantic layer but are not exposed to `dist/`.

#### Generic alias sections — any token, pure config

For any token that exists in the semantic layer but has no dedicated key above, declare a **generic alias section** with three fields:

| Field | What it does |
|---|---|
| `semanticPath` | Base path in the semantic layer — item name is appended: `semanticPath.item` |
| `type` | Token Studio / Style Dictionary type (`fontFamilies`, `dimension`, `lineHeights`, etc.) |
| `items` | Array of item names to expose |

**Example:**
```js
// config/foundations/<brand>.config.mjs → structure:
fontFamilies: {
  semanticPath: 'semantic.typography.fontFamilies',
  type: 'fontFamilies',
  items: ['main', 'content', 'display', 'code']
}
// → --foundation-fontFamilies-main: var(--semantic-typography-fontFamilies-main)
```

**Common types and their semantic paths:**

| What to expose | `type` | Likely `semanticPath` |
|---|---|---|
| Font families | `fontFamilies` | `semantic.typography.fontFamilies` |
| Font sizes | `fontSizes` | `semantic.dimension.fontSizes` |
| Line heights | `lineHeights` | `semantic.typography.lineHeights` |
| Font weights | `fontWeights` | `semantic.typography.fontWeights` |
| Letter spacing | `letterSpacing` | `semantic.typography.letterSpacing` |
| Any custom dimension | `dimension` | workspace-specific path |

**Prerequisite:** the path declared in `semanticPath` must exist in `data/semantic/default.json`. The mechanism creates aliases — it does not invent values.

**Note:** `borderWidth`, `borderRadius`, `sizing`, `spacing`, and `opacity` have dedicated generators and do **not** need `semanticPath` — they work with `items` only.

### Workspace-level config (`aplica-theme-engine.config.mjs`)

Controls output format, dimension mode, and global generation settings:
- `global.surfacePolarity` — see above
- `generation.colorText` — see above
- Dimension mode — which dimension scale is active
- Output format — affects CSS variable naming conventions

Always read this file when diagnosing unexpected output or missing token paths.

---

## N3 — Engineering questions

For implementation questions — CSS variable consumption, dark mode switching, portal pattern, component code — use the **`aplica-components`** skill. That skill has real code patterns and the implementation guide.

This skill answers concept and config questions for N3 users too:
- "What does `modeResolution` actually do?" → answered here
- "How do I implement dark mode toggle?" → `aplica-components` skill + `docs/context/engineering-guide.md`

---

## Diagnostics

**Hover color too similar to normal**
→ Check `interaction.dilution.target` lightness in the brand config. Increase the separation between normal and action states. If `method: 'linear'`, consider switching to `'anchor'` with an explicit anchor source.

**Dark mode colors feel washed out or grayscale**
→ Increase `options.darkModeChroma` toward `1.0`. Also check `modeResolution` — the `'chroma'` strategy tends to produce more vibrant dark palettes than `'lightness'`.

**Text unreadable on a colored surface (button, feedback banner)**
→ Check `options.txtOnStrategy`. Also verify `generation.colorText.generateTxt: true` and that the relevant group (`feedback`, `interfaceFunction`, `product`) is enabled under `textExposure`. Rebuild after any change.

**Ghost element has unexpected text color**
→ Read `options.ghostNormalTxtOnStrategy`. `'txt'` = ambient body text color. `'surface'` = page background. Swap based on intended visual outcome.

**Brand colors not updating after config change**
→ Run `theme-engine build` (full rebuild). If you edited `data/` or `dist/` directly — those changes are overwritten by build. Always edit config, never generated files.

**Dark palette looks fine but a specific interaction state is wrong**
→ Check `overrides.interaction` in the brand config. A hardcoded override may be in place that bypasses OKLCH derivation. Remove or update the override.

**Figma out of sync with generated tokens**
→ Run `theme-engine figma:generate` to regenerate `data/$themes.json`, then re-sync in Tokens Studio.

---

## CLI quick reference

| Command | When to run |
|---------|-------------|
| `theme-engine build` | After any config change (always safe, always correct) |
| `theme-engine build:foundation` | Typography or elevation changes only |
| `theme-engine dimension:generate` | After `dimension.config.mjs` changes |
| `theme-engine preview` | Visual inspection of all semantic tokens |
| `theme-engine preview --serve` | Watch mode during active tuning |
| `theme-engine design:md` | Regenerate DESIGN.md with resolved brand values |
| `theme-engine ai:guidance` | Rebuild `dist/AI_GUIDANCE.md` after major doc updates |
| `theme-engine contracts:generate` | Snapshot contract before publishing |
| `theme-engine contracts:diff` | CI check for breaking token changes |
| `theme-engine figma:generate` | After adding brands or changing brand structure |

---

## When to suggest slash commands

- User just installed and doesn't know where to start → `/getting-started`
- User describes a specific visual outcome and needs to find the right config key → `/configure-visual`
- User is integrating tokens into an app or component library → `/engineering-integration`
- User describes something that looks wrong → `/debug`
- User wants a deep conceptual explanation of a semantic group → `/explain-semantic <topic>`
- User wants to build a component with the correct tokens → `/build-component`

---

## Deep reference

- `docs/context/theme-engine-playbook.md` — config reference, architecture, CLI, workspace outputs
- `docs/context/token-concepts.md` — full N1 token concept reference
- `docs/context/engineering-guide.md` — N3 implementation patterns
- `dist/AI_GUIDANCE.md` — workspace-specific context (generated by `theme-engine ai:guidance`)