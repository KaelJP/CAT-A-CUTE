export default class HorrorEventSystem {
  constructor() {
    this.scene = null;
    this.lightSystem = null;
    this.catSystem = null;
    this.puzzleSystem = null;
    this.dialogueSystem = null;
    this.playerSystem = null;
    this.firedTriggers = new Set();
    this.activeEvent = null;
    this.ambientTimer = null;
    this.activeGhost = null;
    this.triggers = [];
    this.ambientConfig = [];
    this.shadowRect = null;
    this.lastDamageCheck = 0;
  }

  create(scene, lightSystem, catSystem, puzzleSystem, dialogueSystem, playerSystem) {
    this.scene = scene;
    this.lightSystem = lightSystem;
    this.catSystem = catSystem;
    this.puzzleSystem = puzzleSystem;
    this.dialogueSystem = dialogueSystem;
    this.playerSystem = playerSystem;
  }

  loadRoomEvents(roomId, eventsData) {
    this.stopAmbient();
    this.firedTriggers.clear();
    this.activeGhost = null;
    this.triggers = eventsData?.triggers || [];
    this.ambientConfig = eventsData?.ambient || [];
    this.startAmbient();
  }

  startAmbient() {
    if (this.ambientConfig.length === 0) return;

    const config = this.ambientConfig[0];
    const [minMs, maxMs] = config.interval;
    const delay = Phaser.Math.Between(minMs, maxMs);

    this.ambientTimer = this.scene.time.delayedCall(delay, () => {
      if (!this.scene.scene.isActive()) return;
      this.fireEvent({ type: config.type, duration: 1500 });
      this.startAmbient();
    });
  }

  stopAmbient() {
    if (this.ambientTimer) {
      this.ambientTimer.remove();
      this.ambientTimer = null;
    }
  }

  update(playerX, playerY) {
    for (const trigger of this.triggers) {
      if (playerX > trigger.x && playerX < trigger.x + trigger.width) {
        if (trigger.once && this.firedTriggers.has(trigger.id)) continue;

        // CAT TRUST MECHANIC: If cat is warning and player stayed behind, suppress ghost events
        if (this.catSystem && this.catSystem.isWarning()) {
          const isBehindCat = this.catSystem.isPlayerBehind(playerX);

          // If player trusts the cat (stayed behind), ghost/damage events are blocked
          if (isBehindCat && (trigger.event.type === 'flash_ghost' || trigger.event.type === 'jumpscare')) {
            // Cat protected the player — show feedback
            if (this.scene.showMessage) {
              this.scene.showMessage('The cat warned you. You\'re safe.', 1500);
            }
            if (trigger.once) this.firedTriggers.add(trigger.id);
            // Cat calms down after successful protection
            this.catSystem.setState('walking');
            continue;
          }
        }

        const fired = this.fireEvent(trigger.event);
        if (trigger.once && fired) this.firedTriggers.add(trigger.id);
      }
    }
    this.ghostDamageCheck(playerX, playerY);
  }

  ghostDamageCheck(playerX, playerY) {
    if (!this.activeGhost || !this.activeGhost.active) return;
    if (this.lightSystem.isPlayerProtected()) return;

    const dist = Math.abs(playerX - this.activeGhost.x);
    if (dist < 180 && this.playerSystem) {
      // CAT TRUST MECHANIC: If cat is defending AND player is behind the cat, block all damage
      if (this.catSystem && this.catSystem.getState() === 'defending') {
        if (this.catSystem.isPlayerBehind(playerX)) {
          // Cat fully protects — no damage taken
          return;
        }
        // Player rushed past the defending cat — reduced protection only
        this.playerSystem.takeDamage(20);
      } else {
        // No cat protection — full damage for ignoring warnings
        this.playerSystem.takeDamage(45);
      }
    }
  }

  getNearestUnfiredTrigger(playerX) {
    let nearest = null;
    let minDist = Infinity;

    for (const trigger of this.triggers) {
      if (trigger.once && this.firedTriggers.has(trigger.id)) continue;
      const triggerCenter = trigger.x + trigger.width / 2;
      const dist = Math.abs(playerX - triggerCenter);
      if (dist < minDist) {
        minDist = dist;
        nearest = trigger;
      }
    }

    return nearest ? { trigger: nearest, distance: minDist } : null;
  }

  fireEvent(eventConfig) {
    if (!eventConfig) return false;

    if (eventConfig.type === 'jumpscare' && eventConfig.requiresDark && this.lightSystem.isActive()) {
      return false;
    }

    this.activeEvent = eventConfig;

    switch (eventConfig.type) {
      case 'flicker':
        this.flickerLights(eventConfig.duration || 2000);
        break;
      case 'whisper':
        this.playWhisper();
        break;
      case 'shadow':
        this.moveShadow();
        break;
      case 'flash_ghost':
        this.flashGhost(eventConfig.stage, eventConfig.x, eventConfig.y, eventConfig.duration || 600);
        break;
      case 'jumpscare':
        this.jumpscare(eventConfig.stage || 3);
        break;
      case 'dialogue':
        if (this.dialogueSystem) {
          const key = eventConfig.key;
          this.dialogueSystem.show(key);
        }
        break;
      case 'sound':
        if (this.scene.sounds?.[eventConfig.key]) {
          this.scene.sounds[eventConfig.key].play({ volume: 0.7 });
        }
        break;
      case 'forceOff':
        this.lightSystem.forceOff();
        break;
      case 'turnOff':
        // Turn off flashlight without zeroing battery — player can toggle it back on
        this.lightSystem.isOn = false;
        break;
      default:
        break;
    }

    this.activeEvent = null;
    return true;
  }

  flickerLights(duration) {
    this.lightSystem.flicker(duration);
  }

  playWhisper() {
    if (this.scene.sounds?.ghost_whisper) {
      this.scene.sounds.ghost_whisper.play({ volume: 0.3 });
    }
    if (this.playerSystem) {
      this.playerSystem.setScared(true);
      this.scene.time.delayedCall(3000, () => {
        if (this.playerSystem) this.playerSystem.setScared(false);
      });
    }
  }

  moveShadow() {
    if (this.shadowRect) this.shadowRect.destroy();

    this.shadowRect = this.scene.add.image(-100, 250, 'ghost_stage0');
    this.shadowRect.setAlpha(0.4);
    this.shadowRect.setDepth(88);
    this.shadowRect.setDisplaySize(120, 240);

    this.scene.tweens.add({
      targets: this.shadowRect,
      x: 1300,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => {
        if (this.shadowRect) {
          this.shadowRect.destroy();
          this.shadowRect = null;
        }
      },
    });
  }

  flashGhost(stage, x, y, duration) {
    const ghostKeys = ['ghost_stage0', 'ghost_stage1', 'ghost_stage2', 'ghost_stage3'];
    const widths = [60, 90, 150, 800];
    const heights = [120, 160, 240, 600];
    const alphas = [0.4, 0.6, 0.8, 1.0];

    const ghost = this.scene.add.image(x, y, ghostKeys[stage] || ghostKeys[0]);
    ghost.setAlpha(0);
    ghost.setDepth(10);
    ghost.setDisplaySize(widths[stage] || 60, heights[stage] || 120);
    ghost.setOrigin(0.5, 1.0);

    this.activeGhost = ghost;

    if (this.playerSystem) this.playerSystem.setScared(true);
    if (this.catSystem) this.catSystem.setGhostX(x);

    if (this.scene.currentRoomId === 'living_room_dawn' && this.scene.missionSystem) {
      this.scene.missionSystem.completeStep('see_ghost');
    }

    this.scene.tweens.add({
      targets: ghost,
      alpha: alphas[stage] || 0.4,
      duration: duration / 2,
      yoyo: true,
      onComplete: () => {
        ghost.destroy();
        this.activeGhost = null;
        if (this.playerSystem) this.playerSystem.setScared(false);
      },
    });
  }

  jumpscare(stage) {
    if (this.playerSystem) this.playerSystem.lock();

    // Get actual game dimensions for true fullscreen coverage
    const { width, height } = this.scene.scale;
    const camCenterX = width / 2;
    const camCenterY = height / 2;

    const ghost = this.scene.add.image(camCenterX, camCenterY, 'jumpscare');

    // Scale to COVER the full viewport without distortion (like CSS object-fit: cover)
    // Pick the larger scale factor so the image fills the screen, cropping overflow
    const scaleX = width / ghost.width;
    const scaleY = height / ghost.height;
    const coverScale = Math.max(scaleX, scaleY);
    ghost.setScale(coverScale);

    ghost.setOrigin(0.5, 0.5);
    ghost.setDepth(999);       // Above everything including darkness overlay
    ghost.setScrollFactor(0);  // Fixed to camera (no scroll offset)

    if (this.scene.sounds?.jumpscare_sound) {
      this.scene.sounds.jumpscare_sound.play({ volume: 1 });
    }

    this.scene.time.delayedCall(800, () => {
      this.scene.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          ghost.destroy();
          this.scene.scene.start('GameOverScene');
        },
      });
    });
  }
}
