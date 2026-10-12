# Color Coded Spells 5e

A FoundryVTT module that color-codes items on the D&D 5e character sheet.

## Targets

- Foundry VTT **v13** (verified 13.351)
- dnd5e system **5.3.3**. Its sheets are ApplicationV2 based. Do not use jQuery or ApplicationV1 patterns (`renderActorSheet`, `html.find`); render hooks receive plain `HTMLElement`s.
- Verify hook names and sheet DOM against the dnd5e 5.3.3 source rather than guessing.

## Layout

- `module.json`: manifest. Module id is `color-coded-5e` and must match the folder name Foundry sees.
- `src/main.ts`: TypeScript entry point. Built by Vite to `dist/main.js` (gitignored, referenced by `esmodules`).
- `styles/color-coded.css`: plain CSS, loaded directly by Foundry (not bundled) so hot reload works.
- `lang/en.json`: localization.

## Commands (pnpm)

- `pnpm dev`: rebuild `dist/` on change
- `pnpm build`: one-off build
- `pnpm typecheck`: `tsc --noEmit` (Vite does not type-check)
- `pnpm lint`, `pnpm format`

## Environment

- Foundry runs in Docker (`felddy/foundryvtt:13`); this folder is bind-mounted to `/data/Data/modules/color-coded-5e` in `~/Github/jaazdin-docker/jaazdin-compose.yaml`.
- Hot reload is enabled: CSS, templates and lang files reload live. JS changes need a browser refresh; `module.json` changes need returning to setup and relaunching the world.

## Types

- Foundry types come from `fvtt-types`, pinned to the v13 beta `13.346.0-beta.20251209192131`. The `main` branch of that project is v14, so do not install from `main`.
- There are no dnd5e system types; write small local interfaces or casts (e.g. for `item.system.school`).
- `pnpm-workspace.yaml` sets `blockExoticSubdeps: false` because the types package depends on git-hosted packages (pixi.js).

## Conventions

- Prefix CSS classes and data attributes with `cc5e` / use `data-school` to avoid collisions with other modules.
- Keep the school-to-color mapping in CSS custom properties so users/settings can override it later.
