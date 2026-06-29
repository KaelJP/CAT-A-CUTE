import { DIALOGUE } from '../data/dialogueData.js';

export default class DialogueSystem {
  constructor() {
    this.scene = null;
    this.isOpen = false;
    this.queue = [];
    this.currentIndex = 0;
    this.onComplete = null;
    this.panel = null;
    this.portrait = null;
    this.speakerText = null;
    this.bodyText = null;
    this.hintText = null;
    this.typewriterEvent = null;
    this.displayedChars = 0;
    this.currentLine = '';
  }

  create(scene, playerSystem) {
    this.scene = scene;
    this.playerSystem = playerSystem;

    this.panel = scene.add.graphics();
    this.panel.setScrollFactor(0);
    this.panel.setDepth(98);

    this.portrait = scene.add.image(48, 520, 'berto_talking');
    this.portrait.setScrollFactor(0);
    this.portrait.setDepth(99);
    this.portrait.setDisplaySize(72, 120);
    this.portrait.setOrigin(0.5, 1.0);
    this.portrait.setVisible(false);

    this.speakerText = scene.add.text(100, 470, '', {
      fontFamily: 'monospace',
      fontSize: '14px',
      color: '#ffcc00',
    });
    this.speakerText.setScrollFactor(0);
    this.speakerText.setDepth(99);

    this.bodyText = scene.add.text(100, 495, '', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#ffffff',
      wordWrap: { width: 660 },
    });
    this.bodyText.setScrollFactor(0);
    this.bodyText.setDepth(99);

    this.hintText = scene.add.text(600, 575, 'Press E to continue', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#888888',
    });
    this.hintText.setScrollFactor(0);
    this.hintText.setDepth(99);
    this.hintText.setOrigin(0.5);

    this.hidePanel();
  }

  drawPanel() {
    this.panel.clear();
    this.panel.fillStyle(0x000000, 0.85);
    this.panel.fillRect(0, 460, 1200, 140);
  }

  show(dialogueKey, onComplete = null) {
    const lines = DIALOGUE[dialogueKey];
    if (!lines) return;

    this.queue = lines;
    this.currentIndex = 0;
    this.onComplete = onComplete;
    this.isOpen = true;

    if (this.playerSystem) this.playerSystem.lock();

    this.drawPanel();
    this.panel.setVisible(true);
    this.speakerText.setVisible(true);
    this.bodyText.setVisible(true);
    this.hintText.setVisible(true);

    this.displayLine(this.queue[0]);
  }

  displayLine(line) {
    if (this.typewriterEvent) {
      this.typewriterEvent.remove();
    }

    this.currentLine = line.text;
    this.displayedChars = 0;
    this.bodyText.setText('');

    const speakerNames = { player: 'You', berto: 'Mang Berto', cat: 'The Cat' };
    this.speakerText.setText(speakerNames[line.speaker] || line.speaker);

    if (line.speaker === 'berto' && line.portrait) {
      this.portrait.setTexture(line.portrait);
      this.portrait.setVisible(true);
    } else if (line.speaker === 'cat' && line.portrait) {
      this.portrait.setTexture(line.portrait);
      this.portrait.setVisible(true);
    } else {
      this.portrait.setVisible(false);
    }

    this.typewriterEvent = this.scene.time.addEvent({
      delay: 30,
      repeat: line.text.length - 1,
      callback: () => {
        this.displayedChars++;
        this.bodyText.setText(line.text.substring(0, this.displayedChars));
      },
    });
  }

  advance() {
    if (!this.isOpen) return;

    if (this.displayedChars < this.currentLine.length) {
      if (this.typewriterEvent) this.typewriterEvent.remove();
      this.bodyText.setText(this.currentLine);
      this.displayedChars = this.currentLine.length;
      return;
    }

    this.currentIndex++;
    if (this.currentIndex < this.queue.length) {
      this.displayLine(this.queue[this.currentIndex]);
    } else {
      this.close();
    }
  }

  close() {
    this.isOpen = false;
    this.hidePanel();

    if (this.playerSystem) this.playerSystem.unlock();

    const cb = this.onComplete;
    this.onComplete = null;
    if (cb) cb();
  }

  hidePanel() {
    this.panel.setVisible(false);
    this.portrait.setVisible(false);
    this.speakerText.setVisible(false);
    this.bodyText.setVisible(false);
    this.hintText.setVisible(false);
  }
}
