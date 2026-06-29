import GameScene from './GameScene.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    this.add.rectangle(600, 300, 1200, 600, 0x000000);

    const ghost = this.add.image(600, 300, 'jumpscare');
    ghost.setDisplaySize(800, 600);
    ghost.setAlpha(0.3);

    this.add.text(600, 250, 'YOU WERE NOT ALONE', {
      fontFamily: 'Georgia, serif',
      fontSize: '48px',
      color: '#8B0000',
      stroke: '#4a0000',
      strokeThickness: 3,
      shadow: { offsetX: 2, offsetY: 4, color: '#3d0000', blur: 6, fill: true },
    }).setOrigin(0.5);

    // Check if a save exists
    const saveData = GameScene.loadGame();

    const restartText = this.add.text(600, 380, 'Press R to Restart', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    if (saveData) {
      const continueText = this.add.text(600, 430, 'Press C to Continue from Save', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ff88',
      }).setOrigin(0.5);

      this.tweens.add({
        targets: continueText,
        alpha: 0.3,
        duration: 600,
        yoyo: true,
        repeat: -1,
      });

      this.input.keyboard.once('keydown-C', () => {
        this.scene.start('GameScene', {
          roomId: saveData.roomId,
          inventory: saveData.inventory,
          puzzleStates: saveData.puzzleStates,
          playerStartX: saveData.playerStartX,
          fuseBoxSolved: saveData.fuseBoxSolved,
          battery: saveData.battery,
          flashlightIsOn: saveData.flashlightIsOn,
          sanity: Math.max(saveData.sanity, 50), // Restore with at least 50 sanity
          loadedFromSave: true,
        });
      });
    }

    if (!this.sound.get('jumpscare_sound')) {
      this.sound.add('jumpscare_sound');
    }
    const jumpscareSound = this.sound.get('jumpscare_sound');
    if (jumpscareSound && !jumpscareSound.isPlaying) {
      jumpscareSound.play({ volume: 0.6 });
    }

    this.input.keyboard.once('keydown-R', () => {
      GameScene.clearSave();
      this.registry.set('introPlayed', false);
      this.scene.start('GameScene', { roomId: 'living_room' });
    });
  }
}
