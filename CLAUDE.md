# Color Coded 5e

A FoundryVTT module that color-codes items on the D&D 5e character sheet.

## Targets

- Foundry VTT **v13** (verified 13.351)
- dnd5e system **5.3.3**. Its sheets are ApplicationV2 based. Do not use jQuery or ApplicationV1 patterns (`renderActorSheet`, `html.find`); render hooks receive plain `HTMLElement`s.
- Verify hook names and sheet DOM against the dnd5e 5.3.3 source rather than guessing. dnd5e's source is on the host at `~/foundrydata/Data/systems/dnd5e/` (`dnd5e.mjs`, `dnd5e.css`, `templates/`).
- Foundry core's source is only inside the container: `/home/node/resources/app/public/scripts/foundry.mjs` (copy it out with `docker cp foundryvtt:...`). fvtt-types can lag the runtime, so check behaviour there.

## Layout

- `module.json`: manifest. Module id is `color-coded-5e` and must match the folder name Foundry sees.
- `src/main.ts`: TypeScript entry point. Built by Vite to `dist/main.js` (gitignored, referenced by `esmodules`).
- `src/shared.ts`: module id, logger, tag defaults, `resolveTag`/`getColorTag`, the condition helpers (`getApplicableConditions`, `conditionsMet`), and `applyTag`, which both the actor sheet rows and the window's preview use.
- `src/color-tag-config.ts`: the color tag window (`DocumentSheetV2` + `HandlebarsApplicationMixin`) and `openColorTagConfig`. Saving goes through `DocumentSheetV2`'s own submit (inputs are named `flags.color-coded-5e.*`); Remove deletes the whole flag scope. The preview row mirrors dnd5e's inventory row markup, with columns filled from the item's own data.
- `templates/`: Handlebars templates, served by Foundry from `modules/color-coded-5e/templates/`. Also listed in the release workflow's zip.
- `styles/color-coded-5e.css`: plain CSS, loaded directly by Foundry (not bundled) so hot reload works.
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
- There are no dnd5e system types; write small local interfaces or casts (e.g. for `item.system.equipped`).
- `pnpm-workspace.yaml` sets `blockExoticSubdeps: false` because the types package depends on git-hosted packages (pixi.js).
- `HandlebarsApplicationMixin` combined with `Item.Implementation` fails with "Excessive stack depth", so the color tag window's base class is cast (see the comment above `ItemSheetBase`). Add any other mixin members you need to that cast.

## Conventions

- Prefix CSS classes and data attributes with `cc5e` to avoid collisions with other modules.
- Colors are per item, stored as flags under `flags.color-coded-5e` (see `ItemColorFlags` in `src/types.d.ts`). There are no module settings.
