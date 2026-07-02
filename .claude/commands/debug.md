---
description: Diagnose and fix color, contrast, dark mode, or build issues — describe the problem as $ARGUMENTS
allowed-tools: Read
---

The user has a problem. Use `$ARGUMENTS` as the problem description. If empty, ask one clarifying question: "What are you seeing that looks wrong?"

## Step 1 — Read diagnostics reference

Read `docs/context/theme-engine-playbook.md` → "Common diagnostics" section.

## Step 2 — Read the relevant config and outputs

Based on the problem category, read:

| Problem type | Files to read |
|-------------|---------------|
| Color / contrast issue | `config/<brand>.config.mjs` + `dist/json/<brand>-light-positive.json` |
| Dark mode issue | `config/<brand>.config.mjs` (focus on `modeResolution`, `darkModeChroma`) |
| Interaction state (hover, active, focus) | `config/<brand>.config.mjs` → `interaction.dilution` |
| Text readability | `config/<brand>.config.mjs` → `txtOnStrategy`, `generation.colorText` |
| Ghost element color | `config/<brand>.config.mjs` → `ghostNormalTxtOnStrategy` |
| Build not updating | `themes.config.json` + `aplica-theme-engine.config.mjs` |
| Figma out of sync | `data/$themes.json` + `data/$metadata.json` |

Find the brand name from `$ARGUMENTS` or from `themes.config.json`.

## Step 3 — Diagnose with the decision tree

Run through the matching diagnostic from the playbook. Report:

1. **Root cause** — the specific config key or workflow step that is causing the issue.
2. **What to change** — exact file, key path, and value. One change at a time.
3. **How to verify** — `theme-engine build` then `theme-engine preview --serve`, or specific contrast check.
4. **If unclear** — ask one targeted question (not multiple). Example: "Does this happen in light mode, dark mode, or both?"

## Hard rules

- Never suggest editing `data/` or `dist/` directly.
- Do not guess the root cause without reading the actual config and outputs first.
- If the issue requires changes to the engine itself (not config), say so and escalate — do not invent workarounds.
- Fix one thing at a time — do not suggest multiple simultaneous changes.

## References

- Diagnostics: `docs/context/theme-engine-playbook.md` → "Common diagnostics"
- Config keys: `docs/context/theme-engine-playbook.md` → "Config key reference"