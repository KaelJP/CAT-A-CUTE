# Design — Escape Sequence

## Current Architecture

### Ghost System
The ghost is NOT a persistent entity. It's an event-based system:
- `HorrorEventSystem` fires scripted events (flicker, whisper, shadow, flash_ghost, jumpscare) based on trigger zones
- `flash_ghost` creates a temporary sprite that fades in/out at a fixed position
- `activeGhost` is only set during a flash event (brief, not a pursuing entity)
- Ghost damage is proximity-based during active flash only

### Room Flow
```
living_room → hallway → kitchen → bedroom → basement → living_room_dawn (win)
```

### Save System
`GameScene.saveGame()` serializes: roomId, inventory, puzzleStates, playerStartX, fuseBoxSolved, battery, flashlightIsOn, sanity, firedTriggers.

---

## Proposed Implementation (pending your answers)

### Option A: Ambient Intensity Increase (simpler)
- During escape, ambient horror events fire 3x more frequently
- Flash ghosts last longer and deal more damage
- Ghost whispers play continuously
- Lights flicker randomly every 5-8 seconds
- No persistent pursuing sprite

### Option B: Persistent Pursuer (more complex, scarier)
- Create a ghost sprite that spawns in the current room and moves toward the player
- Ghost appears ~400px behind the player and advances at a configurable speed
- Ghost is visible through darkness (high depth, self-lit)
- If ghost reaches player → jumpscare → game over
- Cat defending state blocks the ghost temporarily (5 seconds)
- Ghost persists across room transitions (spawns at room entry edge after a delay)

---

## State Management

```js
// In GameScene (passed through transitions + save)
this.escapeSequenceActive = data?.escapeSequenceActive ?? false;

// In saveGame()
saveData.escapeSequenceActive = this.escapeSequenceActive;
```

---

## Ending Logic

When `escapeSequenceActive === true` and `currentRoomId === 'living_room'`:
- Transition to `living_room_dawn` room (existing) OR
- Swap background to `room_living_daylight` in the current room

Existing `living_room_dawn` already handles the win (30s timer → WinScene).

---

## Files to Modify (estimated)

| File | Change |
|------|--------|
| `src/scenes/GameScene.js` | Add `escapeSequenceActive` state, pass through transitions + save |
| `src/systems/HorrorEventSystem.js` | Add escape-mode behavior (Option A or B) |
| `src/data/horrorEvents.js` | Possibly add escape-specific event configs |
| `src/systems/PuzzleSystem.js` | Trigger escape on truth_note pickup |
| `src/scenes/MenuScene.js` | Pass escapeSequenceActive on continue |

---

## ⚠️ BLOCKED: Awaiting your answers on:
1. Ghost behavior model (Option A ambient vs Option B pursuer)
2. Ghost speed/aggression numbers
3. Dawn transition approach
4. Post-dawn behavior (immediate win, timer, final confrontation)
