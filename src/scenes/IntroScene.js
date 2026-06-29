export default class IntroScene extends Phaser.Scene {
  constructor() {
    super('IntroScene');
    this.panelIndex = 0;
  }

  create() {
    this.panels = [
      'It was a stormy night. You were alone.',
      'Then... a black cat appeared at your door.',
      'You let it in. That was when the whispers began.',
    ];

    // Play rain ambience during intro
    this.rainSound = this.sound.add('rain_thunder', { loop: true, volume: 0.6 });
    this.rainSound.play();

    this.add.rectangle(600, 300, 1200, 600, 0x000000);

    this.panelText = this.add.text(600, 300, '', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '16px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: 700 },
      lineSpacing: 8,
    }).setOrigin(0.5);

    this.hintText = this.add.text(600, 500, 'Press E or Click to continue', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: '#666666',
    }).setOrigin(0.5);

    this.showPanel(0);

    this.eKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.input.on('pointerdown', () => this.advancePanel());
  }

  showPanel(index) {
    this.panelIndex = index;
    this.panelText.setText('');
    const fullText = this.panels[index];
    let charIndex = 0;

    if (this.typewriterEvent) this.typewriterEvent.remove();

    this.typewriterEvent = this.time.addEvent({
      delay: 40,
      repeat: fullText.length - 1,
      callback: () => {
        charIndex++;
        this.panelText.setText(fullText.substring(0, charIndex));
      },
    });

    this.panelTimer = this.time.delayedCall(3000, () => {
      if (this.panelIndex === index) this.advancePanel();
    });
  }

  advancePanel() {
    if (this.panelTimer) this.panelTimer.remove();

    if (this.panelIndex < this.panels.length - 1) {
      this.showPanel(this.panelIndex + 1);
    } else {
      // Stop rain before transitioning to game
      if (this.rainSound) this.rainSound.stop();
      this.scene.start('GameScene', { roomId: 'living_room' });
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.advancePanel();
    }
  }
}
