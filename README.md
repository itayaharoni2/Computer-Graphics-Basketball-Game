# Interactive Basketball Court (Computer Graphics)

A fully interactive 3D basketball shooting game built with Three.js

## Group Members

- Itay Aharoni

---

## How to Run

**Option A (recommended) – Local static server**

```bash
# Node
npx serve .

# or Python
python3 -m http.server 8000
```

Then open: `http://localhost:8000/index.html`

**Option B – VS Code**  
Use the “Live Server” extension and open `index.html`.

> Notes:
>
> - ES modules & textures require a server (opening via `file://` may fail).
> - If you change JS files, do a **hard reload** (Cmd/Ctrl+Shift+R).

---

## Controls

- **Arrow Keys** — Move ball on court (idle mode).
- **W / S** — Increase / decrease shot power.
- **Space** — Shoot toward the nearest hoop (auto-target left/right).
- **R** — Reset ball to center (power → 50%).
- **C** — Toggle camera (main ↔ behind hoop).
- **O** — Toggle OrbitControls on/off.
- **T** — Start **Timed 60s** challenge.
- **F** — End timed challenge (back to Free Shoot).
- **Mouse (when OrbitControls enabled):**  
  Left-drag Orbit • Right-drag Pan • Scroll Zoom

---

## Features Overview

- **Realistic Physics**

  - Gravity-driven parabolic flight with air damping.
  - Floor bounces (restitution + friction) and sleep when slow.
  - Rim collision in the XZ plane with a vertical band.
  - Backboard planes (both sides) with restitution and tangential damping.
  - Rolling/spinning animations: rolling on floor, backspin in air.

- **Smart Scoring **

  - **Two-stage gate**: the ball must cross the **rim plane from above**, then travel **~1.4–1.6× radius downward** **while staying inside** the rim cylinder.
  - **Swish detection**: any rim touch cancels swish; clean makes get a bonus.
  - **Combo system**: consecutive makes add bonus points.

- **Game Modes & UI**

  - **Free Shoot** and **Timed 60s** (with countdown).
  - Live **score / attempts / made / accuracy**.
  - **Power bar** tied to shot power (0–100%).
  - **Messages** for made/missed/specials.
  - **Leaderboard (LocalStorage)**: best **Timed 60s** score + **Best Combo** saved locally.
  - **SFX** (score, rim, miss) and **Ball Trail** during flight.

- **Court & Cameras**
  - Full NBA-style court with lines, textures, and logos.
  - Accurate hoop geometry (10 ft height, 0.2286 m radius, 0.15 m from board).
  - Two cameras: main sideline + behind the hoop for better hoop vision.

---

## Physics Details

- **Flight:**  
  `v += g·dt`, `p += v·dt`, with small air damping per frame.
- **Rim Collision:**  
  Circle-of-tube in XZ at rim height; inner-clear region avoids false hits.
- **Backboard:**  
  Axis-aligned plane at `boardFrontX ± offset` per side; reflects X velocity.
- **Scoring Gate:**  
  Arm when crossing **rimY** from above near center → accumulate **downward** travel **inside** cylinder → score when depth threshold reached; mark **swish** if no rim touch.

---

## Project Structure (key files)

```
src/
  hw6.js                 # main entry (scene, loop, input, modes, UI)
  physics/Physics.js     # tunables: gravity, rim radius/height, offsets, bounds
  game/Input.js          # keyboard state (edge + level)
  game/GameState.js      # score/attempts/made/power + timed mode
  game/UI.js             # power/score/accuracy/messages
  game/BonusUI.js        # mode/timer/high-score panel
  BallController.js      # movement, collisions, scoring gate, rotation, shoot
  Hoops.js               # rim + backboard geometry and placement
  CourtLines.js          # painted court lines
  Basketball.js          # ball mesh + seams/texture
  SFX.js                 # simple WebAudio beeps
  BallTrail.js           # in-flight line trail
```

---

## Configuration

Edit **`src/physics/Physics.js`**:

- `RIM_HEIGHT = 3.048` (10 ft)
- `RIM_RADIUS = 0.2286`
- `BACKBOARD_OFFSET = 0.15` (rim center → board)
- `HOOPS.right.x = +12.806`, `HOOPS.left.x = -12.806`
- `RIM_BAND ≈ 0.08–0.12` (collision vertical band)

Tune **shoot arc** (in `BallController.shoot`): angle & speed range.  
Tune **power feel** (in `hw6.js`): `POWER_SPEED` and default power on reset.

---

**Implemented**

- Physics-based movement & rotation
- Rim/backboard/floor collisions
- Smart scoring gate + swish + combos
- Multiple hoops with auto-target
- Timed challenge (60s) & Free mode
- Leaderboard (LocalStorage)
- SFX & Ball Trail
- Robust UI (power, stats, messages, timer, mode)

---

## 🐞 Known Limitations

- Collisions are approximate; very high speeds may cause slight tunneling.
- Air spin is visual only (no Magnus force).

---

## External Assets & Libs

- **Three.js** (ES modules + examples/OrbitControls)
- **Textures:** `textures/WoodFloor.jpg`, `textures/nba_logo.png`, `textures/rubber_basketball.jpeg`
- **Fonts:** Orbitron via Google Fonts

---

## Performance Tips

- Prefer Chrome/Edge; keep one tab rendering.
- Use **hard reload** after code changes (Cmd/Ctrl+Shift+R).

## Video

[![Watch the demo](https://img.youtube.com/vi/ObtrQMPlvDI/hqdefault.jpg)](https://youtu.be/ObtrQMPlvDI)
