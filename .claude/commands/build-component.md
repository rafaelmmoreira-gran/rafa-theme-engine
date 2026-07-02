---
description: Build a UI component using Aplica tokens — semantic-first, archetype-based, output-verified
allowed-tools: Read
---

The user wants to build or style a UI component with Aplica tokens. Use `$ARGUMENTS` as the component name or description.

## Step 1 — Read the contracts

Read both files before writing a single line of code:

- `docs/context/aplica-ui-integration.md` — hard rules, archetype list, replication workflow
- `docs/context/theme-engine-playbook.md` → "Workspace outputs" and "Architecture at a glance"

## Step 2 — Inspect the real outputs

Never guess token names or CSS variable names. Read:

- `dist/css/<brand>-light.css` — exact CSS variable names and format
- `dist/json/<brand>-light-positive.json` — token structure for semantic color groups

Find the brand from `themes.config.json` if not specified in `$ARGUMENTS`.

## Step 3 — Choose the closest archetype

Map `$ARGUMENTS` to the nearest validated archetype from `aplica-ui-integration.md`:

- **Button** — pill shape, semantic interaction tokens, action typography styles
- **Dialog** — overlay, elevation level 4, portal-aware theming
- **Input** — bordered/borderless variants with equal outer dimensions, label styles
- **Badge** — compact action styles, not button-scale typography
- **Select** — portal overlay, full-row option items (not floating pills)
- **Card** — elevation level 1, product surface tokens
- **Tabs** — interface function tokens, consistent height with peer controls

If the component is new, compose from the nearest archetype.

## Step 4 — Implement

Build the component following the contract:

- **Default to semantic tokens** for all color, border, and elevation intent.
- **Use Foundation** only when an existing alias improves readability without bypassing semantic intent.
- **For typography and elevation** — prefer sanctioned generated styles (action styles for buttons, label styles for form labels, elevation levels for cards and dialogs).
- **For portal-based libraries** (Base UI, Radix) — validate that the theme propagation reaches the portal root, not only the app root.

## Hard rules

- Never hardcode token-owned values (`px`, `hex`, `rgba()`, raw shadows, ad hoc radii).
- Never guess variable names — derive them only from the files read in Step 2.
- Never change generators, schemas, `data/`, or output contracts — escalate if a solution seems to require that.
- Bordered and borderless variants must preserve the same outer dimensions.
- Buttons and peer controls in the same size tier must align in height.

## References

- UI integration contract: `docs/context/aplica-ui-integration.md`
- Token structure: `data/semantic/default.json`
- Generated styles: `data/foundation/<brand>/styles/typography_styles.json`