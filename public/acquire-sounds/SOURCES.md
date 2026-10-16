# Acquire Sound Effects

The first Acquire sound integration only wires one UI click sound.

## Active File

| Project file   | Runtime URL                    | Intended event               |
| -------------- | ------------------------------ | ---------------------------- |
| `ui-click.mp3` | `/acquire-sounds/ui-click.mp3` | Generic interactive UI click |

## Playback Notes

- This is the only sound effect referenced by the current Acquire UI code.
- MP3 is used for broader browser compatibility.
- Keep future sound additions explicit rather than expanding this into an implicit catch-all audio pack.
- Source/license metadata is not recorded here yet; add it before release if this asset was sourced externally.
