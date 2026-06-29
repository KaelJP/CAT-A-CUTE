export default class MissionSystem {
  constructor(scene) {
    this.scene = scene;
    this.currentMission = null;
    this.completedMissions = [];

    this.panel = scene.add.graphics();
    this.panel.setScrollFactor(0);
    this.panel.setDepth(99);

    this.titleText = scene.add.text(1180, 16, '', {
      fontSize: '11px',
      color: '#aaffaa',
      fontFamily: 'monospace',
      fontStyle: 'bold',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(99);

    this.objectiveText = scene.add.text(1180, 32, '', {
      fontSize: '11px',
      color: '#ffffff',
      fontFamily: 'monospace',
      wordWrap: { width: 220 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(99);

    this.progressText = scene.add.text(1180, 70, '', {
      fontSize: '10px',
      color: '#88ccff',
      fontFamily: 'monospace',
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(99);
  }

  setMission(missionConfig) {
    if (!missionConfig) {
      this.currentMission = null;
      this.updateUI();
      return;
    }

    this.currentMission = {
      ...missionConfig,
      stepsComplete: 0,
      steps: missionConfig.steps.map((s) => ({ ...s, done: false })),
    };
    this.updateUI();
  }

  completeStep(stepKey) {
    if (!this.currentMission) return;
    const step = this.currentMission.steps.find((s) => s.key === stepKey);
    if (!step || step.done) return;

    step.done = true;
    this.currentMission.stepsComplete++;
    this.updateUI();

    const allDone = this.currentMission.steps.every((s) => s.done);
    if (allDone) {
      this.scene.time.delayedCall(400, () => this.completeMission());
    }
  }

  resetSteps() {
    if (!this.currentMission) return;
    this.currentMission.steps.forEach((s) => { s.done = false; });
    this.currentMission.stepsComplete = 0;
    this.updateUI();
  }

  completeMission() {
    if (!this.currentMission) return;

    const mission = this.currentMission;
    this.completedMissions.push(mission.id);
    this.scene.showMessage(`✓ ${mission.completeMessage}`, 3000);

    if (this.scene.sounds?.reveal_stinger) {
      this.scene.sounds.reveal_stinger.play({ volume: 0.6 });
    }

    if (mission.onComplete) {
      mission.onComplete();
    }

    this.currentMission = null;
    this.updateUI();
  }

  updateUI() {
    if (!this.currentMission) {
      this.panel.clear();
      this.titleText.setText('');
      this.objectiveText.setText('');
      this.progressText.setText('');
      return;
    }

    const done = this.currentMission.stepsComplete;
    const total = this.currentMission.steps.length;

    this.panel.clear();
    this.panel.fillStyle(0x000000, 0.65);
    this.panel.fillRect(960, 10, 226, 80);
    this.panel.lineStyle(1, 0x44ff44, 0.5);
    this.panel.strokeRect(960, 10, 226, 80);

    // Ensure HUD stays visible after overlay changes (e.g. light toggle)
    this.panel.setVisible(true);
    this.titleText.setVisible(true);
    this.objectiveText.setVisible(true);
    this.progressText.setVisible(true);

    this.titleText.setText(`▶ ${this.currentMission.title}`);

    const nextStep = this.currentMission.steps.find((s) => !s.done);
    this.objectiveText.setText(nextStep ? nextStep.description : 'All done!');

    this.progressText.setText(`Progress: ${done}/${total}`);
  }

  isMissionComplete(id) {
    return this.completedMissions.includes(id);
  }
}
