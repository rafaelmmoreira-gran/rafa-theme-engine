---
description: Map a visual goal to the correct config key and value — colors, dark mode, interaction states
allowed-tools: Read
---

The user has described a visual result they want. Help them get there through config, not by editing generated files.

## Step 1 — Read the playbook

Read `docs/context/theme-engine-playbook.md` — focus on "Config key reference" and "Common diagnostics".

## Step 2 — Read the workspace config

Read the brand config file for the relevant brand. Find it via:

- `themes.config.json` → look for the brand's `config` path → read that `config/<brand>.config.mjs`
- If brand is unclear from `$ARGUMENTS`, read `themes.config.json` first and ask which brand.

## Step 3 — Read current output (if dist exists)

If `dist/json/` exists, read `dist/json/<brand>-light-positive.json` to understand the current resolved values.

## Step 4 — Map the goal to a config key

Use the "Config key reference" table from the playbook to identify which key controls the desired visual result.

Respond with:

1. **Current state** — what the relevant config key is currently set to (or that it's using the default).
2. **What to change** — the exact key path in `config/<brand>.config.mjs` and a concrete value or range.
3. **Why it works** — one-sentence explanation of the mechanism (e.g., "darkModeChroma multiplies the chroma channel in OKLCH, so increasing it saturates the dark palette").
4. **Next step** — `theme-engine build`, then `theme-engine preview --serve` to see the result live.

## Hard rules

- Never suggest editing `data/` or `dist/` directly.
- Never invent config key names — only use keys from the playbook's "Config key reference" table.
- If the goal cannot be achieved via config (requires engine changes), say so explicitly and escalate.
- Do not suggest multiple changes at once — one key change at a time so the user can see cause and effect.

## References

- Config key reference: `docs/context/theme-engine-playbook.md` → "Config key reference"
- Diagnostics: `docs/context/theme-engine-playbook.md` → "Common diagnostics"