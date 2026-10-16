# Acquire Sound Effects

Acquire currently wires a small set of short MP3 sound effects.

## Active Files

| Project file       | Runtime URL                        | Intended event                      |
| ------------------ | ---------------------------------- | ----------------------------------- |
| `ui-click.mp3`     | `/acquire-sounds/ui-click.mp3`     | Click on non-interactive page areas |
| `button-click.mp3` | `/acquire-sounds/button-click.mp3` | Generic button/link activation      |
| `tab-click.mp3`    | `/acquire-sounds/tab-click.mp3`    | Tab or segmented-control switching  |
| `tile-select.mp3`  | `/acquire-sounds/tile-select.mp3`  | Select or preview a board tile      |
| `tile-place.mp3`   | `/acquire-sounds/tile-place.mp3`   | Confirm tile placement action       |
| `create-company.mp3` | `/acquire-sounds/create-company.mp3` | Confirm company creation action     |
| `stock-buy.mp3`    | `/acquire-sounds/stock-buy.mp3`    | Confirm stock purchase action       |

## Playback Notes

- MP3 is used for broader browser compatibility.
- Runtime sound effects are peak-normalized to a similar max volume.
- Keep future sound additions explicit rather than expanding this into an implicit catch-all audio pack.
- Source/license metadata is not recorded here yet; add it before release if this asset was sourced externally.
