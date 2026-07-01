# Design — Battery System Fixes (v2)

## Root Cause Analysis: Basement Battery Drain

### Two code paths zero the battery in the basement:

**Path 1 (FIXED):** `GameScene.create()` → `forcedarknessOnEnter` block
- Previously called `this.lightSystem.forceOff()` which zeroed battery
- Already fixed: now only sets `roomLightOn = false`

**Path 2 (BUG — STILL ACTIVE):** Horror event trigger `base_dark`
- Location: `src/data/horrorEvents.js`, basement triggers
- Config: `{ id: 'base_dark', x: 200, width: 400, once: true, event: { type: 'forceOff' } }`
- The player starts at x=120. Moving right past x=200 fires this trigger
- `HorrorEventSystem.fireEvent()` → `case 'forceOff': this.lightSystem.forceOff()`
- `LightSystem.forceOff()` sets `battery = 0` AND `isOn = false`

**Result:** Player enters basement with full battery, moves slightly right, battery instantly drops to 0.

### Fix for Path 2:
Change the `base_dark` event type from `'forceOff'` to `'turnOff'` — a new lightweight event type that only sets `isOn = false` (flashlight goes dark, player must toggle it back on) WITHOUT zeroing the battery.

Alternatively, just change the existing trigger's event to `{ type: 'flicker', duration: 1000 }` which already exists and creates atmosphere without destroying battery. But this changes the design intent.

**Chosen approach:** Add `case 'turnOff'` to HorrorEventSystem that calls `this.lightSystem.isOn = false` only. This preserves the "sudden darkness" design intent without the battery-zeroing bug.

---

## Battery Pickup Sprite Removal

Already implemented in the previous fix:
- `PuzzleSystem.interact()` → `case 'battery'` removes sprite and adds to inventory
- `PuzzleSystem.loadRoom()` → checks `this.inventory.includes(inter.key)` and skips rendering

**Verification needed:** Confirm the battery sprite object (`inter.sprite`) is destroyed on pickup, not just hidden.

---

## Missing Image References

**Scan result:** All 35 image paths in BootScene point to existing files. No broken references found.

---

## Save/Load Persistence

Already handled:
- `saveGame()` serializes `battery`, `flashlightIsOn`, and `inventory` (which includes collected battery keys)
- `create()` restores these via `savedBattery`, `savedFlashlightIsOn`, and `savedInventory`
- `forcedarknessOnEnter` is guarded by `!this.loadedFromSave`

**Gap:** The `base_dark` horror trigger is `once: true` but `firedTriggers` is only persisted on room transition (not on save). If player saves after trigger fires, then loads, the trigger will re-fire.

**Fix:** Already handled — `firedTriggers` is included in `transitionToRoom()` data AND should be in `saveGame()`.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/data/horrorEvents.js` | Change `base_dark` event type from `'forceOff'` to `'turnOff'` |
| `src/systems/HorrorEventSystem.js` | Add `case 'turnOff'` handler |
| `src/scenes/GameScene.js` | Add `firedTriggers` to `saveGame()` data |
| `src/systems/PuzzleSystem.js` | Verify battery sprite destroy on pickup (already done) |
