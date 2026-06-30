import GameScene from './GameScene.js';

export default class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  create() {
    // Full-size dead scene background (ghost_stage3 + player_death composite)
    const bg = this.add.image(600, 300, 'dead_scene');
    bg.setDisplaySize(1200, 600);

    // Pre-rendered blood-drip title image (Metal Mania font + custom drips, transparent PNG)
    this.add.image(600, 265, 'title_dead').setDisplaySize(900, 130);

    // Check if a save exists
    const saveData = GameScene.loadGame();

    const restartText = this.add.text(600, 360, 'Press R to Restart', {
      fontFamily: 'monospace',
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#00000066',
      padding: { x: 8, y: 4 },
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    if (saveData) {
      const continueText = this.add.text(600, 410, 'Press C to Continue from Save', {
        fontFamily: 'monospace',
        fontSize: '18px',
        color: '#88ff88',
        backgroundColor: '#00000066',
        padding: { x: 8, y: 4 },
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
