export default class CatSystem {
  constructor() {
    this.sprite = null;
    this.scene = null;
    this.state = 'walking';
    this.followDistance = 120;
    this.followSpeed = 130;
    this.floorY = 530;
    this.runTargetX = null;
    this.leadTargetX = null;
    this.stateOverride = false;
  }

  create(scene, x, y) {
    this.scene = scene;
    this.floorY = y;
    this.followDistance = 80;  // Cat stays 80px AHEAD of player (positive = in front)
    this.followSpeed = 200;    // Faster than player so it can stay ahead
    this.state = 'walking';

    this.sprite = scene.physics.add.sprite(x, y, 'cat_idle');
    this.sprite.setDisplaySize(100, 75);
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.setDepth(22);
    this.sprite.body.allowGravity = false;
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setGravityY(0);
    this.sprite.y = this.floorY;

    this.registerAnims(scene);
    this.state = 'idle'; // Force initial state different so setState('walking') actually runs
    this.setState('walking');
    return this.sprite;
  }

  registerAnims(scene) {
    const anims = [
      { key: 'cat_idle', frames: ['cat_idle'], frameRate: 1, repeat: -1 },
      { key: 'cat_walk', frames: ['cat_walking1', 'cat_walking2'], frameRate: 8, repeat: -1 },
      { key: 'cat_hiss', frames: ['cat_hissing'], frameRate: 1, repeat: -1 },
      { key: 'cat_defend', frames: ['cat_defending'], frameRate: 2, repeat: -1 },
      { key: 'cat_calm', frames: ['cat_calm'], frameRate: 1, repeat: -1 },
    ];

    anims.forEach((a) => {
      if (!scene.anims.exists(a.key)) {
        scene.anims.create({
          key: a.key,
          frames: a.frames.map((f) => ({ key: f })),
          frameRate: a.frameRate,
          repeat: a.repeat,
        });
      }
    });
  }

  setState(newState) {
    if (this.state === newState) return;

    this.state = newState;

    const animMap = {
      idle: 'cat_idle',
      walking: 'cat_walk',
      hissing: 'cat_hiss',
      defending: 'cat_defend',
      running: 'cat_walk',
      calm: 'cat_calm',
    };

    const anim = animMap[newState] || 'cat_idle';
    if (this.sprite.anims.currentAnim?.key !== anim) {
      this.sprite.play(anim);
    }

    // Maintain consistent display size across all states
    this.sprite.setDisplaySize(100, 75);

    if (newState === 'hissing' && this.scene.sounds?.cat_hiss) {
      this.scene.sounds.cat_hiss.play({ volume: 0.5 });
    }

    if (newState === 'calm') {
      this.stateOverride = true;
    } else if (newState !== 'calm') {
      this.stateOverride = false;
    }

    if (
      newState === 'defending'
      && this.scene.currentRoomId === 'living_room_dawn'
      && this.scene.missionSystem
    ) {
      this.scene.missionSystem.completeStep('cat_defends');
    }
  }

  runTo(x) {
    this.runTargetX = x;
    this.setState('running');
  }

  /**
   * Cat leads the player toward a target position (escape sequence).
   */
  leadTo(x) {
    this.leadTargetX = x;
    this.state = 'leading';
    this.stateOverride = true;
  }

  setGhostX(x) {
    this.ghostX = x;
  }

  update(playerX, playerY, delta) {
    if (!this.sprite) return;

    // Cat always tries to stay AHEAD of the player
    let targetX;
    const playerSprite = this.scene.playerSystem?.sprite;

    if (this.state === 'hissing' || this.state === 'defending') {
      targetX = this.getWarningPosition(playerX);
    } else {
      // Normal: stay ahead of the player in their movement direction
      const movingRight = playerSprite ? playerSprite.flipX === false : true;
      targetX = movingRight ? playerX + this.followDistance : playerX - this.followDistance;
    }

    const dist = targetX - this.sprite.x;

    if (this.state === 'walking' || this.state === 'idle' || this.state === 'calm') {
      if (Math.abs(dist) > 15) {
        const dir = dist > 0 ? 1 : -1;
        this.sprite.x += dir * this.followSpeed * (delta / 1000);
        if (this.state !== 'walking' && this.state !== 'calm') this.setState('walking');
      } else if (this.state !== 'idle' && this.state !== 'calm') {
        this.setState('idle');
      }
      // Mirror the player's facing direction
      if (playerSprite) {
        this.sprite.flipX = !playerSprite.flipX;
      }
    }

    // When hissing/defending: face the threat. Move toward warning position only if hissing.
    if (this.state === 'hissing' || this.state === 'defending') {
      if (this.state === 'hissing') {
        const warnDist = targetX - this.sprite.x;
        if (Math.abs(warnDist) > 15) {
          const dir = warnDist > 0 ? 1 : -1;
          this.sprite.x += dir * this.followSpeed * (delta / 1000);
        }
      }
      if (this.ghostX != null) {
        this.sprite.flipX = this.ghostX < this.sprite.x;
      }
    }

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
      // Mirror the player's facing direction
      if (playerSprite) {
        this.sprite.flipX = !playerSprite.flipX;
      }
    }

    // LEADING MODE: Cat moves ahead of the player toward a target (used during escape)
    if (this.state === 'leading') {
      const leadTarget = this.leadTargetX ?? 600;
      const leadDist = leadTarget - this.sprite.x;
      if (Math.abs(leadDist) > 10) {
        this.sprite.x += (leadDist > 0 ? 1 : -1) * 180 * (delta / 1000);
        this.sprite.flipX = leadDist < 0;
      }
    }

    this.sprite.y = this.floorY;
    this.sprite.setVelocityY(0);
  }

  /**
   * When warning, cat positions itself BETWEEN the player and the threat.
   * This puts the cat AHEAD of the player so the player can stay "behind" it.
   */
  getWarningPosition(playerX) {
    if (this.ghostX != null) {
      // Position cat halfway between player and ghost, but closer to the ghost
      return playerX + (this.ghostX - playerX) * 0.4;
    }
    // Default: move 60px ahead of the player (toward the right, common danger direction)
    return playerX + 60;
  }

  /**
   * Returns true if the player is "behind" the cat (trusting the cat's warning).
   * Behind means the player's x is on the opposite side of the cat from the threat.
   */
  isPlayerBehind(playerX) {
    if (!this.sprite) return false;
    const catX = this.sprite.x;

    // If cat is defending toward a ghost, check if player is on the safe side
    if (this.ghostX != null) {
      // Ghost is to the right of cat → player should be to the left of cat
      if (this.ghostX > catX) return playerX < catX + 30;
      // Ghost is to the left of cat → player should be to the right of cat
      return playerX > catX - 30;
    }

    // If no ghost position, player is "behind" if they haven't passed the cat
    return playerX < catX + 20;
  }

  /**
   * Returns true if the cat is actively warning (hissing or defending).
   */
  isWarning() {
    return this.state === 'hissing' || this.state === 'defending';
  }

  getState() {
    return this.state;
  }

  isStateOverride() {
    return this.stateOverride;
  }
}
