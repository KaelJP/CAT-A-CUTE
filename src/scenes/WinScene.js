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

    this.add.text(600, 180, 'The cat was never the danger.\nIt was your protector.', {
      fontFamily: 'Georgia, serif',
      fontSize: '24px',
      color: '#ffffff',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(600, 280, 'Thank you for playing CAT-A-CUTE', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#cccccc',
    }).setOrigin(0.5);

    const enterText = this.add.text(600, 500, 'Press ENTER to return to menu', {
      fontFamily: 'monospace',
      fontSize: '14px',
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
