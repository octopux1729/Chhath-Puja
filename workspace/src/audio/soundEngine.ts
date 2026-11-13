// Raga Bhupali pentatonic frequencies (Sa Re Ga Pa Dha Sa' Re' Ga' Pa')
const BHUPALI_NOTES = [
  261.63, // C4 (Sa)
  293.66, // D4 (Re)
  329.63, // E4 (Ga)
  392.0,  // G4 (Pa)
  440.0,  // A4 (Dha)
  523.25, // C5 (Sa')
  587.33, // D5 (Re')
  659.25, // E5 (Ga')
  783.99, // G5 (Pa')
  880.0,  // A5 (Dha')
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  public setMuted(m: boolean) {
    this.muted = m;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Warm Tabla/Pakhawaj tactile thud + Santoor string pluck rising with streak
   */
  public playPlace(streakIndex: number, isWater: boolean = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // 1. Tactile Tabla / Wood thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    const startFreq = isWater ? 190 : 145;
    const endFreq = isWater ? 78 : 56;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.12);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);

    // 2. Melodic Santoor / Swarmandal note ascending in Raga Bhupali
    const noteFreq = BHUPALI_NOTES[Math.min(streakIndex, BHUPALI_NOTES.length - 1)];
    const pluck = ctx.createOscillator();
    const pluckHarm = ctx.createOscillator();
    const pluckGain = ctx.createGain();

    pluck.type = 'triangle';
    pluck.frequency.setValueAtTime(noteFreq, now);

    pluckHarm.type = 'sine';
    pluckHarm.frequency.setValueAtTime(noteFreq * 2, now);

    pluckGain.gain.setValueAtTime(0.001, now);
    pluckGain.gain.linearRampToValueAtTime(0.18, now + 0.012);
    pluckGain.gain.exponentialRampToValueAtTime(0.0008, now + 0.42);

    pluck.connect(pluckGain);
    pluckHarm.connect(pluckGain);
    pluckGain.connect(ctx.destination);

    pluck.start(now);
    pluckHarm.start(now);
    pluck.stop(now + 0.45);
    pluckHarm.stop(now + 0.45);

    if (isWater) {
      this.playWaterShimmer(now);
    }
  }

  private playWaterShimmer(now: number): void {
    const ctx = this.ctx;
    if (!ctx) return;

    // Gentle upward bubble glissando
    const bubble = ctx.createOscillator();
    const bGain = ctx.createGain();
    bubble.type = 'sine';
    bubble.frequency.setValueAtTime(360, now + 0.02);
    bubble.frequency.exponentialRampToValueAtTime(760, now + 0.16);

    bGain.gain.setValueAtTime(0.1, now + 0.02);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    bubble.connect(bGain);
    bGain.connect(ctx.destination);
    bubble.start(now + 0.02);
    bubble.stop(now + 0.2);
  }

  /**
   * Brass Temple Ghanti (Bell) chime for Shubh Sanyog Synergy!
   */
  public playSynergyBell(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const partials = [1046.5, 1567.98, 2110.0, 2637.02];
    partials.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + 0.04);

      const amp = 0.09 / (idx + 1);
      gain.gain.setValueAtTime(0.001, now + 0.04);
      gain.gain.linearRampToValueAtTime(amp, now + 0.055);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.85 - idx * 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + 0.04);
      osc.stop(now + 0.9);
    });
  }

  /**
   * Joyous Arghya Quest Complete fanfare (Temple Bells + Fifth Harmony)
   */
  public playQuestComplete(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const chord = [523.25, 659.25, 783.99, 1046.5];
    chord.forEach((freq, i) => {
      const t = now + i * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.9);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.95);
    });
  }

  public playRotate(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.06);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playRemove(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playShutter(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    // Crisp camera click + golden chime
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1318.5, now + 0.05);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playArghyaFinale(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Warm ceremonial Shankh-inspired harmonic swell + temple bells
    const swellNotes = [261.63, 392.0, 523.25];
    swellNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = idx === 0 ? 'sawtooth' : 'sine';

      // Soft lowpass filter for warm brass/conch timbre
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.frequency.setValueAtTime(freq * 0.98, now);
      osc.frequency.linearRampToValueAtTime(freq, now + 0.25);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(idx === 0 ? 0.06 : 0.11, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 2.2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.3);
    });

    setTimeout(() => this.playSynergyBell(), 280);
    setTimeout(() => this.playSynergyBell(), 680);
  }
}

export const soundEngine = new SoundEngine();
