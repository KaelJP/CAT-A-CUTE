# Requirements — Battery System Fixes (v2)

## REQ-1: Bug Fix — Basement Battery Drain

### 1a) Battery drains on entry/movement
**Root cause:** The basement horror event trigger `base_dark` (x:200, width:400) fires a `forceOff` event type when the player moves past x=200. `LightSystem.forceOff()` sets `battery = 0` AND `isOn = false`. This is the same function that was previously called by `forcedarknessOnEnter` (already fixed), but the horror event trigger is a separate code path that still calls it.

**Fix:** Change the `base_dark` horror event from type `forceOff` to a new event type that only turns off the flashlight (`isOn = false`) without zeroing the battery. The player should still have their battery charge — they just need to toggle the flashlight back on.

### Acceptance Criteria:
1. Entering basement with battery=100 does NOT reduce battery
2. Moving in the basement does NOT instantly drain battery to 0
3. The `base_dark` trigger still turns off the flashlight (room goes dark) — but the player can toggle it back on
4. Battery drains normally over time (5/sec) when flashlight is on — same rate as all other rooms

---

## REQ-2: Battery Sprite Disappears On Pickup

### Acceptance Criteria:
1. World battery sprite is removed from the scene immediately on pickup
2. Already-collected batteries do not reappear on room re-entry
3. Already-collected batteries do not reappear after save/load
4. Tracking is per battery instance key (e.g. `hallway_battery`), not a global count

---

## REQ-3: Missing/Broken Image References

### Acceptance Criteria:
1. All image keys loaded in BootScene point to existing files
2. Any dead-code references are removed
3. Any still-needed but missing images are reported (not fabricated)

---

## REQ-4: Battery State Persistence On Save/Continue

### Acceptance Criteria:
1. Battery level is restored exactly from save
2. Collected battery pickup keys are restored from save (via inventory)
3. No room-specific logic re-zeroes battery on load (forcedarknessOnEnter + base_dark both guarded)
