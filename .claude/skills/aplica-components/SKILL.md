---
name: aplica-components
description: >-
  Build or review UI components using Aplica tokens. Use when the user asks to build,
  style, or implement components in React, HTML, CSS, or headless UI libraries (Base UI, Radix).
  Covers CSS variable patterns, dark mode, portal setup, typography and elevation usage.
---

# Aplica Components — Implementation Guide

## Before writing any code

1. Read `dist/css/<brand>-light.css` to get exact CSS variable names — never guess or invent them.
2. Check `aplica-theme-engine.config.mjs` for `surfacePolarity` — if it's `'positive'`, negative surface tokens do not exist.
3. Identify the archetype that matches the component (see below).

---

## Token contract — what the engine guarantees

For every function/feedback state, the engine generates a **quartet**:

| Role | Token suffix | Use |
|------|-------------|-----|
| `background` | `..normal.background` | Fill color |
| `border` | `..normal.border` | Border color |
| `txtOn` | `..normal.txtOn` | WCAG-validated text on that background |
| `txt` | `..normal.txt` | Standalone text color (if `generation.colorText` enabled) |

Use `txtOn` (not `txt`) for text placed on a colored background. Use `txt` only for colored standalone text with no background.

---

## CSS variable patterns

**Always read from `dist/css/<brand>-light.css` first.** The variable prefix and exact names vary by workspace. The patterns below show the structural convention — verify names before using.

### Button (Interface Function — primary variant)

```css
.btn-primary {
  background: var(--sem-color-iface-fn-primary-normal-bg);
  color: var(--sem-color-iface-fn-primary-normal-txt-on);
  border: 1px solid var(--sem-color-iface-fn-primary-normal-border);
  border-radius: var(--fdn-radius-action);
  padding: var(--sem-dim-spacing-extra-small) var(--sem-dim-spacing-small);
}

.btn-primary:hover,
.btn-primary:focus-visible {
  background: var(--sem-color-iface-fn-primary-action-bg);
  border-color: var(--sem-color-iface-fn-primary-action-border);
}

.btn-primary:active {
  background: var(--sem-color-iface-fn-primary-active-bg);
  border-color: var(--sem-color-iface-fn-primary-active-border);
}

.btn-primary:disabled {
  opacity: var(--sem-opacity-disabled);
  pointer-events: none;
}
```

### Ghost button variant

```css
.btn-ghost {
  background: transparent;
  color: var(--sem-color-iface-fn-primary-normal-ghost-txt);
  border: 1px solid var(--sem-color-iface-fn-primary-normal-ghost-border);
}

.btn-ghost:hover {
  background: var(--sem-color-iface-fn-primary-action-ghost-bg);
}
```

Note: ghost text color is controlled by `ghostNormalTxtOnStrategy` in brand config — `'txt'` = body color, `'surface'` = page background. Check the config if ghost text looks unexpected.

### Feedback badge / alert

```css
.alert-success {
  background: var(--sem-color-iface-feedback-success-default-bg);
  color: var(--sem-color-iface-feedback-success-default-txt-on);
  border: 1px solid var(--sem-color-iface-feedback-success-default-border);
}

.alert-success-subtle {
  background: var(--sem-color-iface-feedback-success-secondary-bg);
  color: var(--sem-color-iface-feedback-success-secondary-txt-on);
}
```

### Card / surface

```css
.card {
  background: var(--sem-color-ambient-surface-bg);
  border: 1px solid var(--sem-color-ambient-border-default);
  border-radius: var(--fdn-radius-surface);
  padding: var(--sem-dim-spacing-medium);
}
```

### Input / form field

```css
.input {
  background: var(--sem-color-ambient-input-bg);
  border: 1px solid var(--sem-color-ambient-input-border-default);
  color: var(--sem-color-ambient-txt-primary);
  border-radius: var(--fdn-radius-input);
  padding: var(--sem-dim-spacing-extra-small) var(--sem-dim-spacing-small);
}

.input:hover {
  border-color: var(--sem-color-ambient-input-border-action);
}

.input:focus {
  border-color: var(--sem-color-iface-fn-primary-normal-border);
  outline: 2px solid var(--sem-color-iface-fn-primary-normal-border);
  outline-offset: 2px;
}

.input--error {
  border-color: var(--sem-color-iface-feedback-danger-default-border);
}
```

---

## Dark mode

Dark mode is a **CSS class swap** on the root element. The engine generates separate CSS files; the dark file scopes variables under a dark class selector.

**Load both files:**
```html
<link rel="stylesheet" href="dist/css/brand-light.css">
<link rel="stylesheet" href="dist/css/brand-dark.css">
```

**Apply dark class to root:**
```javascript
// Toggle
document.documentElement.classList.toggle('dark');

// Follow system preference
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
if (mediaQuery.matches) document.documentElement.classList.add('dark');
mediaQuery.addEventListener('change', e => {
  document.documentElement.classList.toggle('dark', e.matches);
});
```

Check `dist/css/<brand>-dark.css` to confirm the exact root selector used (e.g., `.dark`, `.theme-dark`). Apply that exact class.

**React with state:**
```jsx
function App() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  return (
    <div>
      <button onClick={() => setDark(d => !d)}>Toggle</button>
      {/* rest of app */}
    </div>
  );
}
```

---

## Portal pattern — headless UI libraries (Base UI, Radix, Floating UI)

Portaled elements (tooltips, dropdowns, dialogs, popovers) render directly on `document.body` — outside your app's root element. If you apply the theme class only to the app root, portaled elements escape the CSS scope and CSS variables resolve to `initial`.

**Apply the theme class to `document.body`:**

```javascript
// On mount, apply theme class to body (not just app root)
document.body.classList.add('theme-brand');
```

**React + Radix example:**
```jsx
import { useEffect } from 'react';

function ThemeProvider({ children, brand = 'brand', dark = false }) {
  useEffect(() => {
    // Theme class on body — ensures portals inherit tokens
    document.body.className = `theme-${brand}${dark ? ' dark' : ''}`;
  }, [brand, dark]);

  return <>{children}</>;
}
```

**With next-themes or similar:**
```javascript
// next-themes config
export default {
  attribute: 'class',
  // Apply to body so portals work
  // Wrap your _app.tsx with ThemeProvider from above
}
```

---

## Typography styles

Typography tokens are **composite styles** (font-family + size + weight + line-height as a single token). Use the generated composite — do not decompose and reassemble manually.

```css
/* Right — use generated composite */
.heading-1 {
  /* Apply the generated typography class or CSS variable composite */
  /* Check dist/ for exact generated class names after build */
}

/* Wrong — manual decomposition creates drift from the token system */
.heading-1 {
  font-size: 32px;   /* ← hardcoded, bypasses token system */
  font-weight: 700;  /* ← hardcoded */
  line-height: 1.2;  /* ← hardcoded */
}
```

Check `data/foundation/<brand>/styles/typography_styles.json` for the available composite style names. These become CSS classes or custom property composites in `dist/` after a build.

---

## Elevation / shadow styles

Same rule as typography — use the generated composite shadow tokens, not manually composed `box-shadow` values.

```css
/* Right */
.card {
  box-shadow: var(--fdn-elevation-raised);  /* generated elevation token */
}

/* Wrong */
.card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);  /* ← never hardcode shadows */
}
```

Check `data/foundation/<brand>/styles/elevation_styles.json` for available elevation levels after a build.

---

## Archetype checklist

Before implementing, identify the closest validated archetype:

| Archetype | Token territory | Key rules |
|-----------|----------------|-----------|
| **Button** | `iface.function.primary/secondary/neutral/danger` | All 3 interaction states required; ghost variant uses `ghost.*` paths |
| **Input / Select** | `ambient.input.*` | Hover + focus + error states; error uses `feedback.danger.*` |
| **Dialog / Modal** | `ambient.surface.*` + elevation | Requires portal pattern if using headless library |
| **Badge** | `iface.feedback.*` | `default` = filled; `secondary` = subtle |
| **Card** | `ambient.surface.*` | Surface bg + default border; elevated variant adds shadow token |
| **Tabs** | `iface.function.*` + `ambient.*` | Active tab uses function tokens; inactive uses ambient |
| **Tooltip** | `ambient.inverted.*` or `ambient.surface.*` | Requires portal pattern; check if inverted surface exists |

---

## Hard rules

- Never hardcode `px`, `hex`, `rgba()`, raw `box-shadow`, or explicit border radii.
- Never invent CSS variable names — derive from `dist/css/<brand>-light.css` only.
- Never assume `negative` surface outputs exist — check `surfacePolarity` config.
- Never treat `data/$themes.json`, `_brand.json`, or Figma artifacts as component APIs.
- Do not decompose typography or elevation composite styles manually.

---

## Per-component usage guide

When implementing a specific component, read the relevant section from `docs/context/components-guide.md`. That file has per-component use cases, variants, do's/don'ts, and token mapping for:

- Button, Dialog, Input, Select, Badge, Card, Tabs (and more as they are added)

**Load only the section for the component you are building** — the full file does not need to be in context at once.

---

## Deep reference

- `docs/context/components-guide.md` — per-component usage: use cases, variants, do's/don'ts, token mapping
- `docs/context/engineering-guide.md` — build pipeline, dark mode patterns, portal setup, JSON token tree
- `docs/context/theme-engine-playbook.md` → "Workspace outputs" — exact paths for all `dist/` files
- `dist/css/<brand>-light.css` — exact variable names for this workspace (read before writing any component)
- `data/foundation/<brand>/styles/` — typography and elevation composite style names