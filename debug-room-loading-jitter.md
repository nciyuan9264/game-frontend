# Debug Session: room-loading-jitter
- **Status**: [OPEN]
- **Issue**: Creating or entering a room visibly shifts the pending button and remounts the loading screen.
- **Debug Server**: `https://api.gamebus.online/__trae-debug/room-loading-jitter/event`
- **Log File**: `.dbg/trae-debug-log-room-loading-jitter.ndjson`

## Reproduction Steps
1. Open the production Acquire lobby while authenticated.
2. Open the create-room dialog and click the primary create action.
3. Observe the button before and during the pending state.
4. Observe the loading screen from target lookup through the first WebSocket snapshot.

## Hypotheses & Verification
| ID | Hypothesis | Likelihood | Effort | Expected Signal | Evidence |
|----|------------|------------|--------|-----------------|----------|
| A | The pending spinner participates in flex layout and changes button width. | High | Low | Pending width differs from idle width while label dimensions are otherwise stable. | Confirmed |
| B | Target resolution unmounts the outer loader and mounts a new inner loader. | High | Low | Two distinct mount IDs occur before the first snapshot. | Confirmed |
| C | Stage text or container dimensions cause a separate height shift. | Medium | Low | The same loader mount reports different root dimensions between stages. | Rejected |
| D | A WebSocket connection starts before the match ID is available and creates an extra state transition. | Low | Medium | A connection attempt is reported with an empty match ID or URL. | Rejected |

## Instrumentation Plan
- A: Record the create button bounding box immediately before pending and after pending renders.
- B/C: Record loader mount, stage changes, unmount, and root bounding boxes.
- D: Record connection creation with room ID, resolved match ID, and URL availability.

## Log Evidence
Pre-fix production reproduction for room `acquire_xcbdrj1hdeqx`:

- Line 1: idle create button measured `131x41`, with one child.
- Line 2: pending create button measured `154x41`, with the spinner increasing the width by 23px.
- Lines 4-6: target resolution unmounted loader `53cff123...` and mounted loader `0e2e7de3...`.
- Lines 4-5: both loader roots measured `860x658`, rejecting a container-size change as the cause.
- Lines 7-8: one WebSocket was constructed after match `acquire_xcbdrj1hdeqx-r1` was available.
- Lines 9-12: the second loader remained until the first snapshot, then unmounted.

## Verification Conclusion
Root causes are the in-flow pending spinner and the component boundary change from outer target loading to inner session loading. The fix must keep button content in layout and keep one keyed bootstrap component mounted from target lookup through the first snapshot.
