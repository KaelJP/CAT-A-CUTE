export default class LightSystem {
  static BATTERY_RECHARGE_AMOUNT = 40;

  constructor() {
    this.scene = null;
    this.battery = 100;
    this.isOn = true;
    this.drainRate = 5;
    this.baseRadius = 160;
    this.currentRadius = 160;
    this.roomLightIsOn = false;
    this.darkOverlay = null;
    this.maskGraphics = null;
    this.batteryBar = null;
    this.batteryLabel = null;
    this.flickerTimer = null;
  }

  create(scene) {
    this.scene = scene;
    this.roomLightIsOn = false;

    this.darkOverlay = scene.add.graphics();
    this.darkOverlay.setScrollFactor(0);
    this.darkOverlay.setDepth(90);

    this.maskGraphics = scene.make.graphics({ x: 0, y: 0, add: false });

    this.batteryBar = scene.add.graphics();
    this.batteryBar.setScrollFactor(0);
    this.batteryBar.setDepth(100);

    this.batteryLabel = scene.add.text(16, 8, 'BATTERY', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
    });
    this.batteryLabel.setScrollFactor(0);
    this.batteryLabel.setDepth(100);
  }

  setRoomLight(isOn) {
    this.roomLightIsOn = isOn;
  }

  isPlayerProtected() {
    return this.roomLightIsOn || this.isActive();
  }

  update(delta, playerWorldX, playerWorldY) {
    if (this.roomLightIsOn) {
      this.darkOverlay.clearMask(true);
      this.darkOverlay.clear();
      this.darkOverlay.fillStyle(0x000000, 0.15);
      this.darkOverlay.fillRect(0, 0, 1200, 600);
      this.drawBatteryBar();
      return;
    }

    const cam = this.scene.cameras.main;
    const screenX = playerWorldX - cam.scrollX;
    const screenY = (playerWorldY - 56) - cam.scrollY;

    if (this.isOn && this.battery > 0) {
      // Don't drain battery while player is protected behind the cat
      const catProtected = this.scene.isPlayerProtectedByCat && this.scene.isPlayerProtectedByCat();
      if (!catProtected) {
        this.battery -= this.drainRate * (delta / 1000);
        this.battery = Math.max(0, this.battery);
        if (this.battery <= 0) this.isOn = false;
      }
    }

    this.currentRadius = this.isOn
      ? Phaser.Math.Linear(40, this.baseRadius, this.battery / 100)
      : 18;

    this.maskGraphics.clear();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillCircle(screenX, screenY, this.currentRadius);

    const mask = new Phaser.Display.Masks.BitmapMask(this.scene, this.maskGraphics);
    mask.invertAlpha = true;
    this.darkOverlay.clearMask(true);
    this.darkOverlay.setMask(mask);
    this.darkOverlay.clear();
    this.darkOverlay.fillStyle(0x000000, 0.93);
    this.darkOverlay.fillRect(0, 0, 1200, 600);

    this.drawBatteryBar();
  }

  drawBatteryBar() {
    this.batteryBar.clear();
    this.batteryBar.fillStyle(0x222222);
    this.batteryBar.fillRect(16, 22, 130, 12);
    const pct = this.battery / 100;
    const color = pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff2200;
    this.batteryBar.fillStyle(color);
    this.batteryBar.fillRect(16, 22, 130 * pct, 12);
  }

  toggle() {
    if (this.battery > 0) {
      this.isOn = !this.isOn;
      if (this.scene.sounds?.light_click) {
        this.scene.sounds.light_click.play({ volume: 0.5 });
      }
    }
  }

  flicker(duration) {
    if (this.flickerTimer) {
      this.flickerTimer.remove();
    }

    const original = this.isOn;
    this.flickerTimer = this.scene.time.addEvent({
      delay: 120,
      repeat: Math.floor(duration / 120),
      callback: () => { this.isOn = !this.isOn; },
    });

    this.scene.time.delayedCall(duration + 200, () => {
      this.isOn = original;
      if (this.flickerTimer) {
        this.flickerTimer.remove();
        this.flickerTimer = null;
      }
    });
  }

  forceOff() {
    this.isOn = false;
    this.battery = 0;
  }

  recharge(amount) {
    this.battery = Math.min(100, this.battery + amount);
    if (this.battery > 0 && !this.isOn) {
      this.isOn = true;
    }
  }

  isActive() {
    return this.isOn && this.battery > 0;
  }

  getBattery() {
    return this.battery;
  }
}
