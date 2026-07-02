# Engineering Guide — Consuming Aplica Tokens

> N3-level reference. How to consume tokens in CSS/JS, implement dark mode, integrate with headless UI libraries, and understand the build pipeline.

---

## How tokens reach your code

```
config/<brand>.config.mjs
        ↓
theme-engine build
        ↓
dist/css/<brand>-light.css   ← CSS custom properties (light)
dist/css/<brand>-dark.css    ← CSS custom properties (dark)
dist/json/<brand>-light-positive.json  ← typed token tree (JSON)
```

Always consume from `dist/`. Never hardcode values — if `dist/` changes, your components pick up the update automatically.

---

## CSS variable consumption

**Step 1:** Check your actual variable names.

```bash
# Inspect what's available
cat dist/css/<brand>-light.css | grep "semantic"
```

Variable names follow the token path but the exact prefix depends on your workspace config. Do not guess — read the file.

**Step 2:** Reference variables by their exact name.

```css
.button-primary {
  background-color: var(--sem-color-iface-function-primary-normal-bg);
  color: var(--sem-color-iface-function-primary-normal-txt-on);
  border-radius: var(--fdn-radius-action);
  padding: var(--sem-dim-spacing-extra-small) var(--sem-dim-spacing-small);
}

.button-primary:hover {
  background-color: var(--sem-color-iface-function-primary-action-bg);
}

.button-primary:active {
  background-color: var(--sem-color-iface-function-primary-active-bg);
}
```

**Token contract guarantee**: the engine always generates a quartet per state:
- `background` — fill color
- `txtOn` — WCAG-validated text color on that background
- `border` — border color
- `txt` — (if enabled) standalone text color in that role

---

## Dark mode implementation

The engine generates separate CSS files for light and dark. Dark mode is a class swap on the root element.

**Import both CSS files:**
```html
<link rel="stylesheet" href="dist/css/brand-light.css">
<link rel="stylesheet" href="dist/css/brand-dark.css">
```

**Apply the dark class to the root element:**
```javascript
// Toggle dark mode
document.documentElement.classList.toggle('dark');

// Or based on system preference
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (prefersDark) {
  document.documentElement.classList.add('dark');
}
```

**Verify the selector** by checking `dist/css/<brand>-dark.css` — the root selector used there is what you apply. It may be `.dark`, `.theme-dark`, or a specific class name depending on workspace config.

---

## Portal pattern — headless UI (Base UI, Radix, etc.)

Headless UI libraries render popovers, dialogs, and tooltips directly on `document.body`, outside the component tree. If you apply the theme class only to the app root, portaled elements escape the CSS scope and lose their token variables.

**Apply the theme class to `document.body`, not just the app root:**

```javascript
// React + Radix example
useEffect(() => {
  document.body.classList.add('theme-brand');
  return () => document.body.classList.remove('theme-brand');
}, []);
```

```css
/* Or set it unconditionally in your CSS reset */
body {
  /* theme class applied here via JS */
}
```

Dark mode still uses the root element for the dark class. Both classes must coexist:
```html
<body class="theme-brand dark">...</body>
```

---

## Typography and elevation — use generated styles

Typography and elevation (shadow) tokens are generated as **composite styles** — do not decompose them. The engine generates CSS classes or custom property composites. Use those directly:

```css
/* Wrong — decomposing manually */
.heading {
  font-size: var(--fdn-type-size-lg);
  font-weight: 700;
  line-height: 1.2;
}

/* Right — use the generated composite */
.heading {
  /* Apply the generated typography style class for this category */
  /* Check dist/ for the exact class names */
}
```

Check `data/foundation/<brand>/styles/typography_styles.json` for available composite style names after a build.

---

## JSON token tree (typed consumption)

For TypeScript, build tools, or design-to-code pipelines, use the JSON output:

```javascript
import tokens from './dist/json/brand-light-positive.json';

// Navigate the token tree
const primaryBg = tokens.semantic.color.interface.function.primary.normal.background.$value;
```

The JSON structure mirrors the token path anatomy exactly. Use this for:
- Generating typed token references
- Build-time token validation
- Feeding values into CSS-in-JS solutions that accept variables by name

---

## Build pipeline reference

| Change | Command | Notes |
|--------|---------|-------|
| Any config change | `theme-engine build` | Full rebuild — always safe |
| Typography or elevation only | `theme-engine build:foundation` | Faster — skips color pipeline |
| Dimension scale only | `theme-engine dimension:generate` | Dimension tokens only |
| Adding a brand | `theme-engine build` + `theme-engine figma:generate` | Rebuilds + updates Figma scaffold |
| Inspect visually | `theme-engine preview` | Opens token browser |
| Watch mode | `theme-engine preview --serve` | Reloads on dist/ changes |

**Rule**: never edit `data/` or `dist/` directly. All changes go through config + build. Generated files are overwritten on every build.

---

## Token contract guarantees

Before deploying or publishing, snapshot the contract:

```bash
theme-engine contracts:generate
```

This writes `dist/contracts/<brand>-contract.json`. In CI, run:

```bash
theme-engine contracts:diff
```

This diffs the committed contract against the installed package and fails if tokens were removed or renamed (breaking change). Additive changes pass.

---

## Negative surface outputs

Some workspaces generate both `positive` and `negative` surface variants. Do not assume `negative` exists — check `aplica-theme-engine.config.mjs` for `surfacePolarity`. If it is not configured or is set to `'positive'`, only positive outputs exist. Using a negative token path that was never generated will produce undefined CSS variables.
