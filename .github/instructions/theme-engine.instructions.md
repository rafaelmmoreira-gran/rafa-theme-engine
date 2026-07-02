---
applyTo: '**'
description: "Aplica Theme Engine expert — token concepts, config keys, architecture, diagnostics"
---

# Aplica Theme Engine — Expert Guide

Detect user level before answering:
- **N1 (Product Designer)**: designer vocabulary → explain concepts, no code
- **N2 (System Designer)**: config/engine vocabulary → explain architecture and config keys
- **N3 (Engineer)**: code vocabulary → for implementation apply `aplica-components` instructions; use this for concepts + config

## Color vocabulary (N1)
4 categories: **Brand** (identity), **Interface Function** (interactive, with hover/pressed states), **Interface Feedback** (info/success/warning/danger), **Foundation** (ambient, structural).

## 5-layer architecture (N2)
Brand config → Mode → Surface → Semantic → Foundation. Edit config, run `theme-engine build`, consume from `dist/`.

## Config key reference (N2)
| Key | What it does |
|-----|-------------|
| `modeResolution` | Dark palette derivation algorithm |
| `darkModeChroma` | Saturation multiplier for dark (0–1) |
| `dilution` | Interaction state desaturation strategy |
| `txtOnStrategy` | WCAG text on colored surfaces |
| `ghostNormalTxtOnStrategy` | Ghost button text: `'txt'` or `'surface'` |
| `baseAdaptation` | Base surface quadrant adaptation |
| `overrides.interaction` | Direct state color overrides |
| `overrides.grayscale` | Neutral scale override |
| `surfacePolarity` | Positive-only output (disables negative) |
| `generation.colorText` | Enable `txt` tokens per group |
| `interfaceFunctionPaletteLevels` | Number of interaction palette steps |
| `structure.borderWidth` | Expose border width scale as CSS vars — add to `config/foundations/<brand>.config.mjs → structure` with `items` only |
| `structure.borderRadius` | Expose border radius scale as CSS vars — add to `config/foundations/<brand>.config.mjs → structure` with `items` only |
| `structure.<anyKey>` | Generic alias: `{ semanticPath, type, items }` exposes any semantic token as a foundation CSS var — no engine changes needed; path must exist in `data/semantic/default.json` |

## Diagnostics
- Hover too similar → `dilution.target` lightness
- Dark washed out → `darkModeChroma` toward 1.0
- Text unreadable → `txtOnStrategy` + `generation.colorText`
- Ghost text wrong → `ghostNormalTxtOnStrategy`
- Colors not updating → run `theme-engine build`

## Rules
- Never edit `data/` or `dist/` files.
- Never invent config key names.
- Reference: `docs/context/theme-engine-playbook.md`
