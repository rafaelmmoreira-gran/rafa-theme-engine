# UI Integration with Aplica DS

This template copy exists as a distribution bridge for other AI surfaces.

It is not the primary policy source of truth.

## Read the active source of truth

Always treat the repository-level documents as canonical:

- `docs/context/ai-ui/UI_TOKEN_CONSUMPTION_CONTRACT.md`
- `docs/context/ai-ui/COMPONENT_ARCHETYPES.md`
- `docs/context/aplica-ui-integration.md`
- `docs/context/ai-ui/TYPOGRAPHY_AND_ELEVATION_STYLE_USAGE.md`

## Replication workflow

1. Inspect the consumer's real compiled outputs first.
2. Choose the closest validated archetype.
3. Default to semantic intent.
4. Prefer sanctioned generated typography and elevation styles.
5. Confirm whether the workspace exposes both `positive` and `negative` outputs or only `positive`.
6. Implement from the contract and archetypes, not from guessed token names or copied local demos.

## Hard rules

- Never hardcode token-owned values unless explicitly requested.
- Never guess variable names or output formats.
- Never assume that `negative` surface outputs always exist.
- Never treat Figma or Tokens Studio bundle artifacts such as `brand_product`, `brand_txt`, `_brand_product.json`, or `data/$themes.json` as component APIs.
- Never silently change generators, schemas, generated token descriptions, generated `data/`, or output contracts.
- Escalate those changes to the operator instead.
