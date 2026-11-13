# Mobile Layout System

This contract applies to game pages at `max-width: 767px`. It standardizes
geometry while every game keeps its colors, type, artwork, and copy.

## Layout

- The app shell owns `block-size: 100dvh`.
- Shell rows are header, `minmax(0, 1fr)` content, and navigation.
- Page roots use `width: 100%`, `min-width: 0`, and `min-height: 0`.
- Main layout must not rely on fixed positioning or compensating padding.
- Flex and grid children that own scrolling must use `min-height: 0`.

## Tokens

| Token | Default | Purpose |
| --- | ---: | --- |
| `--game-mobile-page-gutter` | `14px` | Page inline inset |
| `--game-mobile-section-gap` | `14px` | Gap between peer surfaces |
| `--game-mobile-surface-padding` | `18px` | Equal surface inset |
| `--game-mobile-surface-radius` | `8px` | Panels and cards |
| `--game-mobile-control-radius` | `6px` | Controls and callouts |
| `--game-mobile-control-min-height` | `40px` | Touch controls |
| `--game-mobile-list-row-min-height` | `64px` | List row minimum |

Hero basis tokens use `dvh` and have Tall, Regular, and Compact viewport
variants in `src/styles/game-mobile-layout.css`.

## Scroll ownership

Each page has one vertical scroll owner:

- Lobby: page root.
- Rankings: page root; ranking rows stay in normal flow.
- Guide: chapter copy; the authority hint and actions stay outside the scroll
  region.
- Profile: page root; history rows stay in normal flow and expand naturally.
- Waiting room: middle room content.
- Replay and final result: page root, only when needed.
- Card and unit libraries: page root.

The document, shell, and an inner list must never scroll vertically together.

## Height adaptation

- Tall: at least `761px`.
- Regular: `641px` through `760px`.
- Compact: at most `640px`.

Compact layouts reduce decorative media, padding, and secondary facts before
changing readable copy or touch targets. Guide pages must keep the current
chapter, authority hint, and primary action visible without vertical scrolling.

## Component rules

- Peer surfaces use the page gutter as their vertical gap.
- Surface padding is equal on all four sides.
- Profile identity/history and ranking intro/list are unframed page sections
  separated by one horizontal rule; only individual list rows use internal
  dividers.
- Ranking and profile summary sections scroll away first. When the section
  divider reaches the top of the page scrollport, it stays pinned together with
  the ranking tabs/table heading or history heading while list rows continue
  underneath.
- Profile identity places the eyebrow, name, and email on the left with a
  prominent editable avatar on the right; player ID metadata stays hidden.
- Profile stats use whitespace only: no top rule and no column dividers.
- The avatar is the profile-edit link. Logout is hidden for normal players and
  appears after history content only when the profile has the `admin` role.
- History ends with the last record; do not render load-more controls or
  end-of-list status copy.
- Rows use `min-height`, never a fixed content height.
- Dividers exist only between rows.
- Tabs use a short per-item background pulse on press and may transition color
  or border; the tab element itself never moves or scales.
- Columns use `minmax(0, 1fr)`.
- Guide actions remain pinned inside the copy panel. Long chapter copy scrolls
  above the always-visible authority hint and actions.
- Media uses fluid dimensions, `object-fit`, or `aspect-ratio`.
- Lobby room cards use the Acquire hierarchy: room number, status, owner
  identity, visibility, capacity, and action. Do not render an owner label.
- Keep the progress bar when the room API exposes a bounded
  `progressCurrent/progressTotal` pair. Never derive an arbitrary total from an
  unbounded turn counter. Cards with `progressTotal <= 0` omit progress.
  Hex, Quoridor, and Onitama therefore never show a bar; DaVinci remains hidden
  until its backend provides a non-zero total.

## Development preview

Open `/__dev/game` in a development build. The `game` and `scene` query
parameters select a real game route backed by local API and WebSocket fixtures:

```text
/__dev/game?game=acquire&scene=lobby
/__dev/game?game=acquire&scene=result
/__dev/game?game=warchest&scene=room-ready
```

Available scenes are `lobby`, `rankings`, `guide`, `profile`, `room-empty`,
`room-ready`, and `room-ai`. Acquire also exposes `result`, rendered with its
real result component inside the real match shell. Add `controls=0` to hide the
game and scene selectors. The preview bootstrap is development-only and must
not appear in a production bundle.
