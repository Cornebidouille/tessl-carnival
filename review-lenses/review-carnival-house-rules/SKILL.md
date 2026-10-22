---
name: review-carnival-house-rules
description: Review a change to a carnival game for the house rules in AGENTS.md that keep every game on the shared midway base, its registry, its score board and its theme. Use as one lens in a code review run on src/games.
---

# Review lens: Carnival House Rules

Review changes under `src/games/` for whether each game still plugs into the carnival's shared base instead of working around it. `AGENTS.md` at the repository root states the rules; read its "House rules" section before the diff.

## Scope

- **Registering on the midway** A game the midway cannot launch, or launches some other way: a game that does not export its `CarnivalGame` from `src/games/<game-id>/game.ts`, is reached through anything but the list in `src/games/index.ts`, or computes its `id` instead of stating the one its folder is named after.
- **Reporting scores** A score the carnival's score board never sees, sees twice, or sees under the wrong name: a round that ends without one `recordScore(<game>.id, score)` call from `src/carnival`, a call that can run again for the same round (per hit, per frame, on every redraw of the game over screen), an id written as a string that can drift from the game's `id`, or a game that reads or writes browser storage itself or keeps its own best score or high score table.
- **Drawing with the theme** A game that will stop matching the midway when the theme changes: a colour written as a hex, `rgb()`, `hsl()` or named CSS colour, a font written as a string, or a font size or canvas size that restates a value `theme` already has, where `theme` and `canvasFont` from `src/carnival/theme.ts` should be used.

## Method

Start from each changed game's `game.ts` and follow its `start` function: where it draws, where a round ends, and what it does at the end of a round. For scores, trace every path that ends a round, including restarting from the game over screen, and count the `recordScore` calls each one can make. For colours and fonts, read every value passed to the canvas context (`fillStyle`, `strokeStyle`, `font`, `shadowColor`, gradient stops) back to where it comes from.

## Threshold

Report a change that breaks one of these three rules in a game's code.

Do not report:

- A game folder that is not registered, or an `id` that does not match its folder or is not kebab-case: `src/games/index.test.ts` and `createRegistry` already fail on those.
- Reading `bestScore` or `topScores` from `src/carnival` to show a score; only keeping a separate copy is a breach.
- Values built from theme values, such as a theme colour with transparency added, or a size computed from `theme.canvas`.
- Game geometry and tuning that the theme has no value for: positions, speeds, target sizes, timings.
- Literals in `game.test.ts` or other tests, which do not draw.
- The other house rules (testable logic, cleanup in `start`, the game README, one game per change), and anything outside `src/games/`. Other lenses and reviewers cover those.

## Reporting

- Name the rule, the line that breaks it, and what the player or the midway sees as a result: a missing or doubled score, a booth that does not open, a colour that no longer matches the theme.
- State the fix in terms of the shared base: the `recordScore` call and where the round ends, the `theme.colors` entry or `canvasFont(...)` size to use, the registry entry. When the theme has no colour close enough, say that adding one to `src/carnival/theme.ts` is its own change.
