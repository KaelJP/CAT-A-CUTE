import BootScene from './scenes/BootScene.js';
import MenuScene from './scenes/MenuScene.js';
import IntroScene from './scenes/IntroScene.js';
import GameScene from './scenes/GameScene.js';
import GameOverScene from './scenes/GameOverScene.js';
import WinScene from './scenes/WinScene.js';
import PauseScene from './scenes/PauseScene.js';
import HowToPlayScene from './scenes/HowToPlayScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1200,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1200,
    height: 600,
    min: { width: 600, height: 300 },
  },
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false },
  },
  scene: [BootScene, MenuScene, IntroScene, GameScene, GameOverScene, WinScene, PauseScene, HowToPlayScene],
};

const game = new Phaser.Game(config);

// Force scale recalculation after window fully loads
window.addEventListener('load', () => {
  game.scale.refresh();
});
