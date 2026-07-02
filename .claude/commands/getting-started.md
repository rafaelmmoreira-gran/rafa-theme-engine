---
description: First-time orientation — understand the workspace state and the right next step
allowed-tools: Read
---

## Step 1 — Read the playbook

Read `docs/context/theme-engine-playbook.md` — focus on "Architecture at a glance" and "CLI commands".

## Step 2 — Read the workspace config

Read these files if they exist:

- `themes.config.json` — active brands, per-brand config file paths, mode resolution settings
- `aplica-theme-engine.config.mjs` — workspace-level settings (output formats, dimension mode, AI guidance)

If neither file exists, the workspace has not been initialized yet.

## Step 3 — Assess and respond

Based on what you found, cover:

1. **What exists** — list the brands configured, their config file paths, and whether `dist/` has generated output.
2. **What is missing** — if no config exists, recommend `theme-engine init` to set up the workspace. If config exists but `dist/` is empty, recommend `theme-engine build`.
3. **Recommended first step** — one concrete CLI command with a brief reason.
4. **Available AI commands** — list the 6 slash commands from `CLAUDE.md` so the user knows what help is available.

## Hard rules

- Do not invent brand names or token paths. Only report what you actually read.
- If `dist/` is empty or missing, do not describe token values — they have not been generated yet.
- Do not run `theme-engine build` automatically — recommend it and let the user confirm.

## References

- Architecture and CLI: `docs/context/theme-engine-playbook.md`
- Workspace commands: `CLAUDE.md`