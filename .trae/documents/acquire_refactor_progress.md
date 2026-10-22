# Acquire Refactor Progress

## 2026-10-14

Completed:

- Playable hand tiles now pulse on the board only during the local player's `setTile` turn.
- The company-founding dialog now matches the showcase layout and uses select-then-confirm submission.
- Established companies remain visible but disabled; founder stock messaging uses live inventory data.
- Surviving-company selection now uses the same select-then-confirm interaction as the showcase.
- Active `ROOM_SYNC` games hide the AppShell brand header while retaining room, cash, stock-price, and leave controls.
- The desktop hand panel was removed; players select highlighted tiles directly on the board.
- The desktop phase command now sits at the right edge of the phase banner and reuses the same action logic as mobile.
- The phase banner now shows one active-player avatar in the leading icon slot instead of a separate avatar stack.
- The desktop board now uses the space released by both the shell header and the removed hand panel.
- Mobile game content uses narrower side gutters so the board fills more of the available width.
- Acquire scroll containers now share one themed scrollbar treatment; intentionally hidden touch scrollers remain hidden.
- Transaction steppers now render quantities immediately, while passive values retain their animated transitions.
- `AnimatedValue` clamps RAF progress to `0..1`, preventing an early frame timestamp from producing a transient negative value.
- Shared action buttons keep their background layer during hover and animate only interpolable color, border, and brightness properties.
- Board highlighting, tile selection, and confirmation now share the same placement preview validation.
- Tiles between two safe companies remain playable and are described as independent placements.
- Transaction counters let the numeric output fill the middle track, removing the trailing gap after the plus button.
- Play now has a regression test covering the automatic `setTile` to `end` results transition.
- The circular spinner beside the Acquire loading mark was removed from all shared loading states.
- Fatal session errors and invalid room links now use a centered terminal state with a separate error reason and primary lobby action.
- The lobby action now includes a return icon, uses a fixed desktop width, and fills the available mobile content width.
- Private rooms are returned to their owners in the lobby while remaining hidden from every other player.
- Owner-visible private room cards are marked as `仅你可见`; lobby counts and visibility guidance now match this behavior.
- The redundant `ONE TABLE. ONE CITY.` inscription and its central Acquire mark were removed from the room table stage.
- The merger dialog removes the repeated per-company `并入` row and shows every dividend recipient with the server-calculated payout.
- Shareholder dividend details remain visible after the local player submits and waits for other shareholders.
- Unaffordable buy phases suppress the purchase dialog from the first render and immediately expose an automatic-skip status instead.
- The phase countdown is visible on both desktop and mobile as a stable, high-contrast timer badge.
- Single-company merger overviews use equal source/survivor card dimensions and show each company's current stock price.
- Desktop market, portfolio, activity, and dialog supporting text use a slightly larger type scale without changing mobile density.

Verification:

- ESLint passed.
- TypeScript and production build passed.
- Vitest passed: 19 files, 58 tests.
- Backend `GOWORK=off go test ./...` passed.
- Playwright passed at 1440x900 and 390x844 with mocked `ROOM_SYNC` snapshots.
- Layout regression also passed at 1280x720 with natural vertical scrolling.
- At 1440x900 the desktop board is 784.9px wide; at 1024x768 it is 617.2px wide with the phase command still contained in the banner.
- At 390x844 the board is 374px wide and the mobile hand panel remains fixed to the viewport bottom.
- Survivor selection sends no command until confirmation, then sends one `game_merging_selection` command.
- Buy, sell, and exchange counters were sampled on desktop and mobile with no negative or rollback frames.
- Phase-avatar regression confirmed one avatar on desktop/mobile; merger phases prefer the local pending shareholder.
- Primary-button hover sampling confirmed the gradient and opaque fallback remain present from the first hover frame.
- End-transition regression confirmed `gameStatus=end` opens results automatically on desktop/mobile.
- Safe-company gap placement was verified as highlighted and confirmable on desktop/mobile.
- Counter geometry was verified at 108px desktop and 100px mobile with only the 1px container border after the plus button.
- Identity-conflict rendering was verified at 1440x900 and 390x844; the terminal state remains centered with no page overflow.
- Clicking the terminal-state lobby action was verified to navigate back to `/game/acquire`.
- Owner lobby rendering was verified with one private and one public room at 1440x900 and 390x844; both cards render and the private room keeps the `返回房间` action.
- Merger dividend rendering was verified at 1440x900 and 390x844 with multiple rewarded shareholders; the redundant company relation row is absent.
- The `setTile` to unaffordable `buyStock` transition was observed from page load on desktop/mobile: the buy dialog never mounted and exactly one empty buy command was sent.
- Countdown rendering was verified at 1440x900 and 390x844 with no overlap against the room identity or cash summary.
- Single-company merger cards measured equally at 223x82 desktop and 150.5x68 mobile, with both price labels visible.
- Desktop type-scale regression confirmed 18px market heading, 13px company names, 12px market metadata, 15px side-panel headings, 14px activity entries, and 13-14px dialog guidance without horizontal overflow.
- No horizontal overflow or browser console errors were found.

No deployment or remote push was performed.
