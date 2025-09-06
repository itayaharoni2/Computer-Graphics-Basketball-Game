export class GameState {
    constructor() {
        this.mode = "idle";     // ball state: idle | flying
        this.power = 0.5;

        // Stats
        this.score = 0;
        this.attempts = 0;
        this.made = 0;

        // Combo
        this.combo = 0;
        this.bestCombo = 0;

        // Game modes
        this.modeName = "free";     // "free" | "timed60"
        this.challengeActive = false;
        this.timeLimit = 60;        // seconds
        this.timeLeft = 0;
    }

    get accuracy() {
        return this.attempts > 0 ? Math.round((this.made / this.attempts) * 100) : 0;
    }

    resetRoundStats() {
        this.score = 0;
        this.attempts = 0;
        this.made = 0;
        this.combo = 0;
    }

    startTimed(seconds = 60) {
        this.modeName = "timed60";
        this.challengeActive = true;
        this.timeLimit = seconds;
        this.timeLeft = seconds;
        this.resetRoundStats();
    }

    endTimed() {
        this.challengeActive = false;
        this.modeName = "free";
    }
}
