# Design — Basement Cat & Door Fixes

## Fix 1: Cat stuck in running state

### The bug in CatSystem.update():
```js
if (this.state === 'running') {
  const runTarget = this.runTargetX ?? playerX + 150;
  const runDist = runTarget - this.sprite.x;
  if (Math.abs(runDist) > 10) {
    this.sprite.x += (runDist > 0 ? 1 : -1) * 250 * (delta / 1000);
  }
  // ← MISSING: transition out of running when target reached
}
```

### Fix:
Add transition to `idle` state when the cat reaches its target:
```js
if (this.state === 'running') {
  const runTarget = this.runTargetX ?? playerX + 150;
  const runDist = runTarget - this.sprite.x;
  if (Math.abs(runDist) > 10) {
    this.sprite.x += (runDist > 0 ? 1 : -1) * 250 * (delta / 1000);
  } else {
    // Reached target — resume normal follow behavior
    this.state = 'idle';
    this.runTargetX = null;
  }
}
```

After this, `updateCatWarning()` in GameScene will no longer early-return (since state is no longer `running`), and normal proximity-based warning logic + follow behavior resumes.

### File: `src/systems/CatSystem.js`

---

## Fix 2: Add visible door to basement

Add a door interactable to the basement's `interactables` array:
```js
{
  key: 'basement_exit_door',
  type: 'door',
  x: 80,
  y: 530,
  spriteKey: 'door_closed',
  requiresItem: null,
  leadsTo: 'bedroom',
  doorWidth: 180,
  doorHeight: 360,
  range: 130,
}
```

### File: `src/data/roomData.js`

---

## Fix 3: Door pairing verification

No code change needed — already works via direction-based entryX calculation. Just verify in testing.

---

## Files to Modify

| File | Change |
|------|--------|
| `src/systems/CatSystem.js` | Add idle transition when running cat reaches target |
| `src/data/roomData.js` | Add door interactable to basement |
