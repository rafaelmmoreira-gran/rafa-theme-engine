# Aplica Theme Engine Workspace

This workspace uses `@aplica/aplica-theme-engine` to generate multi-brand, multi-mode design token systems. Edit config files → run `theme-engine build` → consume from `dist/`.

## Key commands

```bash
theme-engine build                # Full build — run after any config change
theme-engine build:foundation     # Foundation only — after typography/elevation changes
theme-engine dimension:generate   # Dimension tokens — after dimension.config.mjs changes
theme-engine preview              # Visual token browser
theme-engine preview --serve      # Watch mode — reloads on dist/ changes
theme-engine design:md            # Regenerate DESIGN.md with current brand values
theme-engine ai:guidance          # Rebuild dist/AI_GUIDANCE.md (run after major updates)
theme-engine contracts:generate   # Snapshot token contract before publishing
theme-engine contracts:diff       # Check for breaking token changes in CI
```

## AI skills available

| Command | Use for |
|---------|---------|
| `/getting-started` | First-time setup and orientation |
| `/configure-visual` | Map a visual goal to the right config key |
| `/engineering-integration` | CSS variables, JSON tokens, platform consumption |
| `/debug` | Diagnose color, contrast, or dark mode issues |
| `/explain-semantic <topic>` | Understand a config concept or semantic group |
| `/build-component` | Build a UI component with correct Aplica tokens |

## Knowledge base

- `docs/context/theme-engine-playbook.md` — config reference, CLI commands, architecture, diagnostics
- `docs/context/token-concepts.md` — token concepts, color vocabulary, dimension system (N1 reference)
- `docs/context/engineering-guide.md` — CSS consumption, dark mode, portal pattern (N3 reference)
- `dist/AI_GUIDANCE.md` — workspace-specific context compiled from your docs (run `theme-engine ai:guidance` to generate or update)

## Rules for AI

- Never edit `data/` or `dist/` files directly — they are generated outputs.
- Never hardcode token values (`px`, `hex`, `rgba()`) in components — use CSS variables from `dist/css/`.
- Always read `dist/json/<brand>-light-positive.json` before naming a token or CSS variable.
- Run `theme-engine build` after any config change before inspecting outputs.
