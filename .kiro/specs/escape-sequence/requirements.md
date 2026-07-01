# Requirements — Escape Sequence

## Overview
When the player picks up a specific key item in the basement, an escape sequence begins. The ghost becomes more aggressive, and the player must retrace their path back to the starting room (living_room) to win.

## REQ-1: Escape Trigger

**Trigger:** Player picks up the "Crumpled Note" (`truth_note_obj`) in the basement — this is the existing item that reveals the truth about the cat.

### Acceptance Criteria:
1. Picking up this item sets `escapeSequenceActive = true` in the game state
2. This flag persists through room transitions (passed in transition data)
3. This flag persists through save/load (included in save schema)
4. The flag is one-way (never resets to false during a playthrough)

---

## REQ-2: Ghost Behavior Change During Escape

**Current ghost behavior:** Trigger-based flash appearances (scripted, position-specific, one-shot). No persistent pursuing entity.

**Desired escape behavior (NEEDS CONFIRMATION):**

⚠️ **Questions for you before implementing:**
1. Should the ghost become a **persistent sprite that follows the player** across rooms (new behavior), or should existing flash-ghost triggers just fire more frequently/intensely?
2. If persistent pursuer: what speed? (Player moves at 160px/s — should ghost be slower at ~100px/s giving the player time, or nearly matching at ~140px/s for tension?)
3. Should the ghost appear in EVERY room during escape, or only rooms the player has already passed through?
4. What happens if the ghost catches the player? Instant jumpscare/game over, or sanity damage?

---

## REQ-3: Retrace Path

### Acceptance Criteria:
1. Player uses existing door system to navigate: basement → bedroom → kitchen → hallway → living_room
2. No new movement mechanic
3. Doors remain functional during escape (no lock-outs)

---

## REQ-4: Ending Trigger

**Current state:** The game already has `living_room_dawn` as a separate final room with `isFinalRoom: true`, a daylight background, and a 30-second timer to WinScene.

**Proposed change:** When `escapeSequenceActive` is true and the player reaches `living_room`, transition to `living_room_dawn` automatically (or change the living_room background to the dawn version).

⚠️ **Questions for you before implementing:**
1. Should reaching living_room during escape immediately trigger the dawn transition + win? Or should there be a final confrontation (ghost vs cat)?
2. The game already has `room_living_daylight` background and `living_room_dawn` room. Should I reuse that room, or apply the dawn effect to the regular `living_room`?
3. After dawn: go straight to WinScene? Or keep the current 30-second timer in living_room_dawn?
