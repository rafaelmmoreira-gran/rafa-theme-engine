---
applyTo: "**/*.{js,jsx,ts,tsx,css,scss,html,vue,svelte}"
description: "Build UI components with Aplica tokens — semantic-first, archetype-based, output-verified"
---

# Aplica Components — Implementation Guide

## Before writing code
1. Read `dist/css/<brand>-light.css` — exact CSS variable names. Never guess.
2. Check `aplica-theme-engine.config.mjs` → `surfacePolarity`: if `'positive'`, negative tokens don't exist.

## Token contract
Per state: `background`, `border`, `txtOn` (text on bg), `txt` (standalone). Use `txtOn` for text on colored surfaces.

## Patterns
- Button states: `..normal.bg` → `..action.bg` (hover) → `..active.bg` (pressed)
- Typography: use generated composite styles — never decompose manually
- Elevation: use generated shadow tokens — never write raw `box-shadow`

## Dark mode
Load both CSS files (`*-light.css`, `*-dark.css`). Apply dark class to root element.
Check the dark CSS file for the exact selector before applying.

## Portal pattern (Base UI, Radix, Floating UI)
Apply theme class to `document.body`. Portaled elements render outside app root and lose CSS scope.

## Archetypes
Button · Input · Dialog (portal) · Badge · Card · Tabs · Tooltip (portal)

## Rules
- Never hardcode `px`, `hex`, `rgba()`, raw shadows, or radii.
- Never invent variable names — derive from `dist/css/` only.
- Never assume `negative` surface exists — check config first.
- Reference: `docs/context/engineering-guide.md`
