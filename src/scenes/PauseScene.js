export default class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create() {
    const { width, height } = this.scale;

    // Semi-transparent dark overlay
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.7)
      .setOrigin(0.5);

    // PAUSED title
    this.add.text(width / 2, height * 0.25, 'PAUSED', {
      fontFamily: 'Georgia, serif',
      fontSize: '42px',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Volume label
    this.add.text(width / 2, height * 0.45, 'Volume', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#cccccc',
    }).setOrigin(0.5);

    // Volume slider track
    const sliderX = width / 2 - 100;
    const sliderY = height * 0.52;
    const sliderWidth = 200;

    this.add.rectangle(width / 2, sliderY, sliderWidth, 6, 0x444444).setOrigin(0.5);

    // Volume slider handle
    const currentVolume = this.sound.volume;
    const handleX = sliderX + (currentVolume * sliderWidth);

    this.handle = this.add.circle(handleX, sliderY, 12, 0xffffff)
      .setInteractive({ draggable: true, useHandCursor: true });

    // Volume percentage text
    this.volumeText = this.add.text(width / 2, sliderY + 25, `${Math.round(currentVolume * 100)}%`, {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Drag logic for volume slider
    this.input.on('drag', (pointer, gameObject, dragX) => {
      if (gameObject !== this.handle) return;

      // Clamp handle within slider bounds
      const clampedX = Phaser.Math.Clamp(dragX, sliderX, sliderX + sliderWidth);
      gameObject.x = clampedX;

      // Calculate and apply volume
      const volume = (clampedX - sliderX) / sliderWidth;
      this.sound.volume = volume;
      this.volumeText.setText(`${Math.round(volume * 100)}%`);
    });

    // Resume button
    const resumeBtn = this.add.text(width / 2, height * 0.72, '▶  RESUME', {
      fontFamily: 'monospace',
      fontSize: '22px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    resumeBtn.on('pointerover', () => resumeBtn.setColor('#ffcc00'));
    resumeBtn.on('pointerout', () => resumeBtn.setColor('#ffffff'));
    resumeBtn.on('pointerdown', () => this.resumeGame());

    // Also resume on ESC key
    this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
  }

  resumeGame() {
    this.scene.resume('GameScene');
    this.scene.stop('PauseScene');
  }
}
