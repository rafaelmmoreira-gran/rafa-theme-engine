# AI Playbook — Aplica Theme Engine

This file is the single entry point for AI agents working in an Aplica Theme Engine workspace. It does not replace the source config or dist outputs — treat those as the source of truth for exact values.

---

## Agent rules

1. **Read before asserting.** For any token name, CLI flag, or config key — read the relevant file from the matrix below before stating it. Do not invent paths or values.
2. **Never edit generated files.** Files in `data/` and `dist/` are generated outputs. All changes go through config + `theme-engine build`.
3. **Never hardcode token-owned values.** No `px`, `hex`, `rgba()`, raw shadows, or ad hoc radii in components — always use CSS variables from `dist/css/`.
4. **Inspect the real outputs.** Read `dist/json/<brand>-light-positive.json` before naming any CSS variable. Prefix and structure vary by workspace.
5. **Response format:** direct answer + file path used (relative to workspace root). Quote only for canonical rules.

---

## Architecture at a glance

| Layer | What it controls | How to change |
|-------|-----------------|---------------|
| **Brand** | OKLCH colors, typography, interaction contract | Edit `config/<brand>.config.mjs` |
| **Mode** | Light / dark derivation via OKLCH | Generated — never edit |
| **Surface** | positive / negative / inverted variants | Generated — never edit |
| **Semantic** | Named roles: `branding.*`, `ambient.*`, `interface.*`, `product.*` | Generated — never edit |
| **Foundation** | Component-ready CSS variables and composite styles | `dist/` after build |
| **Dimension** | Spacing, font sizes, border radii — orthogonal to the color pipeline | Edit `config/global/dimension.config.mjs` |

**Core principle:** Edit config → `theme-engine build` → consume from `dist/`. The pipeline is one-directional.

---

## Audiences and journeys

| Journey | Who | Slash command |
|---------|-----|---------------|
| Just installed — what do I do? | Any | `/getting-started` |
| I want a specific visual result | System designer | `/configure-visual` |
| How do I use this in my app? | Engineer | `/engineering-integration` |
| Something looks wrong | Any | `/debug` |
| Explain the logic behind `<concept>` | Any | `/explain-semantic <topic>` |
| Build a component with these tokens | Engineer | `/build-component` |

---

## Config key reference

| Key | What it does | Location |
|-----|-------------|----------|
| `modeResolution` | Controls how dark-mode chroma and lightness are derived from the light palette | `config/<brand>.config.mjs` → `options.modeResolution` |
| `darkModeChroma` | Saturation multiplier for the dark palette (0–1; higher = more saturated) | `config/<brand>.config.mjs` → `options.darkModeChroma` |
| `dilution` | How desaturated interaction states (hover, active, focus) are derived — method, target anchor, canvas awareness | `config/<brand>.config.mjs` → `interaction.dilution` |
| `txtOnStrategy` | WCAG-normalized text color on colored surfaces (`'auto'` or explicit level) | `config/<brand>.config.mjs` → `options.txtOnStrategy` |
| `ghostNormalTxtOnStrategy` | Text color for ghost-variant normal state: `'txt'` = body color, `'surface'` = page background | `config/<brand>.config.mjs` → `options.ghostNormalTxtOnStrategy` |
| `baseAdaptation` | Quadrant-aware adaptation for base surfaces (interaction normal, product default) | `config/<brand>.config.mjs` → `options.baseAdaptation` |
| `overrides.interaction` | Direct overrides for specific interaction states (per function/feedback state, item, preset) | `config/<brand>.config.mjs` → `overrides.interaction` |
| `overrides.grayscale` | Override the neutral/grayscale scale | `config/<brand>.config.mjs` → `overrides.grayscale` |
| `surfacePolarity` | Positive-only generation — disables negative surface outputs | `aplica-theme-engine.config.mjs` → `global.surfacePolarity` |
| `generation.colorText` | Enable `txt` token generation and control exposure per group (`feedback`, `interfaceFunction`, `product`) | `aplica-theme-engine.config.mjs` → `generation.colorText` |
| `interfaceFunctionPaletteLevels` | Number of palette levels for interface function states | `config/<brand>.config.mjs` → `options.interfaceFunctionPaletteLevels` |
| `structure.borderWidth` | Expose border width scale as CSS variables (`none` → `extraLarge`) — tokens already exist in `semantic.border.width.*`, pure config addition | `config/foundations/<brand>.config.mjs` → `structure.borderWidth.items` |
| `structure.borderRadius` | Expose border radius scale as CSS variables (`straight` → `circular`) — tokens already exist in `semantic.border.radii.*`, pure config addition | `config/foundations/<brand>.config.mjs` → `structure.borderRadius.items` |

**Exposing `borderWidth` / `borderRadius` in the foundation (config only, no engine changes):**
```js
// config/foundations/<brand>.config.mjs → structure:
borderWidth: {
  items: ['none', 'small', 'medium', 'large', 'extraLarge']
},
borderRadius: {
  items: ['straight', 'micro', 'extraSmall', 'small', 'medium', 'large', 'extraLarge', 'mega', 'circular']
}
```
Run `theme-engine build` after adding. CSS variables appear in `dist/css/foundation/engine/foundation.css` as `--foundation-borderWidth-*` and `--foundation-borderRadius-*`.

**Generic alias sections — expose any semantic token as a foundation alias (config only):**

For tokens not covered by a dedicated key, use `{ semanticPath, type, items }`:
```js
// config/foundations/<brand>.config.mjs → structure:
fontFamilies: {
  semanticPath: 'semantic.typography.fontFamilies',
  type: 'fontFamilies',
  items: ['main', 'content', 'display', 'code']
}
// → --foundation-fontFamilies-main: var(--semantic-typography-fontFamilies-main)
```
- `semanticPath` — base path in `data/semantic/default.json`; item name is appended
- `type` — token type (`fontFamilies`, `dimension`, `lineHeights`, `fontWeights`, `letterSpacing`, etc.)
- `items` — array of item names to expose
- Prerequisite: path must exist in `data/semantic/default.json`
- `borderWidth`, `borderRadius`, `sizing`, `spacing`, `opacity` have dedicated generators — do **not** need `semanticPath`

---

## CLI commands

| Command | What it does | When to run |
|---------|-------------|-------------|
| `theme-engine build` | Full pipeline: themes + foundation + figma | After any config change |
| `theme-engine build:foundation` | Foundation layer only | After typography or elevation changes only |
| `theme-engine dimension:generate` | Dimension tokens (spacing, sizes) | After `dimension.config.mjs` changes |
| `theme-engine figma:generate` | Figma / Tokens Studio scaffolding | After adding brands or changing brand structure |
| `theme-engine preview` | Open visual token browser | To inspect generated colors, typography, elevation |
| `theme-engine preview --serve` | Watch mode preview | During active config tuning |
| `theme-engine design:md` | Regenerate `DESIGN.md` with resolved brand values | After brand color changes |
| `theme-engine ai:guidance` | Compile `dist/AI_GUIDANCE.md` from configured sources | After major doc updates or initial setup |
| `theme-engine ai:init` | Install AI skills, commands, and CLAUDE.md | On first install or after package upgrade |
| `theme-engine contracts:generate` | Snapshot token contract to `dist/contracts/` | Before publishing / deploying |
| `theme-engine contracts:diff` | Diff committed contract vs installed package | In CI to catch breaking token changes |
| `theme-engine validate:data` | Validate `data/` against output schemas | After generation to verify structure |
| `theme-engine init` | Interactive workspace setup wizard | Starting a new consumer workspace |
| `theme-engine schemas:helper` | Scaffold a consumer-owned `architecture.mjs` | When customizing token architecture |

---

## Workspace outputs

After `theme-engine build`, these paths exist in the consumer workspace:

| Path | What it contains |
|------|-----------------|
| `dist/css/<brand>-light.css` | CSS custom properties for light mode |
| `dist/css/<brand>-dark.css` | CSS custom properties for dark mode |
| `dist/json/<brand>-light-positive.json` | JSON token tree — light, positive surface |
| `dist/json/<brand>-dark-positive.json` | JSON token tree — dark, positive surface |
| `dist/json/<brand>-light-negative.json` | JSON token tree — light, negative surface (if enabled) |
| `dist/preview/index.html` | Visual browser preview of all semantic tokens |
| `dist/AI_GUIDANCE.md` | Compiled AI context bundle (generated by `ai:guidance`) |
| `dist/contracts/<brand>-contract.json` | Token contract snapshot for deploy safety |
| `data/semantic/default.json` | Semantic token structure — source for all semantic paths |
| `data/foundation/<brand>/default.json` | Foundation token aliases |
| `data/foundation/<brand>/styles/typography_styles.json` | Typography composite styles |
| `data/foundation/<brand>/styles/elevation_styles.json` | Elevation / shadow composite styles |
| `data/brand/<brand>/` | Raw brand artifacts (`_brand.json`, split chunks) |
| `data/$themes.json` | Tokens Studio theme file for Figma sync |

---

## Topic → file matrix

Use this to find the right file before answering a question.

| Topic | Read this file |
|-------|---------------|
| Active brands and theme structure | `themes.config.json` (workspace root) |
| Workspace-level settings (output format, dimension mode) | `aplica-theme-engine.config.mjs` (workspace root) |
| Brand colors, dilution, interaction contract | `config/<brand>.config.mjs` |
| Foundation structure (spacing, sizing, borderWidth, borderRadius, generic aliases) | `config/foundations/<brand>.config.mjs` |
| Exact generated token names and values | `dist/json/<brand>-light-positive.json` |
| Semantic token structure (all groups and paths) | `data/semantic/default.json` |
| Typography composite styles | `data/foundation/<brand>/styles/typography_styles.json` |
| CSS variable names and format | `dist/css/<brand>-light.css` |
| AI context for this workspace | `dist/AI_GUIDANCE.md` |
| Component token patterns and archetypes | `docs/context/aplica-ui-integration.md` |
| Deep architecture reference | `docs.aplica.me` |

---

## Common diagnostics

**Hover color too similar to default**
Check `interaction.dilution` in the brand config. The `target` anchor may be too close to the base surface. Increase separation by adjusting `dilution.target` lightness or switching to `'anchor'` mode with explicit `anchor.source`.

**Dark mode colors feel washed out**
Increase `options.darkModeChroma` toward `1.0` in the brand config. Values below `0.6` strongly desaturate the dark palette.

**Text is unreadable on a colored surface**
Check `options.txtOnStrategy`. Also confirm `generation.colorText.generateTxt: true` and that the relevant group (`feedback`, `interfaceFunction`, or `product`) is enabled under `textExposure`.

**Ghost elements have unexpected text color**
Read `options.ghostNormalTxtOnStrategy`. `'txt'` = body/ambient text color. `'surface'` = page background color. Swap between them based on the intended visual.

**Brand colors not updating after config change**
Run `theme-engine build` (full rebuild). If you edited files inside `data/` or `dist/` directly, those changes will be overwritten — always edit config instead.

**Figma out of sync with generated tokens**
Run `theme-engine figma:generate` to regenerate `data/$themes.json` and `data/$metadata.json`, then re-sync in Tokens Studio.
