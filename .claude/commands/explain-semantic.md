---
description: Explain the logic, math, or design intent behind a semantic concept, config key, or token group — pass the topic as $ARGUMENTS
allowed-tools: Read
---

The user wants to understand how something works. Use `$ARGUMENTS` as the topic. If empty, ask: "What concept, config key, or token group would you like explained?"

## Step 1 — Read the playbook

Read `docs/context/theme-engine-playbook.md`. Use the "Topic → file matrix" to find the right file for the requested concept.

## Step 2 — Read the source file for the concept

Based on `$ARGUMENTS`, read the most relevant file:

| Topic | File to read |
|-------|-------------|
| Any semantic token group (`brand`, `ambient`, `interface`, `product`) | `data/semantic/default.json` |
| OKLCH color math, `modeResolution`, `darkModeChroma` | `docs/context/theme-engine-playbook.md` → "Config key reference" |
| `dilution`, interaction states, `baseAdaptation` | `config/<brand>.config.mjs` + playbook config reference |
| `txtOnStrategy`, `txt` token, WCAG contract | `docs/context/theme-engine-playbook.md` + `dist/json/<brand>-light-positive.json` |
| Typography (`fontFamily`, `fontSize`, `lineHeight`) | `data/foundation/<brand>/styles/typography_styles.json` |
| Dimension scale (spacing, sizes) | `data/dimension/normal.json` (if exists) |
| Foundation layer vs Semantic layer | `docs/context/theme-engine-playbook.md` → "Architecture at a glance" |

## Step 3 — Explain with depth appropriate to the question

Structure the response:

1. **What it is** — one-sentence definition.
2. **Why it exists** — the design intent or constraint it solves (accessibility, visual consistency, dark mode fidelity, etc.).
3. **How it works** — the mechanism: what inputs it reads, what math or logic it applies, what outputs it produces. Be specific — include OKLCH channel names (L, C, H), config key paths, or token path examples when they add clarity.
4. **How to change it** — the exact config key and where it lives. Include a concrete value example.
5. **What to avoid** — the most common misuse or misunderstanding.

Adjust depth to the user's apparent level. A concise question gets a concise answer; "explain the math" deserves full detail.

## Hard rules

- Do not invent token paths or config keys not present in the files you read.
- Do not simplify away the "why" — the design rationale is the most valuable part of this command.
- If the topic is not covered locally, say so explicitly and point to `docs.aplica.me`.

## References

- Playbook: `docs/context/theme-engine-playbook.md`
- Semantic tokens: `data/semantic/default.json`
- Deep reference: `docs.aplica.me`