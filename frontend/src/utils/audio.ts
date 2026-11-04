export type SoundSeverity = 'Success' | 'Warning' | 'Error' | 'Info';

class SoundPlayer {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  /**
   * Plays a synthesized alert sound based on severity and volume preferences.
   * Ensures zero dependencies or asset network requests.
   */
  public play(severity: SoundSeverity, volume: number = 0.5) {
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Primary Gain Node for master volume control
      const masterGain = this.audioCtx.createGain();
      masterGain.connect(this.audioCtx.destination);
      masterGain.gain.setValueAtTime(0, now);

      if (severity === 'Success') {
        // Double electronic chime (major third)
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.3);

        masterGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.05);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        // Second tone delayed
        const delay = 0.12;
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        gain2.connect(this.audioCtx.destination);
        gain2.gain.setValueAtTime(0, now + delay);

        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659.25, now + delay); // E5
        osc2.connect(gain2);
        osc2.start(now + delay);
        osc2.stop(now + delay + 0.3);

        gain2.gain.linearRampToValueAtTime(volume * 0.4, now + delay + 0.05);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28);

      } else if (severity === 'Warning') {
        // Triangle wave sliding down (moderate alert)
        const osc = this.audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now); // A4
        osc.frequency.exponentialRampToValueAtTime(349.23, now + 0.25); // F4
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.35);

        masterGain.gain.linearRampToValueAtTime(volume * 0.5, now + 0.04);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

      } else if (severity === 'Error') {
        // Low double sawtooth beep (disharmonious alert)
        const osc1 = this.audioCtx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, now); // A3
        osc1.connect(masterGain);
        osc1.start(now);
        osc1.stop(now + 0.15);

        masterGain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

        const delay = 0.16;
        const osc2 = this.audioCtx.createOscillator();
        const gain2 = this.audioCtx.createGain();
        gain2.connect(this.audioCtx.destination);
        gain2.gain.setValueAtTime(0, now + delay);

        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(220, now + delay);
        osc2.connect(gain2);
        osc2.start(now + delay);
        osc2.stop(now + delay + 0.15);

        gain2.gain.linearRampToValueAtTime(volume * 0.35, now + delay + 0.02);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.14);

      } else {
        // Info: High single clean ping
        const osc = this.audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now); // A5
        osc.connect(masterGain);
        osc.start(now);
        osc.stop(now + 0.2);

        masterGain.gain.linearRampToValueAtTime(volume * 0.4, now + 0.02);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      }
    } catch (e) {
      console.warn('Web Audio API play failed:', e);
    }
  }
}

export const soundPlayer = new SoundPlayer();
