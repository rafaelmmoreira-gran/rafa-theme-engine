---
description: Consume Aplica tokens in an app — CSS variables, JSON, typed output, platform patterns
allowed-tools: Read
---

The user wants to understand how to use generated tokens in their application code.

## Step 1 — Read the playbook

Read `docs/context/theme-engine-playbook.md` — focus on "Workspace outputs" and "Architecture at a glance".

## Step 2 — Inspect the actual outputs

Read these files to understand the current workspace's real output structure:

- `dist/css/<brand>-light.css` — CSS custom property names and format
- `dist/json/<brand>-light-positive.json` — JSON structure and token nesting
- `aplica-theme-engine.config.mjs` — check `output` and `formatOptions` for enabled platforms

If `$ARGUMENTS` mentions a specific platform (React, Flutter, iOS, Tailwind, etc.), focus on the most relevant output format.

## Step 3 — Respond with concrete patterns

Cover what is relevant to the user's platform based on `$ARGUMENTS`:

**CSS / Web:**
- How to import the CSS file and apply the theme class
- How CSS variable names are structured (`--semantic-color-...`, `--foundation-...`)
- How to apply light/dark mode switching (class swap, `prefers-color-scheme`, or data attribute)
- How `positive` vs `negative` surfaces work and when to use each

**JSON / TypeScript:**
- Path to the JSON output and its nesting structure
- How to use `jsonTyped` platform output for typed tokens (`formatOptions.jsonTyped`)

**Figma / Tokens Studio:**
- Role of `data/$themes.json` and `data/$metadata.json`
- The `figma:generate` command and the sync workflow

Provide a short code example only when the pattern is non-obvious and the output file confirms the exact variable/key names.

## Hard rules

- Never invent CSS variable names — always derive them from the actual `dist/css/` file.
- Never recommend editing `dist/` directly — always edit config + rebuild.
- Do not treat Figma artifacts (`_brand.json`, `data/$themes.json`) as component APIs.

## References

- Workspace outputs: `docs/context/theme-engine-playbook.md` → "Workspace outputs"
- CLI: `docs/context/theme-engine-playbook.md` → "CLI commands"