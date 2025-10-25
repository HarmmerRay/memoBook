class SoundManager {
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (error) {
      console.warn('AudioContext not supported:', error);
    }
  }

  playSound(type: 'add' | 'complete' | 'delete'): void {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    const currentTime = this.audioContext.currentTime;

    switch (type) {
      case 'add':
        // 叮咚声 (C4 -> E4)
        oscillator.frequency.setValueAtTime(261.63, currentTime);
        oscillator.frequency.setValueAtTime(329.63, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.3);
        break;

      case 'complete':
        // Yes 声音 (G4 -> C5)
        oscillator.frequency.setValueAtTime(392.00, currentTime);
        oscillator.frequency.setValueAtTime(523.25, currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;

      case 'delete':
        // 划擦声 (从高到低)
        oscillator.frequency.setValueAtTime(800, currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.2, currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.2);
        oscillator.type = 'sawtooth';
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);
        break;
    }
  }
}

export default SoundManager;