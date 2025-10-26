class SoundManager {
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  constructor() {
    this.loadSounds();
  }

  private loadSounds(): void {
    const soundTypes: Array<'add' | 'complete' | 'delete'> = ['add', 'complete', 'delete'];
    
    soundTypes.forEach(type => {
      const audio = new Audio(`assets/sounds/${type}.wav`);
      audio.preload = 'auto';
      this.audioCache.set(type, audio);
    });
  }

  playSound(type: 'add' | 'complete' | 'delete'): void {
    const audio = this.audioCache.get(type);
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(error => {
        console.warn('Failed to play sound:', error);
      });
    }
  }
}

export default SoundManager;