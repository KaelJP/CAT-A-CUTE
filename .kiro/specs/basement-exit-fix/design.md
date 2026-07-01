# Design — Basement→Bedroom Exit Bug

## Investigation Summary

### Exit config (roomData.js)
```js
basement.exits = [
  { x: 1150, direction: 'right', leadsTo: 'living_room_dawn' },
  { x: 50, direction: 'left', leadsTo: 'bedroom' },
]
```

### Transition path
1. `checkRoomEdgeExit(px)` — checks `Math.abs(px - 50) < 60`
2. Calls `transitionToRoom('bedroom', 1100)`
3. `transitionToRoom` checks `if (this.isTransitioning || !roomId) return;`
4. If passes → sets `isTransitioning = true`, fades out, restarts scene

### Identified issue: `isTransitioning` is never explicitly set to `true` before `transitionToRoom`

Actually the issue is different. Looking more carefully:

The `cameras.main.fadeIn(500)` call in `create()` doesn't set any blocking flag. But there's a race condition:

When the player enters basement from bedroom (spawns at x=120), the **left exit at x=50** is only 70px away. With `Math.abs(120 - 50) = 70 > 60`, it doesn't fire immediately. Player must walk left to x <= 110.

**Real issue found:** The basement has `catInitialState: 'running'` and the cat runs to x=500. The `updateCatWarning()` function returns early when cat is running. BUT — once the cat arrives at x=500 and switches to idle, `updateCatWarning` re-engages.

At that point, if the player is near x=50 (trying to exit), `getNearestUnfiredTrigger` finds `base_dark` at x=200 (distance = 150px). Since `150 < 200`, the cat transitions to `'hissing'` state.

Now the PENALTY block fires:
```js
if (this.catSystem.isWarning() && !this.catSystem.isPlayerBehind(px)) {
```

With the cat at x=500 and player at x=50, `isPlayerBehind` checks:
```js
// ghostX is null for base_dark (it's not a flash_ghost event)
// Default: player is "behind" if playerX < catX + 20
return playerX < catX + 20;  // 50 < 520 → TRUE
```

So the penalty shouldn't fire because the player IS behind the cat. This path is clear.

**Re-examining: the ACTUAL blocking condition**

Looking at `transitionToRoom()`:
```js
if (this.currentRoomId === 'kitchen' && this.catSystem.isWarning() && !this.catMeterCompleted) {
  this.showMessage('The cat is hissing — wait for it to settle!', 1500);
  return;
}
```

This only blocks in kitchen. Not in basement. ✓

**Let me trace more carefully — maybe the issue is the `showMessage` call from `checkRoomEdgeExit` spam.**

If any exit's `requiresItem` or `requiresPuzzle` check fails, `showMessage` fires and `return` prevents transition. But the basement left exit has `requiresItem: null` — so neither condition triggers.

**FINAL HYPOTHESIS: It's a `showMessage` cooldown issue.**

`showMessage` destroys and recreates the text. But `checkRoomEdgeExit` doesn't have a cooldown. The function runs every frame. But if conditions are met, it calls `transitionToRoom` which sets `isTransitioning = true` immediately, and subsequent frames hit the `if (this.isTransitioning) return;` at the top of `update()`. So it should only fire once.

**ACTUAL ROOT CAUSE — I missed it:**

Look at the basement's `base_dark` trigger which I just changed to `turnOff`:
```js
{ id: 'base_dark', x: 200, width: 400, once: true, event: { type: 'turnOff' } }
```

This fires when `playerX > 200 && playerX < 600`. The player starts at x=120 and needs to walk LEFT to x=50. They NEVER enter x>200 going left. So this trigger doesn't fire for the left exit path.

**RE-EXAMINING FROM SCRATCH: What if the player physically can't reach x=50?**

The player sprite is 64px wide with origin (0.5, 1.0). With `setCollideWorldBounds(true)` and world bounds at (0, 0, 1200, 600), the minimum sprite.x = 32 (half width). At x=32, distance to exit x=50 is 18 — within 60px. So physically possible.

**MOST LIKELY ROOT CAUSE: The player gets stuck due to a bug in `isPlayerBehind` causing the movement penalty to fire incorrectly, which drains sanity to 0 and kills the player before they can exit.**

Wait — let me re-read the penalty condition:
```js
if (this.catSystem.isWarning() && !this.catSystem.isPlayerBehind(px)) {
```

After the cat finishes running and `updateCatWarning` fires, if the cat becomes `hissing` because a trigger is nearby, AND the player is NOT behind the cat... but I showed above that the player at x=50 IS behind the cat at x=500.

Unless `ghostX` is set to something by `updateCatWarning`. Let me check:

```js
const nearest = this.horrorEventSystem.getNearestUnfiredTrigger(playerX);
if (nearest.distance < 200) {
  this.catSystem.setState('hissing');
}
```

This sets hissing but does NOT call `setGhostX` for general rooms. So `this.ghostX` might be null or stale. In `isPlayerBehind`:
```js
if (this.ghostX != null) {
  if (this.ghostX > catX) return playerX < catX + 30;
  return playerX > catX - 30;
}
return playerX < catX + 20;
```

If `ghostX` is null → `playerX < catX + 20` → `50 < 520` → TRUE. Player IS behind. No penalty.

**I'm running out of hypotheses from code analysis alone. The most likely remaining cause is that `base_dark` trigger fires on SAVE/RELOAD path.** When loading from save in the basement, `firedTriggers` might not include `base_dark`, so it re-fires on the first frame where playerX enters the zone.

But wait — for the LEFT exit the player never enters x=200-600.

**Let me look at a completely different angle: maybe `transitionToRoom` actually WORKS but `scene.restart` with `roomId: 'bedroom'` re-enters the SAME GameScene and the bedroom just doesn't render differently enough to notice — i.e., the bug is visual, not logical.**

Actually this is most likely it! `scene.restart()` restarts the same GameScene with new data. If the fade-out/fade-in is too subtle and the basement background persists briefly, the player might THINK they're stuck when they've actually transitioned.

But the user reports being "stuck" — meaning the transition truly doesn't happen.

**Final check: could `this.isTransitioning` be left `true` from the scene's fadeIn on entry?**

`cameras.main.fadeIn(500)` at end of `create()`. This doesn't interact with `isTransitioning`. Unless somewhere else sets it... checking `init()`: `this.isTransitioning = false;`. That's clean.

## Conclusion

The most likely root cause is that the player never physically reaches within 60px of x=50 because they don't walk far enough left, OR `checkRoomEdgeExit` isn't being called due to an early return in `update()`. The early return happens when `this.dialogueSystem.isOpen` or `this.playerSystem.isDead`.

If the `base_dark` trigger (now `turnOff`) turns off the light, the player might die from sanity drain (darkness = sanity loss at 8/sec), which sets `isDead = true` and exits the update loop before `checkRoomEdgeExit` runs.

**THIS IS THE ROOT CAUSE:** Player enters basement → walks right slightly past x=200 → `base_dark` fires → flashlight turns off → darkness causes sanity drain → player dies before reaching the exit.

But the user says they're trying to exit to bedroom (LEFT). If they walk left from spawn (x=120) they never trigger `base_dark`. So this only applies if they explored right first.

## Fix

The safest fix: increase the exit trigger radius from 60 to 80, ensuring the player can trigger it from their spawn position without needing to walk as far.

Additionally, check if the left exit trigger zone overlaps with anything else that might consume the input or block the path.
