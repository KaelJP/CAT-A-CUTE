# CAT-A-CUTE — Implementation Plan

## 1. Game Overview

**CAT-A-CUTE** is a 2D side-scrolling psychological horror game built with JavaScript and Phaser 3. Inspired by Limbo and Filipino superstition, the game features a dark monochrome art style, silhouette visuals, limited lighting, and atmospheric horror.

**Premise:** A mysterious black cat appears during a stormy night. Paranormal events follow — lights flicker, shadows move, whispers echo. The player believes the cat is the source of danger. The twist: the cat is actually a protector, warning the player of spirits that lurk in the darkness.

**Target:** Single-level experience (5–6 connected rooms), ~15–20 minutes of gameplay, manageable scope for a solo student developer.

---

## 2. Core Features

- Side-scrolling exploration with limited visibility (flashlight/lantern mechanic)
- Cat Warning System — the cat's behavior signals nearby danger
- Scripted Horror Event System — paranormal encounters triggered by zones, puzzles, and progression
- Environmental puzzle-solving (light switches, locked doors, item-based)
- Psychological horror through atmosphere, sound, and visual distortion
- Limited but impactful jumpscares at key story moments
- Narrative twist that reframes the entire experience

---

## 3. Gameplay Mechanics

### 3.1 Player Movement
- Arrow keys: Move left/right
- Automatic walking animation (idle when still)
- Player sprite changes to `player_scared` when ghost is near

### 3.2 Flashlight / Light System
- SPACE: Toggle flashlight on/off
- Flashlight creates a circular light mask — everything outside is dark
- Battery drains while flashlight is on (~20 seconds of continuous use)
- Battery does NOT recharge passively
- Recharge ONLY at wall light switches (press E near switch)
- At 0% battery: total darkness until a switch is found
- Light repels the ghost — ghost cannot approach while light is active

### 3.3 Interaction System
- E key: Interact with objects (doors, light switches, items)
- Proximity-based: must be within range of the object
- Visual prompt appears when near an interactable ("Press E")

### 3.4 Cat Warning System
The cat is an AI companion that follows the player and signals danger through behavior:

| Cat State | Meaning | Player Action |
|-----------|---------|---------------|
| `cat_idle` | Safe — no danger nearby | Explore freely |
| `cat_hissing` | Ghost is in this room | Be cautious, conserve light |
| `cat_defending` | Ghost is VERY close | Turn on flashlight immediately |
| Cat stops moving | Danger ahead — don't proceed | Wait or find alternate path |
| Cat runs ahead | Safe path — follow it | Move in cat's direction |

### 3.5 Scripted Horror Event System
Instead of complex ghost AI, paranormal events are triggered by:
- Entering specific zones (trigger areas)
- Solving or interacting with puzzles
- Story progression checkpoints
- Random timed events (to maintain tension)

Event types:
- Lights flicker and die
- Whispering audio plays
- Shadow moves across background
- Ghost briefly manifests (ghost_stage0–2 flash)
- Environmental change (furniture moves, doors slam)
- Full jumpscare (ghost_stage3 + sound + screen shake)

### 3.6 Puzzle System
Simple environmental puzzles per room:
- Find a key/item to unlock next door
- Flip switches in correct order
- Push objects to create a path
- Survive a timed darkness event (battery dies, must navigate to switch)

---

## 4. Story Flow

### Act 1 — Setup (Rooms 1–2)
- Stormy night. Player is home alone.
- A black cat appears at the door. Player lets it in.
- Mang Berto (neighbor) appears at window: "That cat is bad luck. Get rid of it."
- Strange things begin — shadows flicker, whispers start.
- Player assumes the cat brought the evil.

### Act 2 — Escalation (Rooms 3–4)
- Paranormal events intensify. Ghost manifestations increase.
- Cat becomes more agitated — hissing, blocking paths, acting erratic.
- Mang Berto appears again: "I told you. The cat led them here."
- Player may doubt the cat (optional: shoo mechanic removes cat temporarily).
- Without the cat, ghost encounters become more dangerous (no warning).

### Act 3 — Truth (Rooms 5–6)
- Player discovers evidence (notes, photos) that reveal the truth:
  - The spirits were already in the house
  - The cat appeared BECAUSE of the spirits — to protect
  - Mang Berto's superstition was wrong
- Final room: Ghost manifests fully. Cat stands between player and ghost.
- Cat defends player. Dawn breaks. Spirits vanish.
- Ending: Morning light. Cat sits calmly. Player is safe.

---

## 5. Level Design

### Room Layout (Single Level — 6 Connected Rooms)

```
[Living Room] → [Hallway] → [Kitchen] → [Bedroom] → [Basement] → [Living Room (Return)]
```

| Room | Theme | Puzzle | Horror Event | Cat Behavior |
|------|-------|--------|--------------|--------------|
| 1. Living Room | Introduction | None (tutorial) | Shadow flicker | Cat appears, idle |
| 2. Hallway | First tension | Find key for kitchen door | Whispers, lights die | Cat hisses at hallway end |
| 3. Kitchen | Escalation | Fix fuse box (flip switches) | Ghost stage 0–1 flash | Cat blocks wrong switch |
| 4. Bedroom | Peak horror | Find item in closet | Jumpscare + slam doors | Cat defending at closet |
| 5. Basement | Climax | Navigate in total dark | Ghost stage 2 chase scare | Cat runs to show safe path |
| 6. Living Room (dawn) | Resolution | Survive until timer | Final ghost vs cat | Cat calm, sunrise |

### Room Dimensions
- Each room: 1200×600 px (camera follows player, pans within room)
- Game canvas: 800×600 px (viewport)
- Total scrollable area per room: 1200 wide

---

## 6. Technical Architecture

### Engine & Tools
- **Engine:** Phaser 3.60+ (CDN)
- **Language:** JavaScript (ES Modules)
- **Server:** Python http.server or `npx serve` for local development
- **Art Style:** Dark, monochrome, silhouette-based
- **Target Resolution:** 800×600 with Phaser Scale.FIT

### Core Architecture Pattern
- Scene-based structure (Phaser scenes for each game state)
- System classes for reusable logic (PlayerSystem, CatSystem, HorrorEventSystem)
- Data-driven events (JSON/JS config files define horror triggers per room)
- State machine for cat behavior

### Scene Graph
```
BootScene → MenuScene → IntroScene → GameScene (Room 1–6) → WinScene
                                         ↓
                                    GameOverScene
```

GameScene handles all 6 rooms internally using room transition logic (no separate scene per room).

---

## 7. Folder Structure

```
CAT-A-CUTE/
├── index.html
├── package.json
├── assets/
│   ├── images/
│   │   ├── player/
│   │   │   ├── player_idle.png
│   │   │   ├── player_walk1.png
│   │   │   ├── player_walk2.png
│   │   │   ├── player_scared.png
│   │   │   ├── player_defeated.png
│   │   │   └── player_relieved.png
│   │   ├── cat/
│   │   │   ├── cat_idle.png
│   │   │   ├── cat_walk1.png
│   │   │   ├── cat_walk2.png
│   │   │   ├── cat_hissing.png
│   │   │   ├── cat_defending.png
│   │   │   ├── cat_calm.png
│   │   │   └── cat_scared.png
│   │   ├── ghost/
│   │   │   ├── ghost_stage0.png
│   │   │   ├── ghost_stage1.png
│   │   │   ├── ghost_stage2.png
│   │   │   └── ghost_stage3.png
│   │   ├── berto/
│   │   │   ├── berto_talking.png
│   │   │   └── berto_worried.png
│   │   ├── rooms/
│   │   │   ├── room_living.png
│   │   │   ├── room_hallway.png
│   │   │   ├── room_kitchen.png
│   │   │   ├── room_bedroom.png
│   │   │   ├── room_basement.png
│   │   │   └── room_living_daylight.png
│   │   ├── objects/
│   │   │   ├── door_closed.png
│   │   │   ├── door_open.png
│   │   │   └── light_switch.png
│   │   ├── intro/
│   │   │   ├── intro_rain_window.png
│   │   │   ├── intro_cat_silhouette.png
│   │   │   └── intro_eyes.png
│   │   └── ui/
│   │       └── (battery icon, interaction prompts)
│   └── audio/
│       ├── ambient_loop.mp3
│       ├── rain_thunder.mp3
│       ├── footstep.mp3
│       ├── light_click.mp3
│       ├── cat_hiss.mp3
│       ├── ghost_whisper.mp3
│       ├── jumpscare_sound.mp3
│       ├── stage_stinger.mp3
│       ├── reveal_stinger.mp3
│       ├── win_jingle.mp3
│       ├── door_creak.mp3
│       └── switch_click.mp3
├── src/
│   ├── main.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   ├── IntroScene.js
│   │   ├── GameScene.js
│   │   ├── GameOverScene.js
│   │   └── WinScene.js
│   ├── systems/
│   │   ├── PlayerSystem.js
│   │   ├── CatSystem.js
│   │   ├── LightSystem.js
│   │   ├── HorrorEventSystem.js
│   │   ├── PuzzleSystem.js
│   │   └── DialogueBox.js
│   └── data/
│       ├── roomData.js
│       ├── horrorEvents.js
│       └── dialogueData.js
└── scripts/
    └── create_placeholders.cjs
```

---

## 8. Development Phases

### Phase 1 — Foundation (Week 1)
- [x] Project setup (index.html, Phaser config, scene graph)
- [ ] Player movement system (walk left/right, idle, animations)
- [ ] Camera follow + room scrolling
- [ ] Basic room rendering (single room with background)
- [ ] Room transition system (walk to edge → load next room)

### Phase 2 — Core Mechanics (Week 2)
- [ ] Light System (flashlight toggle, circular mask, battery drain)
- [ ] Light switch interaction (recharge battery)
- [ ] Door interaction system (locked/unlocked, open animation)
- [ ] Basic physics (ground collision, room boundaries)

### Phase 3 — Cat System (Week 3)
- [ ] Cat AI companion (follows player with slight delay)
- [ ] Cat state machine (idle → hissing → defending → running)
- [ ] Cat behavior triggers based on room data
- [ ] Cat walk animation

### Phase 4 — Horror Event System (Week 4)
- [ ] Trigger zone system (invisible rectangles that fire events)
- [ ] Event types: light flicker, whisper audio, shadow movement
- [ ] Ghost manifestation (brief sprite flash + fade)
- [ ] Jumpscare system (fullscreen image + shake + sound)
- [ ] Random ambient events (timed flickers to maintain tension)

### Phase 5 — Puzzles & Progression (Week 5)
- [ ] Room-specific puzzles (key items, switch sequences)
- [ ] Inventory system (simple — pick up item, use at door)
- [ ] Story progression tracking (which rooms completed)
- [ ] Mang Berto dialogue appearances

### Phase 6 — Narrative & Polish (Week 6)
- [ ] Intro cutscene (story slides)
- [ ] Dialogue system (text boxes for story beats)
- [ ] Win sequence (dawn, cat calm, twist reveal)
- [ ] Game Over sequence (jumpscare, death screen, restart)
- [ ] Scene transitions (fades between all states)

### Phase 7 — Audio & Atmosphere (Week 7)
- [ ] Ambient audio per room
- [ ] Footstep sounds (tied to movement)
- [ ] Cat hiss sound trigger
- [ ] Ghost whisper proximity audio
- [ ] Jumpscare sound effects
- [ ] Music transitions (tension → calm → horror)

### Phase 8 — Testing & Final Polish (Week 8)
- [ ] Full playthrough testing (win path + lose path)
- [ ] Balance: battery drain rate, event timing, cat behavior tuning
- [ ] Bug fixes and edge cases
- [ ] Performance optimization
- [ ] Final art pass (replace any placeholder assets)

---

## 9. Asset Requirements

### Sprites (Transparent PNG)

**Player (6 sprites)**
| File | Size | Notes |
|------|------|-------|
| player_idle.png | ~64×128 | Standing, side view |
| player_walk1.png | ~64×128 | Walk cycle frame 1 |
| player_walk2.png | ~64×128 | Walk cycle frame 2 |
| player_scared.png | ~64×128 | Scared reaction pose |
| player_defeated.png | ~64×128 | Death/collapse pose |
| player_relieved.png | ~64×128 | Win scene — relieved |

**Cat (7 sprites)**
| File | Size | Notes |
|------|------|-------|
| cat_idle.png | ~48×32 | Sitting, neutral |
| cat_walk1.png | ~48×32 | Walk frame 1 |
| cat_walk2.png | ~48×32 | Walk frame 2 |
| cat_hissing.png | ~48×32 | Arched back, hissing |
| cat_defending.png | ~48×32 | Blocking stance |
| cat_calm.png | ~48×32 | Relaxed, win scene |
| cat_scared.png | ~48×32 | Startled, game over |

**Ghost (4 sprites)**
| File | Size | Notes |
|------|------|-------|
| ghost_stage0.png | ~80×160 | Faint shadow, barely visible |
| ghost_stage1.png | ~120×200 | Partial form |
| ghost_stage2.png | ~200×300 | Full apparition |
| ghost_stage3.png | ~400×500 | Jumpscare — fills screen |

**Mang Berto (2 sprites)**
| File | Size | Notes |
|------|------|-------|
| berto_talking.png | ~64×128 | At window, talking |
| berto_worried.png | ~64×128 | Worried expression |

**Shadow Entity (1 sprite)**
| File | Size | Notes |
|------|------|-------|
| shadow_watching.png | ~100×200 | Dark shape, edges only |

### Backgrounds (6 images — 1200×600 px)
| File | Description |
|------|-------------|
| room_living.png | Living room, dark, furniture silhouettes |
| room_hallway.png | Long hallway, doors on sides |
| room_kitchen.png | Kitchen, cabinets, faint fridge glow |
| room_bedroom.png | Bed, closet, window |
| room_basement.png | Pipes, stairs, darkest room |
| room_living_daylight.png | Same living room in morning light |

### Objects (3 sprites)
| File | Size | Notes |
|------|------|-------|
| door_closed.png | ~48×128 | Closed door |
| door_open.png | ~48×128 | Open door |
| light_switch.png | ~16×24 | Wall-mounted switch |

### Intro Panels (3 images — 560×300 px)
| File | Description |
|------|-------------|
| intro_rain_window.png | Rainy window — setting |
| intro_cat_silhouette.png | Cat on porch |
| intro_eyes.png | Glowing eyes in dark |

### Audio (12 files — MP3)
| File | Type | Use |
|------|------|-----|
| ambient_loop.mp3 | Loop | Background tension |
| rain_thunder.mp3 | Loop | Intro scene |
| footstep.mp3 | SFX | Player movement |
| light_click.mp3 | SFX | Flashlight toggle |
| cat_hiss.mp3 | SFX | Cat warning |
| ghost_whisper.mp3 | SFX | Ghost proximity |
| jumpscare_sound.mp3 | SFX | Death scare |
| stage_stinger.mp3 | SFX | Room transition |
| reveal_stinger.mp3 | SFX | Ghost near-miss |
| win_jingle.mp3 | Music | Win/morning |
| door_creak.mp3 | SFX | Door opening |
| switch_click.mp3 | SFX | Light switch use |

---

## 10. Core Systems — Technical Design

### 10.1 Player System (`src/systems/PlayerSystem.js`)

```javascript
class PlayerSystem {
  // Properties
  sprite          // Phaser.Physics.Arcade.Sprite
  speed = 160     // pixels per second
  isScared        // boolean — triggered by cat state
  canMove         // boolean — locked during events/cutscenes

  // Methods
  create(scene, x, y)       // Create player sprite, animations, physics
  update(cursors)           // Handle movement input, update animation
  setScared(value)          // Switch to scared sprite
  lock()                    // Disable movement (during events)
  unlock()                  // Re-enable movement
  getPosition()             // Return {x, y} for other systems
}
```

### 10.2 Cat System (`src/systems/CatSystem.js`)

```javascript
class CatSystem {
  // Properties
  sprite          // Phaser.Physics.Arcade.Sprite
  state           // 'idle' | 'walking' | 'hissing' | 'defending' | 'running'
  followTarget    // Reference to player sprite
  followDistance  // How far behind cat stays (120px)
  followSpeed     // Slightly slower than player (140)

  // Methods
  create(scene, x, y)           // Create cat sprite + animations
  update(playerX, playerY)      // Follow logic + state-based behavior
  setState(newState)            // Change cat behavior + sprite
  hiss()                        // Trigger hiss state + sound
  defend()                      // Block between player and threat
  runTo(x)                      // Run to safe position
  getState()                    // Return current state for other systems
}
```

**Cat Follow Logic:**
- Cat trails behind player by `followDistance` pixels
- When player stops, cat catches up then sits (idle)
- Cat never blocks player movement
- Cat speed slightly slower → creates natural lag

### 10.3 Light System (`src/systems/LightSystem.js`)

```javascript
class LightSystem {
  // Properties
  battery         // Float 0–100
  isOn            // Boolean
  drainRate = 5   // Units per second when on
  lightMask       // Phaser graphics object (circular gradient)
  radius = 150    // Light radius in pixels

  // Methods
  create(scene)               // Create light mask overlay
  update(dt, playerX, playerY) // Drain battery, update mask position
  toggle()                    // Turn flashlight on/off
  recharge(amount)            // Add battery from light switch
  forceOff()                  // Kill light (horror event)
  flicker(duration)           // Brief on/off flicker effect
  isActive()                  // Return isOn state
  getBattery()                // Return current battery level
}
```

**Light Mask Implementation:**
- Dark overlay covers entire screen (black rectangle, alpha 0.85)
- Circular "hole" follows player position (using Phaser blend modes or mask)
- Radius shrinks as battery gets lower
- At battery 0: overlay is fully opaque

### 10.4 Horror Event System (`src/systems/HorrorEventSystem.js`)

```javascript
class HorrorEventSystem {
  // Properties
  scene           // Reference to GameScene
  eventQueue      // Array of pending events
  activeEvent     // Currently playing event (or null)
  triggers        // Array of trigger zones for current room

  // Methods
  create(scene)                   // Initialize system
  loadRoomEvents(roomId)          // Load triggers for a specific room
  update(playerX)                 // Check if player entered trigger zone
  fireEvent(eventConfig)          // Execute a horror event
  flickerLights(duration)         // Light flicker effect
  playWhisper()                   // Ghost whisper audio
  moveShadow(fromX, toX)         // Animate shadow across background
  flashGhost(stage, x, y, dur)   // Brief ghost appearance
  jumpscare(ghostStage)          // Full jumpscare sequence
  randomAmbientEvent()           // Timed random tension events
}
```

**Event Config Format (from `src/data/horrorEvents.js`):**
```javascript
{
  roomId: 'hallway',
  triggers: [
    {
      x: 400,               // Trigger position
      width: 50,            // Trigger zone width
      once: true,           // Only fires once
      event: {
        type: 'flicker',    // Event type
        duration: 2000,     // How long
        then: 'whisper'     // Chain another event after
      }
    }
  ],
  ambient: [
    { type: 'shadow', interval: [15000, 30000] }  // Random ambient
  ]
}
```

### 10.5 Puzzle System (`src/systems/PuzzleSystem.js`)

```javascript
class PuzzleSystem {
  // Properties
  inventory       // Array of collected item keys
  puzzleStates    // Object tracking puzzle completion per room
  interactables   // Array of interactive objects in current room

  // Methods
  create(scene)                       // Initialize
  loadRoom(roomId, objects)           // Set up interactables for room
  interact(objectKey)                 // Player presses E near object
  addItem(itemKey)                    // Pick up item
  hasItem(itemKey)                    // Check inventory
  useItem(itemKey, targetKey)         // Use item on target
  isPuzzleSolved(puzzleId)           // Check if room puzzle is done
  getInteractableNear(playerX, range) // Find nearest interactable
}
```

---

## 11. Timeline / Milestones

| Milestone | Deliverable | Target |
|-----------|-------------|--------|
| M1 — Walking Demo | Player moves through 1 room, camera follows | Week 1 |
| M2 — Light & Interaction | Flashlight works, can interact with switches | Week 2 |
| M3 — Cat Companion | Cat follows, has state-based behavior | Week 3 |
| M4 — First Scare | One room with working horror events | Week 4 |
| M5 — Full Level | All 6 rooms connected, puzzles functional | Week 5 |
| M6 — Story Complete | Intro, dialogue, win/lose sequences work | Week 6 |
| M7 — Audio Pass | All sounds integrated, atmosphere complete | Week 7 |
| M8 — Release | Fully tested, polished, playable build | Week 8 |

### Minimum Viable Product (MVP) — Week 4
At milestone M4, you should have a playable demo with:
- Player walking in 2–3 rooms
- Flashlight with battery
- Cat following with at least hiss state
- One horror event triggering
- One door transition

This is enough for a playtest / feedback session.

---

## 12. Possible Future Improvements

- **Multiple endings:** Different outcomes based on player choices (keep cat vs shoo cat)
- **Difficulty modes:** Faster battery drain, more aggressive ghost timing
- **Expanded house:** More rooms, branching paths, backtracking
- **Collectibles:** Hidden lore notes that reveal backstory
- **New Game+:** Second playthrough with cat dialogue subtitles (reveals what cat was thinking)
- **Mobile support:** Touch controls, tap to interact
- **Localization:** Filipino/Tagalog dialogue option
- **Achievements:** "Survived without using flashlight", "Never shooed the cat"
- **Sound design pass:** Binaural audio for headphone users
- **Speedrun timer:** For replayability

---

## 13. Design Principles

1. **Horror through absence** — What you CAN'T see is scarier than what you can
2. **Trust the cat** — The core emotional arc is learning to trust despite superstition
3. **Less is more** — Few jumpscares, maximum buildup. Silence is your weapon.
4. **Player agency matters** — Let the player make mistakes (ignore cat, waste battery)
5. **Sound first** — Audio carries 70% of the horror. Invest in sound design.
6. **Scope over polish** — Finish all rooms before perfecting any single room

---

## 14. Quick Reference — File Naming Convention

All assets use lowercase with underscores:
- Sprites: `[character]_[state].png` (e.g., `cat_hissing.png`)
- Rooms: `room_[name].png` (e.g., `room_hallway.png`)
- Audio: `[description].mp3` (e.g., `ghost_whisper.mp3`)
- Data: `[system]Data.js` (e.g., `horrorEvents.js`)
- Systems: `[Name]System.js` (e.g., `CatSystem.js`)

---

*Document Version: 2.0*
*Last Updated: June 2026*
*Engine: Phaser 3.60+ | Language: JavaScript (ES Modules)*
