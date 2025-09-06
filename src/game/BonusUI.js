export class BonusUI {
  constructor() {
    // Create container
    const root = document.createElement('div');
    root.id = 'bonus-ui';
    Object.assign(root.style, {
      position: 'fixed',
      top: '12px',
      right: '16px',
      padding: '10px 12px',
      background: 'rgba(15,23,42,0.68)',
      border: '1px solid rgba(148,163,184,0.25)',
      borderRadius: '10px',
      color: '#e2e8f0',
      fontFamily: 'system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif',
      fontSize: '13px',
      lineHeight: '1.25',
      backdropFilter: 'blur(4px)',
      pointerEvents: 'none',
      zIndex: '1000'
    });
    root.innerHTML = `
      <div><strong id="bonus-mode">Mode:</strong> <span id="bonus-mode-val">Free Shoot</span></div>
      <div><strong>Timer:</strong> <span id="bonus-timer">--</span></div>
      <div><strong>High Score (Timed 60s):</strong> <span id="bonus-hs">0</span></div>
      <div><strong>Best Combo:</strong> <span id="bonus-bestcombo">0</span></div>
      <div style="margin-top:6px;color:#94a3b8">T: Start 60s • F: Free</div>
    `;
    document.body.appendChild(root);

    this.modeEl = root.querySelector('#bonus-mode-val');
    this.timerEl = root.querySelector('#bonus-timer');
    this.hsEl = root.querySelector('#bonus-hs');
    this.bestComboEl = root.querySelector('#bonus-bestcombo');
  }
  setMode(text)        { this.modeEl.textContent = text; }
  setTimer(seconds)    { this.timerEl.textContent = (typeof seconds === 'number') ? `${seconds.toFixed(1)}s` : String(seconds); }
  setHighScore(score)  { this.hsEl.textContent = String(score); }
  setBestCombo(n)      { this.bestComboEl.textContent = String(n); }
}
