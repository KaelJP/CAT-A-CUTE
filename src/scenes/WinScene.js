export default class WinScene extends Phaser.Scene {
  constructor() {
    super('WinScene');
  }

  create() {
    this.add.image(600, 300, 'room_living_daylight').setDisplaySize(1200, 600);

    const cat = this.add.image(600, 530, 'cat_calm');
    cat.setDisplaySize(72, 52);
    cat.setOrigin(0.5, 1);
    cat.setDepth(15);

    // Headline — large, prominent
    this.add.text(600, 140, 'You Escaped!', {
      fontFamily: 'Georgia, serif',
      fontSize: '52px',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4,
      shadow: { offsetX: 2, offsetY: 3, color: '#00000066', blur: 6, fill: true },
      align: 'center',
    }).setOrigin(0.5);

    // Supporting text — medium, thematic
    this.add.text(600, 220, 'The cat was never the danger.\nIt was your protector all along.', {
      fontFamily: 'Georgia, serif',
      fontSize: '20px',
      color: '#e8e8e8',
      align: 'center',
      lineSpacing: 6,
    }).setOrigin(0.5);

    // Credits line — small, subdued
    this.add.text(600, 310, 'Thank you for playing CAT-A-CUTE', {
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
      color: '#aaaaaa',
      fontStyle: 'italic',
    }).setOrigin(0.5);

    // Prompt — small, blinking
    const enterText = this.add.text(600, 500, 'Press ENTER to return to menu', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#888888',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: enterText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.sound.play('win_jingle', { volume: 0.7 });

    this.input.keyboard.once('keydown-ENTER', () => {
      this.scene.start('MenuScene');
    });
  }
}
