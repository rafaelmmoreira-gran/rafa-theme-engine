# Token Concepts — Aplica Design System

> N1-level reference. Explains what tokens are, how color is organized, and how the dimension system works.
> Written for Product Designers. No code required to use this knowledge.

---

## What is a design token?

A token is a **named design decision** — not a raw value.

Instead of writing `#1A73E8` directly in a design file or code, you name the intent:

```
semantic.color.interface.function.primary.normal.background → #1A73E8
```

This means:
- Every place in the product using that color updates automatically when the brand changes
- The same token name works in light mode and dark mode (the engine generates both from one config)
- Multi-brand: the same token resolves to different colors per brand — components don't change, only the values do

### Token anatomy

```
semantic . color . interface . function . primary . normal . background
  │          │         │           │          │        │         │
  layer    domain   category    subcategory  variant  state   role
```

- **layer**: `semantic` = named intent (what you use); `foundation` = component-ready aliases
- **domain**: `color` or `dimension`
- **category**: `interface` (UI), `branding` (brand expression), `ambient` (neutral/page)
- **state**: `normal`, `action` (hover), `active` (pressed)
- **role**: `background`, `border`, `txt`, `txtOn` (text on colored surface)

---

## Color — 4 categories

### 1. Brand
Identity colors that express who the brand is. Used for brand moments, not interactive elements.

- 5 levels: `first`, `second`, `third`, `fourth`, `fifth`
- Example use: hero backgrounds, branded illustrations, marketing sections

### 2. Interface Function
Colors for interactive elements — buttons, links, toggles, selection states.

- Has states: `normal` → `action` (hover) → `active` (pressed)
- Has variants: each function category (primary, secondary, neutral, danger, etc.)
- Example: primary button background = `function.primary.normal.background`
- Includes `txtOn` tokens: WCAG-validated text color to place on top of function backgrounds

### 3. Interface Feedback
Colors that communicate system status — never used for interactive elements.

- Categories: `info`, `success`, `warning`, `danger`
- 2 variants: `default` (filled, high-visibility) and `secondary` (subtle, tinted)
- Example: success toast = `feedback.success.default.background`

### 4. Foundation
Utility aliases and shortcuts — ambient backgrounds, borders, neutral text, surfaces.

- Not semantic identity — these are layout helpers
- Examples: page background, default text color, divider lines, card surfaces
- Often named: `ambient.*`, `branding.*`

### Decision tree

```
Does it need a hover/active state?     → Interface Function
Is it communicating a system status?   → Interface Feedback
Is it expressing brand identity?       → Brand (branding.*)
Is it a layout or structural helper?   → Foundation (ambient.*)
```

---

## Dimension system

All spacing, sizing, and typography in Aplica is built on a **4pt grid**.

### Scale

| Token name  | Value | Typical use |
|-------------|-------|-------------|
| `nano`      | 4px   | Hairline gaps, icon padding |
| `micro`     | 8px   | Dense internal padding |
| `extraSmall`| 16px  | Standard padding inside components |
| `small`     | 24px  | Between related groups |
| `medium`    | 32px  | Section padding, card padding |
| `large`     | 40px  | Generous section breathing room |
| `extraLarge`| 48px  | Page margins, hero padding |
| `mega`      | 56px  | Large layout gaps |
| `giga`      | 88px  | Section separators |
| `tera`      | 144px | Hero sections, full-bleed spacing |

### Density

The same token name resolves to different values based on the active density:

| Density | Character | Example: `medium` |
|---------|-----------|-------------------|
| `minor` | Compact — for data-dense UIs | 24px |
| `normal`| Default — balanced | 32px |
| `major` | Spacious — for marketing / reading | 40px |

Density is set at the workspace level. Individual components do not set density.

### Typography categories

| Category  | Purpose | Example |
|-----------|---------|---------|
| `Heading`  | Page and section titles | H1–H4 |
| `Display`  | Hero-scale, decorative text | Large hero labels |
| `Content`  | Body reading — paragraphs, captions | Body, Caption, Overline |
| `Action`   | Interactive labels — buttons, tabs, links | Button label, Tab label |
| `Code`     | Monospace — code samples | Pre, Kbd |

Typography styles are generated composites (font-family + size + weight + line-height). Use the generated style token — do not decompose and reassemble manually.

---

## Dark mode

Dark mode is **automatic**. You do not configure it separately in Figma or in component code. The engine derives the dark palette from the light config using OKLCH math. The same token name resolves to the correct dark value when dark mode is active.

Designers work in light mode. The dark values are always a build output.
