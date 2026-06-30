export default class PuzzleSystem {
  constructor() {
    this.scene = null;
    this.inventory = [];
    this.puzzleStates = {};
    this.interactables = [];
    this.promptText = null;
    this.fuseSequence = [];
    this.fuseConfig = null;
    this.glowGraphics = [];
  }

  create(scene) {
    this.scene = scene;

    this.promptText = scene.add.text(0, 0, '[ E ]', {
      fontSize: '14px',
      fill: '#ffffff',
      fontFamily: 'monospace',
      backgroundColor: '#000000aa',
      padding: { x: 6, y: 3 },
    });
    this.promptText.setOrigin(0.5, 1);
    this.promptText.setDepth(95);
    this.promptText.setVisible(false);
  }

  getSpriteKey(inter) {
    return inter.spriteKey || inter.sprite || null;
  }

  loadRoom(roomId, interactablesConfig) {
    this.interactables = interactablesConfig.map((i) => ({
      ...i,
      range: i.range || 80,
      collected: false,
      examined: false,
    }));
    this.fuseSequence = [];
    this.fuseConfig = this.interactables.find((i) => i.type === 'fuse_box') || null;

    for (const glow of this.glowGraphics) {
      if (glow && glow.destroy) glow.destroy();
    }
    this.glowGraphics = [];

    const floorY = this.scene.roomFloorY;
    const wallSwitchY = floorY - 90;

    for (const inter of this.interactables) {
      const spriteKey = this.getSpriteKey(inter);

      if (inter.type === 'item') {
        // Already collected (persisted in inventory) — don't recreate it.
        if (this.inventory.includes(inter.key)) {
          inter.collected = true;
          continue;
        }

        const itemY = inter.y ?? floorY;

        if (spriteKey) {
          const spr = this.scene.add.image(inter.x, itemY, spriteKey);
          spr.setOrigin(0.5, 1.0);
          spr.setDisplaySize(40, 40);
          spr.setDepth(6);
          inter.sprite = spr;
        }

        const glow = this.scene.add.graphics();
        glow.fillStyle(0xffff88, 0.7);
        glow.fillCircle(inter.x, itemY - 10, 10);
        glow.setDepth(5);
        this.scene.tweens.add({
          targets: glow,
          alpha: 0.2,
          duration: 800,
          yoyo: true,
          repeat: -1,
        });
        inter.glowGraphic = glow;
        this.glowGraphics.push(glow);
      } else if (inter.type === 'investigate') {
        const highlight = this.scene.add.graphics();
        highlight.fillStyle(0x88aaff, 0.35);
        highlight.fillCircle(inter.x, (inter.y ?? floorY) - 20, 14);
        highlight.setDepth(8);
        this.scene.tweens.add({
          targets: highlight,
          alpha: 0.1,
          duration: 900,
          yoyo: true,
          repeat: -1,
        });
        inter.highlightGraphic = highlight;
        this.glowGraphics.push(highlight);
      } else if (spriteKey) {
        if (inter.type === 'switch') {
          const spr = this.scene.add.image(inter.x, wallSwitchY, spriteKey);
          spr.setDisplaySize(22, 36);
          spr.setOrigin(0.5, 0.5);
          spr.setDepth(5);
          inter.sprite = spr;
        } else if (inter.type === 'door') {
          const spr = this.scene.add.image(inter.x, inter.y ?? floorY, spriteKey);
          spr.setDisplaySize(inter.doorWidth || 60, inter.doorHeight || 110);
          spr.setOrigin(0.5, 1.0);
          spr.setDepth(5);
          inter.sprite = spr;
        } else {
          const spr = this.scene.add.image(inter.x, floorY, spriteKey);
          spr.setOrigin(0.5, 1.0);
          spr.setDepth(5);
          inter.sprite = spr;
        }
      }
    }
  }

  getInteractableNear(playerX, range = 80) {
    return this.interactables.find((inter) => {
      if (inter.collected) return false;
      // fuse_box is a non-interactive config marker (holds correctSequence) —
      // never let it intercept an E-press meant for a nearby switch.
      if (inter.type === 'fuse_box') return false;
      if (inter.type === 'investigate' && inter.examined) return false;
      if (inter.requiresItem && !this.inventory.includes(inter.requiresItem)) return false;
      if (inter.key === 'examine_photo' && !this.inventory.includes('old_photo')) return false;
      if (inter.key === 'read_truth' && !this.inventory.includes('truth_note_obj')) return false;
      return Math.abs(playerX - inter.x) < (inter.range || range);
    }) || null;
  }

  update(playerX) {
    const near = this.getInteractableNear(playerX, 80);

    if (near) {
      this.promptText.setVisible(true);
      const promptY = near.type === 'switch'
        ? this.scene.currentRoom.floorY - 130
        : this.scene.currentRoom.floorY - 50;
      this.promptText.setPosition(near.x, promptY);
    } else {
      this.promptText.setVisible(false);
    }
  }

  interact(playerX) {
    const obj = this.getInteractableNear(playerX, 80);
    if (!obj) return;

    switch (obj.type) {
      case 'item':
        if (this.inventory.includes(obj.key)) return;
        this.inventory.push(obj.key);
        obj.collected = true;
        if (obj.glowGraphic) {
          obj.glowGraphic.destroy();
          obj.glowGraphic = null;
        }
        if (obj.sprite && obj.sprite.destroy) {
          obj.sprite.destroy();
          obj.sprite = null;
        }
        this.scene.showMessage(`Picked up: ${obj.label}`, 2000);
        this.interactables = this.interactables.filter((i) => i.key !== obj.key);

        if (obj.missionStep && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep(obj.missionStep);
        }
        if (obj.key === 'house_key' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('found_key');
        }
        if (obj.key === 'kitchen_key' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('hallway_key');
        }
        if (obj.key === 'old_photo' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('find_photo');
        }
        if (obj.key === 'truth_note_obj' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('find_note');
        }
        break;

      case 'door':
        if (obj.requiresItem && !this.inventory.includes(obj.requiresItem)) {
          this.scene.showMessage('The door is locked. You need a key.', 2000);
          return;
        }
        if (!obj.leadsTo) {
          this.scene.showMessage('It won\'t budge...', 2000);
          return;
        }

        if (obj.key === 'exit_door' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('use_door');
        }
        if (obj.key === 'hallway_exit_door' && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep('open_kitchen');
        }

        if (this.scene.sounds?.door_creak) {
          this.scene.sounds.door_creak.play({ volume: 0.7 });
        }
        if (obj.sprite) {
          obj.sprite.setTexture('door_open');
        }
        this.scene.time.delayedCall(600, () => {
          const entryX = obj.x >= 600 ? 120 : 100;
          this.scene.transitionToRoom(obj.leadsTo, entryX);
        });
        break;

      case 'switch':
        if (obj.puzzleId === 'fuse_box' && this.fuseConfig) {
          this.handleFuseSwitch(obj);
        } else if (this.scene.toggleRoomLight(obj)) {
          const isNowOn = this.scene.roomLightOn;
          this.scene.showMessage(isNowOn ? 'Light on.' : 'Light off.', 1200);
          if (this.scene.sounds?.switch_click) {
            this.scene.sounds.switch_click.play({ volume: 0.6 });
          }
          if (obj.sprite) {
            obj.sprite.setTint(isNowOn ? 0xffff99 : 0xffffff);
          }
        }
        break;

      case 'investigate':
        this.scene.showMessage(obj.description, 3000);
        if (obj.missionStep && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep(obj.missionStep);
        }
        if (obj.dialogueKey && this.scene.dialogueSystem) {
          this.scene.dialogueSystem.show(obj.dialogueKey);
        }
        if (obj.highlightGraphic) {
          obj.highlightGraphic.destroy();
          obj.highlightGraphic = null;
        }
        obj.examined = true;
        break;

      case 'note':
        if (obj.dialogueKey && this.scene.dialogueSystem) {
          this.scene.dialogueSystem.show(obj.dialogueKey);
        }
        if (obj.missionStep && this.scene.missionSystem) {
          this.scene.missionSystem.completeStep(obj.missionStep);
        }
        break;

      default:
        break;
    }
  }

  handleFuseSwitch(obj) {
    // Once power is restored, the switches are inert.
    if (this.puzzleStates.fuse_box) return;

    // CAT TRUST MECHANIC: the cat hisses near the wrong next switch.
    const catSystem = this.scene.catSystem;
    if (catSystem && catSystem.isWarning()) {
      const catX = catSystem.sprite?.x ?? 0;
      if (Math.abs(catX - obj.x) < 100) {
        this.scene.showMessage('The cat hisses at this switch...', 2000);
      }
    }

    const correct = this.fuseConfig.correctSequence;
    this.fuseSequence.push(obj.key);
    const idx = this.fuseSequence.length - 1;

    // Mark the matching mission step only when pressed in the correct position.
    if (obj.key === correct[idx] && this.scene.missionSystem) {
      this.scene.missionSystem.completeStep(obj.key);
    }

    // Wait until a full sequence has been entered before judging it.
    if (this.fuseSequence.length < correct.length) return;

    const solved = this.fuseSequence.every((k, i) => k === correct[i]);
    if (solved) {
      this.puzzleStates.fuse_box = true;
      this.scene.showMessage('The fuse box clicks into place.', 2000);
      this.scene.events.emit('puzzleSolved', 'fuse_box');
      this.scene.onFuseBoxSolved();
    } else {
      this.fuseSequence = [];
      this.scene.showMessage('Wrong order. The fuse resets.', 2000);
      // Punish ignoring the cat with a flicker scare
      if (this.scene.horrorEventSystem) {
        this.scene.horrorEventSystem.flickerLights(1500);
      }
      if (this.scene.missionSystem) {
        this.scene.missionSystem.resetSteps();
      }
    }
  }

  hasItem(key) {
    return this.inventory.includes(key);
  }

  isPuzzleSolved(id) {
    return !!this.puzzleStates[id];
  }
}
