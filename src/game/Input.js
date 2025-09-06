export class Input {
    constructor() {
        this.keysDown = new Set();
        this.prevKeysDown = new Set();
        this.axis = { x: 0, z: 0 }; // x: left/right, z: forward/back
        this._bindEvents();
    }


    _bindEvents() {
        this._onKeyDown = (e) => { this.keysDown.add(e.code); };
        this._onKeyUp = (e) => { this.keysDown.delete(e.code); };


        window.addEventListener("keydown", this._onKeyDown);
        window.addEventListener("keyup", this._onKeyUp);
        window.addEventListener("blur", () => this.reset());
    }


    reset() {
        this.keysDown.clear();
        this.prevKeysDown.clear();
        this.axis.x = 0; this.axis.z = 0;
    }


    update() {
        const left = this.keysDown.has("ArrowLeft");
        const right = this.keysDown.has("ArrowRight");
        const up = this.keysDown.has("ArrowUp");
        const down = this.keysDown.has("ArrowDown");
        this.axis.x = (right ? 1 : 0) + (left ? -1 : 0);
        this.axis.z = (down ? 1 : 0) + (up ? -1 : 0);
        const mag = Math.hypot(this.axis.x, this.axis.z);
        if (mag > 1e-6) { this.axis.x /= mag; this.axis.z /= mag; }
    }


    isDown(code) { return this.keysDown.has(code); }

    // true only on the frame the key went down
    wasPressed(code) {
        const now  = this.keysDown.has(code);
        const prev = this.prevKeysDown.has(code);
        return now && !prev;
    }

    // call this ONCE per frame after you've read inputs
    postUpdate() {
        this.prevKeysDown = new Set(this.keysDown);
    }
}