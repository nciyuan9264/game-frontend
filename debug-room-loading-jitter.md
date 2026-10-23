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
| A | The pending spinner participates in flex layout and changes button width. | High | Low | Pending width differs from idle width while label dimensions are otherwise stable. | Pending |
| B | Target resolution unmounts the outer loader and mounts a new inner loader. | High | Low | Two distinct mount IDs occur before the first snapshot. | Pending |
| C | Stage text or container dimensions cause a separate height shift. | Medium | Low | The same loader mount reports different root dimensions between stages. | Pending |
| D | A WebSocket connection starts before the match ID is available and creates an extra state transition. | Low | Medium | A connection attempt is reported with an empty match ID or URL. | Pending |

## Instrumentation Plan
- A: Record the create button bounding box immediately before pending and after pending renders.
- B/C: Record loader mount, stage changes, unmount, and root bounding boxes.
- D: Record connection creation with room ID, resolved match ID, and URL availability.

## Log Evidence
Pending pre-fix reproduction.

## Verification Conclusion
Pending pre-fix and post-fix comparison.
