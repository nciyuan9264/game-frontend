# Shared Game Sound Effects

The game frontend uses this small set of short MP3 effects across all games.

## Active Files

| Project file       | Runtime URL                        | Intended event                      |
| ------------------ | ---------------------------------- | ----------------------------------- |
| `ui-click.mp3`     | `/game-sounds/ui-click.mp3`     | Click on non-interactive game areas |
| `button-click.mp3` | `/game-sounds/button-click.mp3` | Generic button/link activation      |
| `tab-click.mp3`    | `/game-sounds/tab-click.mp3`    | Tab or segmented-control switching  |
| `tile-select.mp3`  | `/game-sounds/tile-select.mp3`  | Select or preview a board item      |
| `tile-place.mp3`   | `/game-sounds/tile-place.mp3`   | Confirm a board action              |
| `create-company.mp3` | `/game-sounds/create-company.mp3` | Confirm a major game action      |
| `stock-buy.mp3`    | `/game-sounds/stock-buy.mp3`    | Confirm a resource action           |

## Playback Notes

- MP3 is used for broader browser compatibility.
- Runtime sound effects are peak-normalized to a similar max volume.
- Keep future sound additions explicit rather than expanding this into an implicit catch-all audio pack.
- Source/license metadata is not recorded here yet; add it before release if this asset was sourced externally.
