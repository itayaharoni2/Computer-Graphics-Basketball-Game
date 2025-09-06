export class SFX {
  constructor() { this._ctx = null; }
  _ctxGet() {
    if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this._ctx;
  }
  _beep(freq = 880, dur = 0.08, type = 'sine', gain = 0.2) {
    const ctx = this._ctxGet();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(g);
    g.connect(ctx.destination);

    const t = ctx.currentTime;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  }
  play(kind) {
    switch (kind) {
      case 'score': this._beep(1200, 0.12, 'square', 0.25); break;
      case 'rim':   this._beep(500,  0.05, 'sawtooth', 0.22); break;
      case 'miss':  this._beep(180,  0.08, 'sine',     0.18); break;
    }
  }
}
