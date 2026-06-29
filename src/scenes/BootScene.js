export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    const loadImage = (key, path) => this.load.image(key, path);

    loadImage('player_idle', 'assets/images/player/player_idle.png');
    loadImage('player_walk1', 'assets/images/player/player_walk1.png');
    loadImage('player_walk2', 'assets/images/player/player_walk2.png');
    loadImage('player_scared', 'assets/images/player/player_scared.png');
    loadImage('player_death', 'assets/images/player/player_death.png');
    loadImage('player_relieved', 'assets/images/player/player_relieved.png');

    loadImage('cat_idle', 'assets/images/cat/cat_idle.png');
    loadImage('cat_walking1', 'assets/images/cat/cat_walking1.png');
    loadImage('cat_walking2', 'assets/images/cat/cat_walking2.png');
    loadImage('cat_hissing', 'assets/images/cat/cat_hissing.png');
    loadImage('cat_defending', 'assets/images/cat/cat_defending.png');
    loadImage('cat_calm', 'assets/images/cat/cat_calm.png');
    loadImage('cat_shield', 'assets/images/cat/cat_shield.png');
    loadImage('cat_heart', 'assets/images/cat/cat_heart.png');
    loadImage('cat_meter', 'assets/images/cat/cat_meter.png');
    loadImage('cat_main_menu', 'assets/images/cat/cat_main-menu.png');

    loadImage('ghost_stage0', 'assets/images/ghost/ghost_stage0.png');
    loadImage('ghost_stage1', 'assets/images/ghost/ghost_stage1.png');
    loadImage('ghost_stage2', 'assets/images/ghost/ghost_stage2.png');
    loadImage('ghost_stage3', 'assets/images/ghost/ghost_stage3.png');
    loadImage('jumpscare', 'assets/images/jumpscare/jumpscare.png');

    loadImage('berto_talking', 'assets/images/mang berto/berto_talking.png');
    loadImage('berto_worried', 'assets/images/mang berto/berto_worried.png');

    loadImage('door_closed', 'assets/images/objects/door_closed.png');
    loadImage('door_open', 'assets/images/objects/door_open.png');
    loadImage('light_switch', 'assets/images/objects/light_switch.png');
    loadImage('key', 'assets/images/objects/key.png');
    loadImage('kitchen_key', 'assets/images/objects/kitchen_key.png');
    loadImage('old_photo', 'assets/images/objects/old_photo.png');
    loadImage('crumpled_note', 'assets/images/objects/crumpled_note.png');

    loadImage('room_living', 'assets/images/rooms/room_living.png');
    loadImage('room_hallway', 'assets/images/rooms/room_hallway.png');
    loadImage('room_kitchen', 'assets/images/rooms/room_kitchen.png');
    loadImage('room_bedroom', 'assets/images/rooms/room_bedroom.png');
    loadImage('room_basement', 'assets/images/rooms/room_basement.png');
    loadImage('room_living_daylight', 'assets/images/rooms/room_living_daylight.png');

    this.load.audio('ambient_loop', 'assets/audio/ambient_loop.mp3');
    this.load.audio('rain_thunder', 'assets/audio/rain_thunder.mp3');
    this.load.audio('footstep', 'assets/audio/footstep.mp3');
    this.load.audio('light_click', 'assets/audio/light_click.mp3');
    this.load.audio('cat_hiss', 'assets/audio/cat_hiss.mp3');
    this.load.audio('ghost_whisper', 'assets/audio/ghost_whisper.mp3');
    this.load.audio('jumpscare_sound', 'assets/audio/jumpscare_sound.mp3');
    this.load.audio('stage_stinger', 'assets/audio/stage_stinger.mp3');
    this.load.audio('reveal_stinger', 'assets/audio/reveal_stinger.mp3');
    this.load.audio('win_jingle', 'assets/audio/win_jingle.mp3');
    this.load.audio('door_creak', 'assets/audio/door_creak.mp3');
    this.load.audio('switch_click', 'assets/audio/switch_click.mp3');
  }

  create() {
    // Ensure the Google Font is fully loaded and rendered before showing menu.
    // document.fonts.ready fires too early (download complete != paint complete).
    // Use a two-step approach: wait for fonts API, then add a short paint delay.
    const startMenu = () => {
      this.scale.refresh();
      this.scene.start('MenuScene');
    };

    if (document.fonts && document.fonts.load) {
      // Explicitly request the font load (triggers actual glyph rasterization)
      document.fonts.load('16px "Press Start 2P"').then(() => {
        // Additional frame delay to ensure browser has painted with the new font
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            startMenu();
          });
        });
      }).catch(() => {
        // Font load failed — start anyway with fallback
        startMenu();
      });
    } else {
      // No fonts API — just delay slightly
      this.time.delayedCall(400, () => startMenu());
    }
  }
}
