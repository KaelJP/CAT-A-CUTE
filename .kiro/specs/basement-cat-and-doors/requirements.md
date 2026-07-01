# Requirements — Basement Cat & Door Fixes

## REQ-1: Cat companion is stationary in basement

**Root cause:** The basement sets `catInitialState: 'running'` with `catRunTargetX: 500`. The CatSystem's `update()` moves the cat to x=500 while in `running` state, but once it arrives (distance < 10px), the cat stops moving and **never transitions out of `running` state**. Meanwhile, `updateCatWarning()` in GameScene has an early return when cat state is `running` — so nothing ever changes the state back to `walking` or `idle`.

Result: cat is permanently frozen at x=500 in `running` state for the entire basement visit.

### Acceptance Criteria:
1. After the cat reaches its `runTargetX` (showing the safe path), it transitions to `idle` or `walking` state
2. Once in `walking`/`idle`, the cat resumes normal follow behavior (trails ahead of the player)
3. This fix must not regress cat behavior in other rooms (no other room uses `running` state, so risk is low)
4. The cat should reach its target before switching — not skip the running animation

---

## REQ-2: Missing exit door in basement

**Current state:** The basement already has TWO edge-based exits in `roomData.exits`:
- x=50, left → bedroom
- x=1150, right → living_room_dawn

These work via `checkRoomEdgeExit()` (player walks to edge → triggers transition). There are no visible door interactable sprites though, unlike rooms like living_room/hallway which have `type: 'door'` interactables with sprites.

### Acceptance Criteria:
1. Add a visible door sprite at the left edge (x=80) of the basement, matching the existing `door_closed` visual style used in other rooms
2. The door should be cosmetic only (the edge-exit trigger handles the actual transition) — OR it should be an interactable door that triggers the same transition
3. Keep the existing edge-exit at x=50 functional (so the door is just a visual indicator, not a replacement)

---

## REQ-3: Door entry/exit pairing

**Current state:** The `checkRoomEdgeExit` system already handles direction-based spawn points:
```js
const entryX = exit.direction === 'right' ? 120 : 1100;
```

This means: if you exit through a RIGHT-side exit, you enter the next room at x=120 (left side). If you exit through a LEFT-side exit, you enter at x=1100 (right side). This correctly pairs entries/exits for a linear room chain.

**Assessment:** The pairing already works correctly for the bedroom↔basement connection:
- Bedroom exit right (x=1150) → basement spawns at x=120 (left side) ✓
- Basement exit left (x=50) → bedroom spawns at x=1100 (right side) ✓

No fix needed for pairing logic — it's already correct. The user's "stuck" issue was the camera fade bug (already fixed) and the cat issue (REQ-1).

### Acceptance Criteria:
1. Verify round trip: bedroom → basement → bedroom spawns correctly at x=1100
2. Verify reverse: basement → bedroom → basement spawns correctly at x=120
3. No changes to the existing direction-based spawn logic needed
