import GameScene from './GameScene.js';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
    this.selectedIndex = 0;
    this.menuItems = [];
    this.menuTexts = [];
    this.cursorBar = null;
    this.cursorTween = null;
    this.saveData = null;
  }

  create() {
    const W = 1200;
    const H = 600;

    // Near-black background
    this.add.rectangle(W / 2, H / 2, W, H, 0x080808);

    // Right side — cat eyes image (fills right half, vertically centered)
    const catImg = this.add.image(W * 0.72, H / 2, 'cat_main_menu');
    catImg.setOrigin(0.5, 0.5);
    const imgScaleX = (W * 0.56) / catImg.width;
    const imgScaleY = H / catImg.height;
    catImg.setScale(Math.max(imgScaleX, imgScaleY));
    catImg.setDepth(0);

    // Subtle vignette overlay on the right side (darkens edges for atmosphere)
    const vignette = this.add.graphics();
    vignette.setDepth(1);
    vignette.fillGradientStyle(0x080808, 0x080808, 0x080808, 0x080808, 1, 1, 0, 0);
    vignette.fillRect(W * 0.42, 0, W * 0.12, H);

    // ── LEFT SIDE TITLE ───────────────────────────────────────────────
    const titleFont = '"Press Start 2P", "Courier New", monospace';

    // "CAT" — muted gray/white
    this.add.text(60, 50, 'CAT', {
      fontFamily: titleFont,
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#c8c8c8',
      letterSpacing: 6,
    }).setDepth(2);

    // "-A-" — muted gray/white
    this.add.text(60, 115, '-A-', {
      fontFamily: titleFont,
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#a0a0a0',
      letterSpacing: 6,
    }).setDepth(2);

    // "CUTE" — gold/yellow with glow
    const cuteText = this.add.text(60, 165, 'CUTE', {
      fontFamily: titleFont,
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#d4a017',
      letterSpacing: 6,
    }).setDepth(2);

    // Pulsing glow tween on CUTE
    this.tweens.add({
      targets: cuteText,
      alpha: { from: 1, to: 0.6 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // ── MENU ITEMS ────────────────────────────────────────────────────
    this.saveData = GameScene.loadGame();

    this.menuItems = [
      { label: 'New Game', action: 'new_game' },
      { label: 'Continue', action: 'continue', disabled: !this.saveData },
      { label: 'How to Play', action: 'how_to_play' },
    ];

    const menuStartY = 270;
    const menuLineH = 38;

    this.menuTexts = this.menuItems.map((item, i) => {
      const isDimmed = item.disabled;
      const t = this.add.text(76, menuStartY + i * menuLineH, item.label, {
        fontFamily: titleFont,
        fontSize: '18px',
        color: isDimmed ? '#444444' : '#888888',
        letterSpacing: 2,
      }).setDepth(2);

      t._selectTween = null;

      if (!item.disabled) {
        t.setInteractive({ useHandCursor: true });

        t.on('pointerover', () => {
          if (this.sound.context && this.sound.context.state === 'suspended') {
            this.sound.context.resume();
          }
          this.selectedIndex = i;
          this.updateMenuSelection();
        });

        t.on('pointerdown', () => {
          this.selectedIndex = i;
          this.confirm();
        });
      }

      return t;
    });

    // Cursor bar (blinking >> to the left of selected item)
    this.cursorBar = this.add.text(0, menuStartY, '>>', {
      fontFamily: titleFont,
      fontSize: '18px',
      color: '#d4a017',
    }).setDepth(3).setAlpha(1);

    this.cursorTween = this.tweens.add({
      targets: this.cursorBar,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    this.updateMenuSelection();

    // ── KEYBOARD NAVIGATION ───────────────────────────────────────────
    this.input.keyboard.on('keydown-UP', () => this.navigate(-1));
    this.input.keyboard.on('keydown-DOWN', () => this.navigate(1));
    this.input.keyboard.on('keydown-ENTER', () => this.confirm());

    // ── AMBIENT SOUND ────────────────────────────────────────────────
    if (this.sound.get('rain_thunder')) {
      this.sound.stopByKey('rain_thunder');
    }
    this.rainSound = this.sound.add('rain_thunder', { loop: true, volume: 0.7 });
    this.rainSound.play();

    this.input.once('pointerdown', () => {
      if (this.sound.context && this.sound.context.state === 'suspended') {
        this.sound.context.resume();
      }
    });

    // ── FOOTER TEXT ───────────────────────────────────────────────────
    this.add.text(16, H - 18, 'v1.0.0', {
      fontFamily: titleFont,
      fontSize: '10px',
      color: '#333333',
    }).setOrigin(0, 1).setDepth(2);

    this.add.text(W - 16, H - 18, '\u00A9 2025 CAT-A-CUTE Studio', {
      fontFamily: titleFont,
      fontSize: '10px',
      color: '#333333',
    }).setOrigin(1, 1).setDepth(2);
  }

  navigate(dir) {
    const count = this.menuItems.length;
    let next = (this.selectedIndex + dir + count) % count;
    let tries = 0;
    while (this.menuItems[next].disabled && tries < count) {
      next = (next + dir + count) % count;
      tries++;
    }
    this.selectedIndex = next;
    this.updateMenuSelection();
  }

  updateMenuSelection() {
    const menuStartY = 270;
    const menuLineH = 38;

    this.menuTexts.forEach((t, i) => {
      const item = this.menuItems[i];
      const isSelected = i === this.selectedIndex;

      if (t._selectTween) {
        t._selectTween.stop();
        t._selectTween = null;
      }

      if (item.disabled) {
        t.setColor('#444444');
        t.setText(item.label);
        return;
      }

      if (isSelected) {
        t.setColor('#d4a017');
        t.setText(item.label);
        t.setAlpha(1);
      } else {
        t.setColor('#888888');
        t.setText(item.label);
        t._selectTween = this.tweens.add({
          targets: t,
          alpha: 0.5,
          duration: 120,
          ease: 'Sine.easeOut',
          onComplete: () => { t._selectTween = null; },
        });
      }
    });

    // Position cursor to the left of selected item
    this.time.delayedCall(0, () => {
      if (!this.cursorBar || !this.menuTexts[this.selectedIndex]) return;
      const selText = this.menuTexts[this.selectedIndex];
      this.cursorBar.setPosition(
        selText.x - 36,
        menuStartY + this.selectedIndex * menuLineH
      );
    });
  }

  confirm() {
    const item = this.menuItems[this.selectedIndex];
    if (item.disabled) return;

    if (this.sound.context && this.sound.context.state === 'suspended') {
      this.sound.context.resume();
    }

    const fadeRain = (cb) => {
      if (this.rainSound) {
        this.tweens.add({
          targets: this.rainSound,
          volume: 0,
          duration: 400,
          onComplete: () => {
            this.rainSound.stop();
            cb();
          },
        });
      } else {
        cb();
      }
    };

    if (item.action === 'new_game') {
      fadeRain(() => {
        this.time.delayedCall(100, () => this.scene.start('IntroScene'));
      });
    } else if (item.action === 'continue' && this.saveData) {
      fadeRain(() => {
        this.time.delayedCall(100, () => {
          this.scene.start('GameScene', {
            roomId: this.saveData.roomId,
            inventory: this.saveData.inventory,
            puzzleStates: this.saveData.puzzleStates,
            playerStartX: this.saveData.playerStartX,
            fuseBoxSolved: this.saveData.fuseBoxSolved,
            battery: this.saveData.battery,
            flashlightIsOn: this.saveData.flashlightIsOn,
            sanity: this.saveData.sanity,
            firedTriggers: this.saveData.firedTriggers || null,
            escapeSequenceActive: this.saveData.escapeSequenceActive || false,
            roomLightStates: this.saveData.roomLightStates || {},
            completedMissions: this.saveData.completedMissions || [],
            loadedFromSave: true,
          });
        });
      });
    } else if (item.action === 'how_to_play') {
      if (this.rainSound) this.rainSound.stop();
      this.scene.start('HowToPlayScene');
    }
  }
}
