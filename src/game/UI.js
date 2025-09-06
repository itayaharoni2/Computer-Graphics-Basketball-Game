export class UI {
    constructor() {
    // Cache DOM elements
    this.powerFill = document.getElementById("power-fill");
    this.powerValue = document.getElementById("power-value");
    // Stats elements
    this.scoreEl    = document.getElementById('stat-score');
    this.attemptEl  = document.getElementById('stat-attempts');
    this.madeEl     = document.getElementById('stat-made');
    this.accEl      = document.getElementById('stat-accuracy');
    this.msgEl      = document.getElementById('shot-message');
    }


    setPower(power) {
        if (!this.powerFill || !this.powerValue) return;

        const pct = Math.round(power * 100);
        this.powerFill.style.width = pct + "%";
        this.powerValue.textContent = pct + "%";
        this.powerFill.style.background = power > 0.66 ? "#22c55e" : power > 0.33 ? "#f59e0b" : "#ef4444";
    }

updateStats(gameState) {
    if (!gameState) return;
    if (this.scoreEl)   this.scoreEl.textContent   = String(gameState.score).padStart(2, '0');
    if (this.attemptEl) this.attemptEl.textContent = String(gameState.attempts);
    if (this.madeEl)    this.madeEl.textContent    = String(gameState.made);
    if (this.accEl)     this.accEl.textContent     = gameState.accuracy + '%';
    }

    /** Flash a temporary shot message */
flash(message, type = 'info') {
    if (!this.msgEl) return;
    this.msgEl.textContent = message;
    this.msgEl.classList.remove('msg-success', 'msg-miss', 'msg-info');
    this.msgEl.classList.add(type === 'success' ? 'msg-success'
                            : type === 'miss'   ? 'msg-miss'
                                                : 'msg-info');
    this.msgEl.style.opacity = '1';

    clearTimeout(this._msgTimer);
    this._msgTimer = setTimeout(() => {
        this.msgEl.style.opacity = '0';
    }, 1200);
}

}