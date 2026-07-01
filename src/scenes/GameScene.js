import { ROOMS } from '../data/roomData.js';
import { HORROR_EVENTS } from '../data/horrorEvents.js';
import { MISSIONS } from '../data/missionData.js';
import PlayerSystem from '../systems/PlayerSystem.js';
import CatSystem from '../systems/CatSystem.js';
import LightSystem from '../systems/LightSystem.js';
import HorrorEventSystem from '../systems/HorrorEventSystem.js';
import PuzzleSystem from '../systems/PuzzleSystem.js';
import DialogueSystem from '../systems/DialogueSystem.js';
import MissionSystem from '../systems/MissionSystem.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.currentRoomId = 'living_room';
    this.currentRoom = null;
    this.isTransitioning = false;
    this.ambientMusic = null;
    this.messageText = null;
    this.roomLightOn = false;
    this.fuseBoxSolved = false;
    this.catWarningTimer = null;
    this.catWarningElapsed = 0;
    this.catWarningActive = false;
    this.catMeterCompleted = false;
    this.petCooldown = 0;
    this.cameraWobbleTime = 0;
  }

  init(data) {
    this.currentRoomId = data?.roomId ?? 'living_room';
    this.isTransitioning = false;
    this.fuseBoxSolved = data?.fuseBoxSolved ?? false;

    if (data?.inventory) this.savedInventory = data.inventory;
    if (data?.puzzleStates) this.savedPuzzleStates = data.puzzleStates;
    this.savedStartX = data?.playerStartX ?? null;
    this.savedBattery = data?.battery ?? null;
    this.savedFlashlightIsOn = data?.flashlightIsOn ?? null;
    this.savedSanity = data?.sanity ?? null;
    this.loadedFromSave = data?.loadedFromSave ?? false;
    this.savedFiredTriggers = data?.firedTriggers ?? null;
    this.escapeSequenceActive = data?.escapeSequenceActive ?? false;
    this.roomLightStates = data?.roomLightStates ?? {};
    this.savedCompletedMissions = data?.completedMissions ?? [];
    // Cat hissing gate resets each time the room is (re)entered.
    this.catMeterCompleted = false;
  }

  create() {
    const roomId = this.currentRoomId;
    const roomData = ROOMS[roomId];
    if (!roomData) {
      this.currentRoomId = 'living_room';
      return this.scene.restart({ roomId: 'living_room' });
    }

    this.currentRoomId = roomId;
    this.currentRoom = roomData;
    this.roomData = roomData;
    this.roomFloorY = roomData.floorY;

    this.add.image(0, 0, roomData.background)
      .setDisplaySize(1200, 600)
      .setOrigin(0, 0)
      .setPosition(0, 0)
      .setDepth(0);

    this.physics.world.setBounds(0, 0, 1200, 600);
    this.physics.world.gravity.y = 0;
    this.cameras.main.setBounds(0, 0, 1200, 600);

    this.initSounds();

    this.lightSystem = new LightSystem();
    this.dialogueSystem = new DialogueSystem();
    this.puzzleSystem = new PuzzleSystem();
    this.missionSystem = new MissionSystem(this);

    const startX = this.savedStartX ?? roomData.playerStartX;
    this.savedStartX = null;

    this.playerSystem = new PlayerSystem();
    this.playerSystem.create(this, startX, roomData.floorY);
    if (this.savedSanity !== null) {
      this.playerSystem.sanity = this.savedSanity;
    }
    this.playerSystem.sprite.setCollideWorldBounds(true);
    this.playerSystem.sprite.body.allowGravity = false;

    this.catSystem = new CatSystem();
    // Spawn the cat near the player dynamically (e.g. 80px away), rather than using hardcoded catStartX
    const initialCatX = startX > 600 ? startX - 80 : startX + 80;
    this.catSystem.create(this, initialCatX, roomData.floorY);

    this.lightSystem.create(this);
    if (this.savedBattery !== null) {
      this.lightSystem.battery = this.savedBattery;
    }
    if (this.savedFlashlightIsOn !== null) {
      this.lightSystem.isOn = this.savedFlashlightIsOn;
    }

    this.puzzleSystem.create(this);

    // Restore persisted inventory / puzzle state BEFORE building the room, so
    // already-collected items are not recreated (otherwise they reappear).
    if (this.savedInventory) {
      this.puzzleSystem.inventory = [...this.savedInventory];
    }
    if (this.savedPuzzleStates) {
      this.puzzleSystem.puzzleStates = { ...this.savedPuzzleStates };
      if (this.puzzleSystem.puzzleStates.fuse_box) {
        this.fuseBoxSolved = true;
      }
    }

    this.puzzleSystem.loadRoom(roomId, roomData.interactables);

    this.dialogueSystem.create(this, this.playerSystem);

    this.horrorEventSystem = new HorrorEventSystem();
    this.horrorEventSystem.create(
      this,
      this.lightSystem,
      this.catSystem,
      this.puzzleSystem,
      this.dialogueSystem,
      this.playerSystem,
    );
    this.horrorEventSystem.loadRoomEvents(roomId, HORROR_EVENTS[roomId]);

    // Restore which once-only triggers (e.g. Mang Berto's dialogue) already
    // fired, so they don't replay/glitch when the player re-enters the room.
    if (this.savedFiredTriggers) {
      this.horrorEventSystem.firedTriggers = new Set(this.savedFiredTriggers);
    }

    this.catSystem.setState(roomData.catInitialState);
    if (roomData.catRunTargetX) {
      this.catSystem.runTo(roomData.catRunTargetX);
    }

    // Room light: check persisted state first, then default
    if (this.roomLightStates[roomId] !== undefined) {
      this.roomLightOn = this.roomLightStates[roomId];
    } else {
      this.roomLightOn = roomData.roomLightDefault ?? false;
    }
    // Kitchen light stays on once the fuse box is solved (persists on return).
    if (roomId === 'kitchen' && this.fuseBoxSolved) {
      this.roomLightOn = true;
    }
    this.lightSystem.setRoomLight(this.roomLightOn);

    this.sanityBar = this.add.graphics();
    this.sanityBar.setScrollFactor(0);
    this.sanityBar.setDepth(100);

    this.sanityLabel = this.add.text(16, 570, 'SANITY', {
      fontSize: '11px',
      color: '#cc88ff',
      fontFamily: 'monospace',
    });
    this.sanityLabel.setScrollFactor(0);
    this.sanityLabel.setDepth(100);

    const missionConfig = MISSIONS[roomId];
    if (missionConfig) {
      // Restore completed missions from previous rooms
      if (this.savedCompletedMissions.length > 0) {
        this.missionSystem.completedMissions = [...this.savedCompletedMissions];
      }
      // Skip re-displaying a mission that's already completed
      if (!this.missionSystem.isMissionComplete(missionConfig.id)) {
        const mission = { ...missionConfig };
        if (roomId === 'kitchen') {
          mission.onComplete = () => this.onFuseBoxSolved();
        }
        this.missionSystem.setMission(mission);
      }
    }

    this.cameras.main.startFollow(this.playerSystem.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    if (roomData.forcedarknessOnEnter && !this.loadedFromSave) {
      // Force room to be dark (no room light) but do NOT drain player's flashlight battery
      this.roomLightOn = false;
      this.lightSystem.setRoomLight(false);
    }

    if (roomData.isFinalRoom) {
      this.lightSystem.battery = 100;
      this.lightSystem.isOn = true;
      this.roomLightOn = true;
      this.lightSystem.setRoomLight(true);

      this.time.delayedCall(30000, () => {
        if (!this.scene.isActive()) return;
        this.missionSystem.completeStep('dawn_breaks');
        this.time.delayedCall(2000, () => {
          if (this.scene.isActive()) {
            this.scene.start('WinScene');
          }
        });
      });
    }

    this.playAmbient(roomData.ambientTrack);

    // === ESCAPE SEQUENCE: Ghost pursuer + living_room redirect + timer ===
    this.escapeGhost = null;
    this.escapeGhostDelay = 2000;
    this.escapeTimer = null;
    this.escapeTimeRemaining = 90; // 90 seconds to escape
    this.escapeTimerText = null;

    if (this.escapeSequenceActive) {
      // If player reached living_room during escape → redirect to living_room_dawn
      if (roomId === 'living_room') {
        this.time.delayedCall(500, () => {
          this.transitionToRoom('living_room_dawn', 200);
        });
      } else if (!roomData.isFinalRoom) {
        // Spawn ghost pursuer after a delay
        this.time.delayedCall(this.escapeGhostDelay, () => {
          if (!this.scene.isActive() || this.isTransitioning) return;
          this.spawnEscapeGhost();
        });

        // Start escape countdown timer UI
        this.escapeTimerText = this.add.text(600, 16, '', {
          fontSize: '18px',
          color: '#ff4444',
          fontFamily: 'monospace',
          fontStyle: 'bold',
          backgroundColor: '#000000aa',
          padding: { x: 12, y: 6 },
        }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(500);

        // Timer ticks every second
        this.escapeTimer = this.time.addEvent({
          delay: 1000,
          repeat: 89,
          callback: () => {
            this.escapeTimeRemaining--;
            if (this.escapeTimeRemaining <= 0) {
              // Time's up → jumpscare → game over
              this.horrorEventSystem.jumpscare(3);
            }
          },
        });
      }

      // Cat leads in living_room_dawn — must be near player at win trigger
      if (roomData.isFinalRoom) {
        // Cat leads to center of the room (near player's likely position)
        this.catSystem.leadTo(400);

        // Wait for cat to arrive near player before triggering dialogue
        const checkCatArrived = this.time.addEvent({
          delay: 200,
          repeat: -1,
          callback: () => {
            if (!this.scene.isActive()) { checkCatArrived.remove(); return; }
            const catX = this.catSystem.sprite?.x ?? 0;
            const px = this.playerSystem.sprite?.x ?? 200;
            // Cat must be within 100px of player
            if (Math.abs(catX - px) < 100) {
              checkCatArrived.remove();
              this.catSystem.state = 'calm';
              this.dialogueSystem.show('dawn_escape', () => {
                this.time.delayedCall(2000, () => {
                  if (this.scene.isActive()) {
                    this.scene.start('WinScene');
                  }
                });
              });
            }
          },
        });
      }
    }

    this.cameras.main.fadeIn(500);

    // Pause button (top-left, always visible)
    this.pauseBtn = this.add.text(20, 16, '⏸', {
      fontSize: '28px',
      color: '#ffffff',
      backgroundColor: '#00000088',
      padding: { x: 8, y: 4 },
    }).setScrollFactor(0).setDepth(500).setInteractive({ useHandCursor: true });

    this.pauseBtn.on('pointerdown', () => this.pauseGame());

    // ESC key to pause
    this.escKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);

    // === IMPROVEMENT 1: Warning countdown bar ===
    this.warningBarBg = this.add.graphics();
    this.warningBarBg.setScrollFactor(0);
    this.warningBarBg.setDepth(100);
    this.warningBarBg.setVisible(false);

    this.warningBarFill = this.add.graphics();
    this.warningBarFill.setScrollFactor(0);
    this.warningBarFill.setDepth(101);
    this.warningBarFill.setVisible(false);

    this.warningText = this.add.text(600, 50, '  STAY BEHIND THE CAT', {
      fontSize: '14px',
      color: '#ffcc00',
      fontFamily: 'monospace',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 6 },
    });
    this.warningText.setOrigin(0.5, 0.5);
    this.warningText.setScrollFactor(0);
    this.warningText.setDepth(101);
    this.warningText.setVisible(false);

    this.warningLabel = this.add.image(600 - this.warningText.width / 2 + 32, 50, 'cat_meter');
    this.warningLabel.setDisplaySize(56, 56);
    this.warningLabel.setOrigin(1, 0.5);
    this.warningLabel.setScrollFactor(0);
    this.warningLabel.setDepth(102);
    this.warningLabel.setVisible(false);

    // === IMPROVEMENT 2: Low sanity vignette ===
    this.vignetteGraphics = this.add.graphics();
    this.vignetteGraphics.setScrollFactor(0);
    this.vignetteGraphics.setDepth(89);

    // === IMPROVEMENT 3: Footstep timer ===
    this.footstepTimer = 0;
    this.footstepInterval = 350; // ms between steps

    // === IMPROVEMENT 4: Cat trust icon ===
    this.catTrustIcon = this.add.image(0, 0, 'cat_shield');
    this.catTrustIcon.setDisplaySize(48, 48);
    this.catTrustIcon.setOrigin(0.5, 1);
    this.catTrustIcon.setDepth(95);
    this.catTrustIcon.setAlpha(0.9);
    this.catTrustIcon.setVisible(false);

    // === IMPROVEMENT 5: Room name display ===
    const roomNames = {
      living_room: 'LIVING ROOM',
      hallway: 'HALLWAY',
      kitchen: 'KITCHEN',
      bedroom: 'BEDROOM',
      basement: 'BASEMENT',
      living_room_dawn: 'LIVING ROOM — DAWN',
    };
    const roomTitle = this.add.text(600, 300, roomNames[roomId] || roomId.toUpperCase(), {
      fontSize: '28px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#00000088',
      padding: { x: 16, y: 8 },
    });
    roomTitle.setOrigin(0.5, 0.5);
    roomTitle.setScrollFactor(0);
    roomTitle.setDepth(200);
    roomTitle.setAlpha(0);
    this.tweens.add({
      targets: roomTitle,
      alpha: 1,
      duration: 400,
      yoyo: true,
      hold: 1200,
      onComplete: () => roomTitle.destroy(),
    });

    // === IMPROVEMENT 6: Inventory UI ===
    this.inventoryContainer = this.add.container(1100, 560);
    this.inventoryContainer.setScrollFactor(0);
    this.inventoryContainer.setDepth(100);
    this.inventoryIcons = [];
    this.updateInventoryUI();
  }

  toggleRoomLight(switchObj) {
    if (this.currentRoom.canTurnOnLight === false && !this.fuseBoxSolved) {
      this.showMessage('The wiring is broken. Restore power first.', 2000);
      return false;
    }

    this.roomLightOn = !this.roomLightOn;
    this.roomLightStates[this.currentRoomId] = this.roomLightOn; // Persist per-room
    this.lightSystem.setRoomLight(this.roomLightOn);
    if (this.missionSystem) {
      this.missionSystem.updateUI();
    }
    return true;
  }

  onFuseBoxSolved() {
    this.fuseBoxSolved = true;
    this.roomLightOn = true;
    this.lightSystem.setRoomLight(true);
    if (this.missionSystem) {
      this.missionSystem.updateUI();
    }
    this.showMessage('Power restored. The room lights up.', 2000);
  }

  drawSanityBar() {
    this.sanityBar.clear();
    this.sanityBar.fillStyle(0x222222);
    this.sanityBar.fillRect(16, 582, 130, 10);

    const pct = this.playerSystem.sanity / 100;
    const color = pct > 0.5 ? 0xcc88ff : pct > 0.25 ? 0xff6666 : 0xff0000;
    this.sanityBar.fillStyle(color);
    this.sanityBar.fillRect(16, 582, 130 * pct, 10);
  }

  initSounds() {
    const keys = [
      'footstep', 'light_click', 'cat_hiss', 'ghost_whisper',
      'jumpscare_sound', 'stage_stinger', 'reveal_stinger',
      'door_creak', 'switch_click', 'ambient_loop', 'win_jingle',
    ];

    this.sounds = {};
    for (const key of keys) {
      if (!this.sound.get(key)) {
        this.sounds[key] = this.sound.add(key, { loop: false });
      } else {
        this.sounds[key] = this.sound.get(key);
      }
    }
  }

  playAmbient(trackKey) {
    if (this.ambientMusic) {
      this.ambientMusic.stop();
      this.ambientMusic = null;
    }

    if (trackKey === 'win_jingle') return;

    // Resume audio context if needed
    if (this.sound.context && this.sound.context.state === 'suspended') {
      this.sound.context.resume();
    }

    this.ambientMusic = this.sound.add(trackKey, { loop: true, volume: 0.6 });
    this.ambientMusic.play();
  }

  update(time, delta) {
    if (this.isTransitioning) return;

    // ESC key to pause
    if (this.escKey && Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.pauseGame();
      return;
    }

    if (this.dialogueSystem && this.dialogueSystem.isOpen) {
      if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
        this.dialogueSystem.advance();
      }
      return;
    }

    if (this.playerSystem.isDead) return;

    this.playerSystem.update(this.cursors, delta);

    const px = this.playerSystem.sprite.x;
    const py = this.playerSystem.sprite.y;

    this.playerSystem.sprite.y = this.roomFloorY;
    this.catSystem.update(px, this.roomFloorY, delta);
    this.catSystem.sprite.y = this.roomFloorY;

    this.lightSystem.update(delta, px, py);
    this.puzzleSystem.update(px);

    if (this.horrorEventSystem) {
      this.horrorEventSystem.update(px, py);
      this.updateCatWarning(px);
    }

    // PENALTY: If cat is warning and player walked PAST the cat, drain sanity + battery
    if (this.catSystem.isWarning() && !this.catSystem.isPlayerBehind(px)) {
      // Sanity drain — 15 per second while past the cat
      this.playerSystem.sanity -= 15 * (delta / 1000);
      if (this.playerSystem.sanity <= 0) {
        this.playerSystem.sanity = 0;
        this.playerSystem.die();
      }
      // Battery drain — 10 per second while past the cat
      if (this.lightSystem.battery > 0) {
        this.lightSystem.battery -= 10 * (delta / 1000);
        this.lightSystem.battery = Math.max(0, this.lightSystem.battery);
        if (this.lightSystem.battery <= 0) {
          this.lightSystem.isOn = false;
        }
      }
    }

    this.drawSanityBar();

    // === IMPROVEMENT 1: Update warning countdown bar ===
    this.updateWarningBar();

    // === IMPROVEMENT 2: Low sanity vignette pulse ===
    this.updateVignette(delta);

    // === IMPROVEMENT 3: Footstep audio ===
    this.updateFootsteps(delta);

    // === IMPROVEMENT 4: Cat trust icon ===
    this.updateCatTrustIcon();

    // === IMPROVEMENT 6: Inventory UI ===
    this.updateInventoryUI();

    // === FEATURE #3: Sanity recovery ===
    this.updateSanityRecovery(delta);

    // === FEATURE #6: Camera effects ===
    this.updateCameraEffects(delta);

    // === ESCAPE SEQUENCE: Ghost pursuer ===
    this.updateEscapeGhost(delta);

    // === ESCAPE SEQUENCE: Timer display ===
    if (this.escapeTimerText && this.escapeSequenceActive) {
      const mins = Math.floor(this.escapeTimeRemaining / 60);
      const secs = this.escapeTimeRemaining % 60;
      this.escapeTimerText.setText(`⏱ ${mins}:${secs.toString().padStart(2, '0')}`);
      if (this.escapeTimeRemaining <= 15) {
        this.escapeTimerText.setColor('#ff0000');
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.lightSystem.toggle();
    }

    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      // Try petting the cat first, then interact with objects
      if (!this.petCat()) {
        this.puzzleSystem.interact(px);
      }
    }

    // Edge-based exits removed — all room transitions happen through doors only
    // this.checkRoomEdgeExit(px);
  }

  checkRoomEdgeExit(playerX) {
    if (!this.roomData.exits || this.roomData.exits.length === 0) return;

    for (const exit of this.roomData.exits) {
      if (Math.abs(playerX - exit.x) < 60) {
        if (exit.requiresItem && !this.puzzleSystem.hasItem(exit.requiresItem)) {
          this.showMessage('Need an item to open this', 2000);
          return;
        }
        if (exit.requiresPuzzle && !this.puzzleSystem.isPuzzleSolved(exit.requiresPuzzle)) {
          this.showMessage('Something is blocking the way...', 2000);
          return;
        }

        if (exit.leadsTo === 'living_room_dawn' && this.missionSystem) {
          this.missionSystem.completeStep('reach_exit');
        }

        const entryX = exit.direction === 'right' ? 120 : 1100;
        this.transitionToRoom(exit.leadsTo, entryX);
        return;
      }
    }
  }

  updateCatWarning(playerX) {
    if (this.catSystem.isStateOverride()) return;
    if (this.catSystem.getState() === 'running') return;
    if (this.catSystem.getState() === 'leading') return;
    // During escape, cat guides — no warnings
    if (this.escapeSequenceActive) return;

    const roomOverride = this.roomData.catInitialState;
    if (roomOverride === 'calm') return;

    // CAT WARNING SAFE TIMER: If cat is warning and player stays behind it for 60s, danger passes
    if (this.catSystem.isWarning()) {
      const isBehind = this.catSystem.isPlayerBehind(playerX);
      if (isBehind) {
        if (!this.catWarningActive) {
          this.catWarningActive = true;
          this.catWarningElapsed = 0;
        }
        this.catWarningElapsed += this.game.loop.delta;

        if (this.catWarningElapsed >= 10000) {
          // 10 seconds passed — player is safe now
          this.catWarningActive = false;
          this.catWarningElapsed = 0;
          this.catMeterCompleted = true;
          this.catSystem.setState('walking');
          this.showMessage('The danger has passed. You\'re safe to move.', 3000);
          // Mark the nearest trigger as fired so it doesn't re-trigger
          const nearest = this.horrorEventSystem.getNearestUnfiredTrigger(playerX);
          if (nearest && nearest.trigger.once) {
            this.horrorEventSystem.firedTriggers.add(nearest.trigger.id);
          }
          return;
        }
      } else {
        // Player moved away from behind the cat — reset the timer
        // But do NOT cancel defending state: only the safe-timer can exit defending.
        this.catWarningActive = false;
        this.catWarningElapsed = 0;
      }
    } else {
      this.catWarningActive = false;
      this.catWarningElapsed = 0;
    }

    // If the cat is currently DEFENDING, the state is locked until the safe-timer
    // (above) releases it. Do NOT let proximity distance re-evaluate and demote it
    // to hissing or walking — that is the early-cancel bug.
    if (this.catSystem.getState() === 'defending') return;

    // KITCHEN: Cat actively blocks the wrong switch in the fuse puzzle
    if (roomOverride === 'hissing' && this.currentRoomId === 'kitchen') {
      const fuseSeq = this.puzzleSystem.fuseSequence || [];
      const correct = ['switch_a', 'switch_c', 'switch_b'];
      const nextCorrectIdx = fuseSeq.length;

      if (nextCorrectIdx < correct.length && !this.fuseBoxSolved) {
        // Find switches that are NOT the next correct one — cat should block them
        const wrongSwitches = this.puzzleSystem.interactables.filter(
          (i) => i.type === 'switch' && i.puzzleId === 'fuse_box' && i.key !== correct[nextCorrectIdx]
        );

        // Position cat near the closest wrong switch to the player
        const nearestWrong = wrongSwitches.reduce((closest, sw) => {
          const d = Math.abs(playerX - sw.x);
          return d < Math.abs(playerX - (closest?.x || 9999)) ? sw : closest;
        }, null);

        const currentState = this.catSystem.getState();
        const hissThresh = currentState === 'hissing' ? 230 : 200;

        if (nearestWrong && Math.abs(playerX - nearestWrong.x) < hissThresh) {
          this.catSystem.setGhostX(nearestWrong.x);
          this.catSystem.setState('hissing');
          // Move cat toward the wrong switch to block it
          if (this.catSystem.sprite) {
            const catTarget = nearestWrong.x - 30;
            const catDist = catTarget - this.catSystem.sprite.x;
            if (Math.abs(catDist) > 20) {
              this.catSystem.sprite.x += Math.sign(catDist) * 2;
            }
          }
        } else {
          this.catSystem.setState('walking');
        }
      } else {
        this.catSystem.setState('walking');
      }
      return;
    }

    // BEDROOM: Cat defends at closet area
    if (roomOverride === 'defending' && this.currentRoomId === 'bedroom') {
      const nearest = this.horrorEventSystem.getNearestUnfiredTrigger(playerX);
      if (nearest && nearest.distance < 300) {
        this.catSystem.setGhostX(nearest.trigger.event?.x ?? nearest.trigger.x);
        this.catSystem.setState('defending');
      } else if (this.catSystem.getState() !== 'walking') {
        this.catSystem.setState('walking');
      }
      return;
    }

    // DEFAULT: Cat warns based on proximity to unfired triggers
    const nearest = this.horrorEventSystem.getNearestUnfiredTrigger(playerX);
    if (!nearest) {
      if (this.catSystem.getState() !== 'walking' && this.catSystem.getState() !== 'idle') {
        this.catSystem.setState('walking');
      }
      return;
    }

    const currentState = this.catSystem.getState();
    const defThresh = currentState === 'defending' ? 100 : 80;
    const hissThresh = (currentState === 'hissing' || currentState === 'defending') ? 220 : 200;

    if (nearest.distance < defThresh) {
      this.catSystem.setState('defending');
      if (nearest.trigger.event?.x) {
        this.catSystem.setGhostX(nearest.trigger.event.x);
      }
    } else if (nearest.distance < hissThresh) {
      this.catSystem.setState('hissing');
    } else if (currentState !== 'walking') {
      this.catSystem.setState('walking');
    }
  }

  pauseGame() {
    this.scene.pause('GameScene');
    this.scene.launch('PauseScene');
  }

  // === IMPROVEMENT 1: Warning countdown bar ===
  updateWarningBar() {
    if (this.catWarningActive && this.catSystem.isWarning()) {
      const pct = Math.min(this.catWarningElapsed / 10000, 1);
      const barWidth = 200;
      const barX = 500;
      const barY = 75;

      this.warningBarBg.setVisible(true);
      this.warningBarBg.clear();
      this.warningBarBg.fillStyle(0x333333, 0.8);
      this.warningBarBg.fillRoundedRect(barX, barY, barWidth, 10, 5);

      this.warningBarFill.setVisible(true);
      this.warningBarFill.clear();
      this.warningBarFill.fillStyle(0x00ff88, 0.9);
      this.warningBarFill.fillRoundedRect(barX, barY, barWidth * pct, 10, 5);

      this.warningLabel.setVisible(true);
      this.warningText.setVisible(true);
    } else {
      this.warningBarBg.setVisible(false);
      this.warningBarFill.setVisible(false);
      this.warningLabel.setVisible(false);
      this.warningText.setVisible(false);
    }
  }

  // === IMPROVEMENT 2: Low sanity vignette ===
  updateVignette(delta) {
    this.vignetteGraphics.clear();
    const sanityPct = this.playerSystem.sanity / 100;

    if (sanityPct < 0.5) {
      const intensity = (0.5 - sanityPct) / 0.5; // 0 at 50%, 1 at 0%
      const pulse = 0.3 + Math.sin(Date.now() * 0.003) * 0.15;
      const alpha = intensity * pulse;

      // Draw vignette edges
      const w = 1200;
      const h = 600;
      const edgeSize = 80 + intensity * 60;

      this.vignetteGraphics.fillStyle(0x660022, alpha);
      // Top
      this.vignetteGraphics.fillRect(0, 0, w, edgeSize);
      // Bottom
      this.vignetteGraphics.fillRect(0, h - edgeSize, w, edgeSize);
      // Left
      this.vignetteGraphics.fillRect(0, 0, edgeSize, h);
      // Right
      this.vignetteGraphics.fillRect(w - edgeSize, 0, edgeSize, h);
    }
  }

  // === IMPROVEMENT 3: Footstep audio ===
  updateFootsteps(delta) {
    const vx = this.playerSystem.sprite.body.velocity.x;
    if (Math.abs(vx) > 10 && this.playerSystem.canMove) {
      this.footstepTimer += delta;
      if (this.footstepTimer >= this.footstepInterval) {
        this.footstepTimer = 0;
        if (this.sounds?.footstep) {
          this.sounds.footstep.play({ volume: 0.3, rate: 0.9 + Math.random() * 0.2 });
        }
      }
    } else {
      this.footstepTimer = 0;
    }
  }

  // === IMPROVEMENT 4: Cat trust icon ===
  updateCatTrustIcon() {
    if (this.isPlayerProtectedByCat()) {
      this.catTrustIcon.setVisible(true);
      this.catTrustIcon.setPosition(
        this.catSystem.sprite.x,
        this.catSystem.sprite.y - 100
      );
    } else {
      this.catTrustIcon.setVisible(false);
    }
  }

  // === IMPROVEMENT 6: Inventory UI ===
  updateInventoryUI() {
    // Clear old icons
    this.inventoryContainer.removeAll(true);

    const items = this.puzzleSystem.inventory || [];
    const iconMap = {
      house_key: '🔑',
      kitchen_key: '🗝️',
      old_photo: '📷',
      truth_note_obj: '📜',
    };

    items.forEach((item, i) => {
      const icon = iconMap[item] || '•';
      const bg = this.add.graphics();
      bg.fillStyle(0x000000, 0.6);
      bg.fillRoundedRect(-30 * i - 28, -14, 26, 26, 4);
      this.inventoryContainer.add(bg);

      const txt = this.add.text(-30 * i - 15, 0, icon, {
        fontSize: '16px',
      });
      txt.setOrigin(0.5, 0.5);
      this.inventoryContainer.add(txt);
    });
  }

  /**
   * Returns true if the player is currently protected by the cat
   * (cat is warning AND player is behind it).
   */
  isPlayerProtectedByCat() {
    if (!this.catSystem || !this.catSystem.isWarning()) return false;
    if (!this.playerSystem || !this.playerSystem.sprite) return false;
    return this.catSystem.isPlayerBehind(this.playerSystem.sprite.x);
  }

  // === FEATURE #3: Sanity recovery ===
  // Pet the cat (press E near it when calm/idle/walking) to recover sanity
  // Also recover slowly when standing in light
  updateSanityRecovery(delta) {
    // Recovery in light (2 sanity/sec when room light is on and not being attacked)
    if (this.roomLightOn && !this.catSystem.isWarning()) {
      this.playerSystem.sanity = Math.min(100, this.playerSystem.sanity + 2 * (delta / 1000));
    }

    // Pet cooldown countdown
    if (this.petCooldown > 0) {
      this.petCooldown -= delta;
    }
  }

  petCat() {
    if (this.petCooldown > 0) return false;

    const catState = this.catSystem.getState();
    const catX = this.catSystem.sprite?.x ?? 0;
    const playerX = this.playerSystem.sprite.x;
    const dist = Math.abs(playerX - catX);

    // Can only pet when cat is calm, idle, or walking and player is close
    if (dist < 80 && (catState === 'calm' || catState === 'idle' || catState === 'walking')) {
      const recovery = 15;
      this.playerSystem.sanity = Math.min(100, this.playerSystem.sanity + recovery);
      this.petCooldown = 5000; // 5 second cooldown between pets
      this.showMessage('You pet the cat. Feeling calmer.', 2000);

      // Show a brief heart above the cat
      const heart = this.add.image(catX, this.catSystem.sprite.y - 90, 'cat_heart');
      heart.setDisplaySize(36, 36);
      heart.setOrigin(0.5, 1);
      heart.setDepth(96);
      this.tweens.add({
        targets: heart,
        y: heart.y - 30,
        alpha: 0,
        duration: 1000,
        onComplete: () => heart.destroy(),
      });
      return true;
    }
    return false;
  }

  // === FEATURE #6: Camera effects ===
  updateCameraEffects(delta) {
    const sanityPct = this.playerSystem.sanity / 100;
    this.cameras.main.setZoom(1.0);
  }

  // === ESCAPE SEQUENCE: Ghost pursuer ===
  spawnEscapeGhost() {
    if (this.escapeGhost) return;

    // Ghost spawns at the far edge behind the player
    const px = this.playerSystem.sprite.x;
    const spawnX = px > 600 ? 50 : 1150;

    this.escapeGhost = this.add.image(spawnX, this.roomFloorY - 80, 'ghost_stage2');
    this.escapeGhost.setDisplaySize(100, 200);
    this.escapeGhost.setOrigin(0.5, 1.0);
    this.escapeGhost.setDepth(85);
    this.escapeGhost.setAlpha(0.7);

    // Ghost whisper sound
    if (this.sounds?.ghost_whisper) {
      this.sounds.ghost_whisper.play({ volume: 0.5 });
    }
  }

  updateEscapeGhost(delta) {
    if (!this.escapeGhost || !this.escapeSequenceActive) return;

    const px = this.playerSystem.sprite.x;
    const ghostX = this.escapeGhost.x;
    const dist = px - ghostX;

    // Ghost moves toward player at 80px/s (player is 160px/s — tolerable, gives player time)
    const ghostSpeed = 80;
    const dir = dist > 0 ? 1 : -1;
    this.escapeGhost.x += dir * ghostSpeed * (delta / 1000);
    this.escapeGhost.flipX = dir < 0;

    // Pulse alpha for eerie effect
    this.escapeGhost.setAlpha(0.5 + Math.sin(Date.now() * 0.003) * 0.2);

    // If ghost catches player (within 60px) → jumpscare
    if (Math.abs(px - this.escapeGhost.x) < 60) {
      if (this.lightSystem.isPlayerProtected()) return; // Light still repels
      if (this.catSystem && this.catSystem.getState() === 'defending' && this.catSystem.isPlayerBehind(px)) return; // Cat protects

      this.escapeGhost.destroy();
      this.escapeGhost = null;
      this.horrorEventSystem.jumpscare(3);
    }
  }

  // === FEATURE #10: Save system ===
  saveGame() {
    const saveData = {
      roomId: this.currentRoomId,
      inventory: [...this.puzzleSystem.inventory],
      puzzleStates: { ...this.puzzleSystem.puzzleStates },
      playerStartX: this.playerSystem.sprite.x,
      fuseBoxSolved: this.fuseBoxSolved,
      battery: this.lightSystem.battery,
      flashlightIsOn: this.lightSystem.isOn,
      sanity: this.playerSystem.sanity,
      firedTriggers: [...this.horrorEventSystem.firedTriggers],
      escapeSequenceActive: this.escapeSequenceActive,
      roomLightStates: { ...this.roomLightStates },
      completedMissions: [...this.missionSystem.completedMissions],
      timestamp: Date.now(),
    };
    try {
      localStorage.setItem('catacute_save', JSON.stringify(saveData));
    } catch (e) {
      // localStorage might be unavailable
    }
  }

  static loadGame() {
    try {
      const data = localStorage.getItem('catacute_save');
      if (data) return JSON.parse(data);
    } catch (e) {
      // ignore
    }
    return null;
  }

  static clearSave() {
    try {
      localStorage.removeItem('catacute_save');
    } catch (e) {
      // ignore
    }
  }

  showMessage(text, duration = 2000) {
    if (this.messageText) this.messageText.destroy();
    this.messageText = this.add.text(600, 460, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#000000cc',
      padding: { x: 10, y: 6 },
    });
    this.messageText.setOrigin(0.5, 0.5);
    this.messageText.setScrollFactor(0);
    this.messageText.setDepth(97);

    this.time.delayedCall(duration, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }
    });
  }

  transitionToRoom(roomId, playerStartX = null) {
    if (this.isTransitioning || !roomId) return;

    // CAT HISSING GATE (kitchen only): block leaving while cat is hissing
    if (this.currentRoomId === 'kitchen'
      && this.catSystem && this.catSystem.isWarning()
      && !this.catMeterCompleted) {
      this.showMessage('The cat is hissing, but you push through the door anyway...', 1500);
      // Removed the 'return;' statement to prevent hard-blocking the player
    }

    this.isTransitioning = true;

    // Auto-save before transitioning
    this.saveGame();

    this.playerSystem.lock();
    this.horrorEventSystem.stopAmbient();

    const doTransition = () => {
      if (this.ambientMusic) {
        this.ambientMusic.stop();
      }

      const targetRoom = ROOMS[roomId];
      const startX = playerStartX ?? targetRoom?.playerStartX ?? 200;

      this.scene.restart({
        roomId,
        inventory: [...this.puzzleSystem.inventory],
        puzzleStates: { ...this.puzzleSystem.puzzleStates },
        playerStartX: startX,
        fuseBoxSolved: this.fuseBoxSolved,
        battery: this.lightSystem.battery,
        flashlightIsOn: this.lightSystem.isOn,
        sanity: this.playerSystem.sanity,
        firedTriggers: [...this.horrorEventSystem.firedTriggers],
        escapeSequenceActive: this.escapeSequenceActive,
        roomLightStates: { ...this.roomLightStates },
        completedMissions: [...this.missionSystem.completedMissions],
      });
    };

    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', doTransition);

    // Safety: if fadeOut doesn't complete (e.g. camera already fading), force after 800ms
    this.time.delayedCall(800, () => {
      if (this.isTransitioning) {
        doTransition();
      }
    });
  }
}
