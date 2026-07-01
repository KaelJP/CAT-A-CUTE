# Requirements — Basement→Bedroom Exit Bug

## Bug: Player cannot exit basement to bedroom

**Repro:** Player walks left in basement toward x=50 exit. Transition doesn't fire or gets stuck.

**Root cause hypothesis (to confirm):** The `isTransitioning` flag may already be `true` due to a prior camera effect (fade-in on room entry, or flash from horror events), preventing `transitionToRoom()` from executing. The camera's `fadeOut` → `camerafadeoutcomplete` chain may also conflict if the camera is still processing the initial `fadeIn(500)` when the player reaches the exit quickly.

### Acceptance Criteria:
1. Player can exit basement left edge to bedroom
2. Player spawns in bedroom at x=1100 (entered from right)
3. Round trip works: bedroom→basement→bedroom
4. No regression on other exits (basement→living_room_dawn, bedroom→kitchen, etc.)
5. Fix does not mask the issue by disabling isTransitioning guard entirely
