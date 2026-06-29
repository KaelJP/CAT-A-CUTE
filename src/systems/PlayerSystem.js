export default class PlayerSystem {
  constructor() {
    this.sprite = null;
    this.scene = null;
    this.floorY = 530;
    this.canMove = true;
    this.isScared = false;
    this.sanity = 100;
    this.isHurt = false;
    this.hurtCooldown = 0;
    this.isDead = false;
  }

  create(scene, x, y) {
    this.scene = scene;
    this.floorY = y;
    this.canMove = true;
    this.isScared = false;
    this.sanity = 100;
    this.isHurt = false;
    this.hurtCooldown = 0;
    this.isDead = false;

    this.sprite = scene.physics.add.sprite(x, y, 'player_idle');
    this.sprite.setDisplaySize(80, 140);
    this.sprite.setOrigin(0.5, 1.0);
    this.sprite.setDepth(20);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setImmovable(false);
    this.sprite.body.allowGravity = false;
    this.sprite.setGravityY(0);
    this.sprite.y = this.floorY;

    if (!scene.anims.exists('player_idle')) {
      scene.anims.create({ key: 'player_idle', frames: [{ key: 'player_idle' }], frameRate: 1, repeat: -1 });
    }
    if (!scene.anims.exists('player_walk')) {
      scene.anims.create({
        key: 'player_walk',
        frames: [{ key: 'player_walk1' }, { key: 'player_walk2' }],
        frameRate: 8,
        repeat: -1,
      });
    }
    if (!scene.anims.exists('player_scared')) {
      scene.anims.create({ key: 'player_scared', frames: [{ key: 'player_scared' }], frameRate: 1, repeat: -1 });
    }
    if (!scene.anims.exists('player_death')) {
      scene.anims.create({ key: 'player_death', frames: [{ key: 'player_death' }], frameRate: 1, repeat: 0 });
    }
    if (!scene.anims.exists('player_relieved')) {
      scene.anims.create({ key: 'player_relieved', frames: [{ key: 'player_relieved' }], frameRate: 1, repeat: -1 });
    }

    this.sprite.play('player_idle');
    return this.sprite;
  }

  update(cursors, delta) {
    if (!this.sprite || this.isDead) return;

    if (this.hurtCooldown > 0) {
      this.hurtCooldown -= delta;
      this.sprite.setAlpha(Math.sin(this.hurtCooldown * 0.02) > 0 ? 1 : 0.4);
    } else {
      this.sprite.setAlpha(1);
    }

    if (!this.canMove) {
      this.sprite.setVelocityX(0);
      this.sprite.y = this.floorY;
      return;
    }

    if (cursors.left.isDown) {
      this.sprite.setVelocityX(-160);
      this.sprite.flipX = true;
      this.playAnim(this.isScared ? 'scared' : 'walk');
    } else if (cursors.right.isDown) {
      this.sprite.setVelocityX(160);
      this.sprite.flipX = false;
      this.playAnim(this.isScared ? 'scared' : 'walk');
    } else {
      this.sprite.setVelocityX(0);
      this.playAnim(this.isScared ? 'scared' : 'idle');
    }

    this.sprite.y = this.floorY;
    this.sprite.setVelocityY(0);

    // Passive sanity drain in total darkness
    if (this.scene.lightSystem) {
      const inDarkness = !this.scene.lightSystem.isActive() && !this.scene.lightSystem.roomLightIsOn;
      if (inDarkness && !this.scene.isPlayerProtectedByCat()) {
        this.sanity -= 8 * (delta / 1000);
        if (this.sanity <= 0) {
          this.sanity = 0;
          this.die();
        }
      }
    }
  }

  takeDamage(amount) {
    if (this.isDead) return;
    if (this.hurtCooldown > 0) return;

    // Full protection if player is behind the warning cat
    if (this.scene.isPlayerProtectedByCat && this.scene.isPlayerProtectedByCat()) {
      return;
    }

    const catState = this.scene.catSystem?.getState();
    const behindCat = this.scene.catSystem?.isPlayerBehind?.(this.sprite.x);

    let actualDamage = amount;
    if (catState === 'defending' && behindCat) {
      // Fully behind cat — no damage (handled in HorrorEventSystem)
      actualDamage = 0;
    } else if (catState === 'defending') {
      // Near cat but not fully behind — partial protection
      actualDamage = Math.floor(amount * 0.5);
      this.scene.showMessage('Stay behind the cat!', 1500);
    }
    // If cat was hissing and player ignored it — full damage, show consequence
    if (catState !== 'defending' && catState !== 'calm' && amount >= 40) {
      this.scene.showMessage('You ignored the cat\'s warning...', 2000);
    }

    if (actualDamage <= 0) return;

    this.sanity -= actualDamage;
    this.hurtCooldown = 1000;

    this.scene.cameras.main.flash(300, 150, 0, 0);

    if (this.scene.sounds?.ghost_whisper) {
      this.scene.sounds.ghost_whisper.play({ volume: 0.8 });
    }

    if (this.sanity <= 0) {
      this.sanity = 0;
      this.die();
    }
  }

  die() {
    this.isDead = true;
    this.canMove = false;
    this.sprite.play('player_death');

    if (this.scene.horrorEventSystem) {
      this.scene.horrorEventSystem.jumpscare(3);
    } else {
      if (this.scene.sounds?.jumpscare_sound) {
        this.scene.sounds.jumpscare_sound.play({ volume: 1.0 });
      }
      this.scene.time.delayedCall(1200, () => {
        this.scene.cameras.main.fadeOut(600, 0, 0, 0);
        this.scene.time.delayedCall(700, () => {
          this.scene.scene.start('GameOverScene');
        });
      });
    }
  }

  setScared(bool) {
    this.isScared = bool;
    if (bool) {
      this.playAnim('scared');
    }
  }

  lock() {
    this.canMove = false;
    if (this.sprite) this.sprite.setVelocityX(0);
  }

  unlock() {
    this.canMove = true;
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  playAnim(key) {
    const animKey = `player_${key}`;
    if (this.sprite.anims.currentAnim?.key !== animKey) {
      this.sprite.play(animKey);
      this.sprite.setDisplaySize(80, 140);
    }
  }
}
