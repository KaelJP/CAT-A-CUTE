export default class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlayScene');
  }

  create() {
    const W = 1200;
    const H = 600;

    // Near-black background matching main menu
    this.add.rectangle(W / 2, H / 2, W, H, 0x080808);

    // Title
    this.add.text(60, 36, 'HOW TO PLAY', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '42px',
      fontStyle: 'bold',
      color: '#d4a017',
      letterSpacing: 6,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: '#f5c518',
        blur: 14,
        fill: true,
      },
    }).setDepth(2);

    // Divider line
    const line = this.add.graphics();
    line.lineStyle(1, 0x333333, 1);
    line.beginPath();
    line.moveTo(60, 96);
    line.lineTo(W - 60, 96);
    line.strokePath();
    line.setDepth(2);

    // ── SHARED FONT STYLES ────────────────────────────────────────────
    const colFont = {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '13px',
      color: '#bbbbbb',
      wordWrap: { width: 310 },
      lineSpacing: 5,
    };
    const headFont = {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      fontStyle: 'bold',
      color: '#d4a017',
      letterSpacing: 2,
    };

    // Layout constants
    const col1X = 60;
    const col3X = 730;
    const topY = 116;      // Top row starts here
    // Each column header = 22px tall, body text at lineSpacing 5 with 13px font ≈ 18px per line.
    // "[ MOVEMENT ]" body: 8 lines ≈ 144px → ends ~282px from topY.
    // "[ SANITY ]" body: 15 lines ≈ 270px → ends ~408px from topY.
    // "[ THE CAT ]" body: 11 lines ≈ 198px → ends ~336px from topY.
    // Give the bottom row enough clearance: start at topY + 270 to safely clear all top blocks.
    const botY = topY + 272;

    // ── COLUMN 1 (left top): MOVEMENT ────────────────────────────────
    this.add.text(col1X, topY, '[ MOVEMENT ]', headFont).setDepth(2);
    this.add.text(col1X, topY + 26, [
      '← → Arrow Keys  Move left / right',
      '',
      'SPACE           Toggle flashlight',
      '                (drains battery)',
      '',
      'E               Interact with objects,',
      '                doors, or pet the cat',
      '',
      'ESC             Pause the game',
    ].join('\n'), colFont).setDepth(2);

    // ── COLUMN 2 (middle top): SANITY ────────────────────────────────
    const col2X = 380;
    this.add.text(col2X, topY, '[ SANITY ]', headFont).setDepth(2);
    this.add.text(col2X, topY + 26, [
      'Your sanity drains in total darkness',
      'when the flashlight is off and the',
      'room light is also off.',
      '',
      'When sanity runs out, you die.',
      '',
      'TERRIFIED STATE:',
      'Ghost events (whispers, flash ghosts)',
      'trigger a scared animation — you can',
      'still move freely. Only your sprite',
      'changes to show fear.',
      '',
      'Recovery:',
      '· Stand in room light (+2/sec)',
      '· Pet the cat when it is calm (+15)',
    ].join('\n'), colFont).setDepth(2);

    // ── COLUMN 3 (right top): THE CAT ────────────────────────────────
    this.add.text(col3X, topY, '[ THE CAT ]', headFont).setDepth(2);
    this.add.text(col3X, topY + 26, [
      'The cat warns you about danger.',
      '',
      'HISSING — stay behind the cat.',
      'DEFENDING — ghost is very close;',
      '  stay behind for full protection.',
      '',
      'If you walk PAST the cat while it',
      'warns you, sanity and battery drain',
      'fast. You also take full ghost damage.',
      '',
      'Wait 10 sec behind the cat to clear',
      'the danger and make it walk again.',
    ].join('\n'), colFont).setDepth(2);

    // ── COLUMN 1 (left bottom): DOORS & KEYS ─────────────────────────
    this.add.text(col1X, botY, '[ DOORS & KEYS ]', headFont).setDepth(2);
    this.add.text(col1X, botY + 26, [
      'Doors require keys to open.',
      'Walk close to a door and press E.',
      '',
      'If locked, the door will tell you',
      'what item you are missing.',
      '',
      '[ E ] prompt appears above any',
      'interactable object when you are',
      'close enough to use it.',
    ].join('\n'), colFont).setDepth(2);

    // ── COLUMN 3 (right bottom): OBJECTIVES ──────────────────────────
    this.add.text(col3X, botY, '[ OBJECTIVES ]', headFont).setDepth(2);
    this.add.text(col3X, botY + 26, [
      'Each room has a mission shown in',
      'the top-right corner of the screen.',
      '',
      'Complete all steps to unlock the',
      'next area. Steps complete one at a',
      'time as you find keys, interact with',
      'objects, and survive ghost events.',
      '',
      'The game ends when you survive until',
      'dawn in the living room.',
    ].join('\n'), colFont).setDepth(2);

    // ── BACK PROMPT ───────────────────────────────────────────────────
    const backText = this.add.text(W / 2, H - 30, '[ ESC / ENTER ]  Back to Menu', {
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: '15px',
      color: '#888888',
      letterSpacing: 2,
    }).setOrigin(0.5, 1).setDepth(2);

    // Blink the back prompt
    this.tweens.add({
      targets: backText,
      alpha: 0.35,
      duration: 900,
      yoyo: true,
      repeat: -1,
    });

    // ── INPUT ─────────────────────────────────────────────────────────
    this.input.keyboard.once('keydown-ESC', () => this.goBack());
    this.input.keyboard.once('keydown-ENTER', () => this.goBack());
  }

  goBack() {
    this.scene.start('MenuScene');
  }
}
