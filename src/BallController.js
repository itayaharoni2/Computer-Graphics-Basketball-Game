import { PHYS } from "./physics/Physics.js";

export class BallController {
  /**
   * @param {THREE.Mesh} ballMesh - the basketball mesh
   * @param {GameState} state
   * @param {Input} input
   */
  constructor(ballMesh, state, input) {
    this.ball = ballMesh;
    this.state = state;
    this.input = input;

    // scoring/swish gate state
    this.scoredThisFlight = false;         // score once per shot
    this.rimTouchedThisFlight = false;     // any rim touch cancels swish
    this._gateDepth = 0;                   // downward travel while inside rim cyl
    this._prevY = this.ball.position.y;    // last Y (for gate delta)
    this._passedTopPlane = false;   // armed after crossing rim plane from above

    // motion state
    this.moveSpeed = 5.0;                  // idle move speed
    this.vx = 0; this.vy = 0; this.vz = 0;

    // rotation helpers
    this._up = new THREE.Vector3(0, 1, 0);
    this._tmpV = new THREE.Vector3();
    this._lastVel = new THREE.Vector3();
    this.spinFactorAir = 0.5;              // in-air spin factor

    // radius & start on floor
    if (!this.ball.userData.radius) {
      const r = this.computeRadiusFromGeometry(this.ball.geometry);
      this.ball.userData.radius = r ?? 0.12;
    }
    this.snapToFloor();
  }

  // derive radius from geometry
  computeRadiusFromGeometry(geom) {
    if (!geom) return null;
    geom.computeBoundingSphere?.();
    return geom.boundingSphere?.radius ?? null;
  }

  // set ball just above the wood floor
  snapToFloor() {
    const { floorY } = PHYS.BOUNDS;
    const r = this.ball.userData.radius;
    this.ball.position.y = floorY + r + 0.02;
  }

  // center reset + clear flight state
  resetToCenter() {
    const { floorY } = PHYS.BOUNDS;
    const r = this.ball.userData.radius;
    this.ball.position.set(0, floorY + r + 0.02, 0);
    this.vx = this.vy = this.vz = 0;
    this.state.mode = 'idle';
    this.scoredThisFlight = false;
    this.rimTouchedThisFlight = false;
    this._gateDepth = 0;
    this._prevY = this.ball.position.y;
    this._passedTopPlane = false;   // reset gate arming
  }

  // inside-cylinder test around rim center (XZ)
  isInsideRimCylinder(center, inner) {
    const dx = this.ball.position.x - center.x;
    const dz = this.ball.position.z - center.z;
    return Math.hypot(dx, dz) <= inner;
  }

  // gate scoring: require continuous downward travel inside rim cyl
  updateScoreGate(center) {
  if (this.scoredThisFlight) { this._prevY = this.ball.position.y; return; }

  const rBall = this.ball.userData.radius || 0.12;
  const rimY  = PHYS.RIM_HEIGHT;
  const y     = this.ball.position.y;
  const yPrev = this._prevY ?? y;
  const goingDown = this.vy < 0;

  // inner radii: looser for plane crossing, tighter for tracking
  const innerCross = PHYS.RIM_RADIUS - rBall * 0.05;
  const innerGate  = PHYS.RIM_RADIUS - rBall * 0.15;

  // 1) Arm only when we cross the rim plane from ABOVE near-center
  const topMargin = rBall * 0.30;
  const crossedTop = (yPrev > rimY + topMargin) && (y <= rimY + topMargin)
                   && this.isInsideRimCylinder(center, innerCross);
  if (crossedTop) { this._passedTopPlane = true; this._gateDepth = 0; }

  // 2) While armed, accumulate downward travel inside cylinder
  if (this._passedTopPlane && goingDown && this.isInsideRimCylinder(center, innerGate)) {
    const dy = Math.max(0, yPrev - y);
    this._gateDepth += dy;

    // require ball diameter travel and be below the rim plane
    if (this._gateDepth >= rBall * 1.4 && y < rimY - rBall * 0.20) {
      this.scoredThisFlight = true;
      const swish = !this.rimTouchedThisFlight;
      if (typeof this.onScore === 'function') this.onScore({ swish });
      this._gateDepth = 0;
      this._passedTopPlane = false;
    }
  }

  // 3) Disarm if we leave the cylinder, go up, or rise high again
  if (!goingDown || y > rimY + rBall * 0.60 || !this.isInsideRimCylinder(center, PHYS.RIM_RADIUS + rBall*0.05)) {
    this._passedTopPlane = false;
    this._gateDepth = 0;
  }

  this._prevY = y;
}


  // keep ball inside court bounds (XZ)
  applyBoundsXZ() {
    const { minX, maxX, minZ, maxZ } = PHYS.BOUNDS;
    const r = this.ball.userData.radius;
    const x = THREE.MathUtils.clamp(this.ball.position.x, minX + r, maxX - r);
    const z = THREE.MathUtils.clamp(this.ball.position.z, minZ + r, maxZ - r);
    this.ball.position.setX(x);
    this.ball.position.setZ(z);
  }

  // ground collision & bounce (also emits miss if flight ended with no score)
  handleFloorCollision() {
    const { floorY } = PHYS.BOUNDS;
    const r = this.ball.userData.radius;
    const minY = floorY + r + 0.02;

    if (this.ball.position.y < minY && this.vy < 0) {
      this.ball.position.y = minY;                     // snap
      this.vy *= -PHYS.REST_COEFF_FLOOR;              // bounce
      this.vx *= PHYS.FRICTION_FLOOR;                 // floor friction
      this.vz *= PHYS.FRICTION_FLOOR;

      const horiz = Math.hypot(this.vx, this.vz);
      if (Math.abs(this.vy) < PHYS.SLEEP_LIN_VEL && horiz < PHYS.SLEEP_LIN_VEL) {
        this.vx = this.vy = this.vz = 0;
        this.state.mode = 'idle';
        this.snapToFloor();
        if (!this.scoredThisFlight && typeof this.onMiss === 'function') this.onMiss(); // end-of-flight miss
      }
    }
  }

  // ring collision (circle in XZ at rim height)
  handleRimCollisionOne(center) {
    const rBall = this.ball.userData.radius;
    const R = PHYS.RIM_RADIUS;

    const rx = this.ball.position.x - center.x;
    const rz = this.ball.position.z - center.z;

    const dy = this.ball.position.y - PHYS.RIM_HEIGHT;
    if (Math.abs(dy) > PHYS.RIM_BAND) return;         // out of ring band

    const rho = Math.hypot(rx, rz);
    if (rho < 1e-6) return;

    // skip when well inside inner opening (no collision)
    const innerClear = R - rBall * 0.20;
    if (rho <= innerClear) return;

    const distToRing = Math.abs(rho - R);
    if (distToRing <= rBall) {
      const nx = rx / rho, nz = rz / rho;             // XZ normal
      const vn = this.vx * nx + this.vz * nz;         // approach speed along normal
      if (vn < 0) {
        const bounce = -(1 + PHYS.REST_COEFF_RIM) * vn;
        this.vx += bounce * nx;
        this.vz += bounce * nz;

        // mark rim touch once (breaks swish)
        if (!this.rimTouchedThisFlight) {
          this.rimTouchedThisFlight = true;
          if (typeof this.onRimHit === 'function') this.onRimHit();
        }

        this.vy += 0.2 * (dy < 0 ? 1 : 0);            // small anti-stick nudge
        const sign = (rho > R) ? 1 : -1;              // push out of tube
        const push = (rBall - distToRing + 1e-3) * sign;
        this.ball.position.x += nx * push;
        this.ball.position.z += nz * push;
      }
    }
  }

  handleRimCollision() {
    this.handleRimCollisionOne(PHYS.HOOPS.left);
    this.handleRimCollisionOne(PHYS.HOOPS.right);
  }

  // simple backboard planes per side
  handleBackboardCollision() {
    const rBall = this.ball.userData.radius;

    // right board (normal +X)
    {
      const hoop = PHYS.HOOPS.right;
      const planeX = hoop.x + PHYS.BACKBOARD_OFFSET;
      const withinY = Math.abs(this.ball.position.y - PHYS.RIM_HEIGHT) <= PHYS.BACKBOARD_HALF_W;
      const withinZ = Math.abs(this.ball.position.z - hoop.z) <= PHYS.BACKBOARD_HALF_Z;
      if (withinY && withinZ && this.ball.position.x + rBall > planeX && this.vx > 0) {
        this.ball.position.x = planeX - rBall;
        this.vx *= -PHYS.REST_COEFF_BACKBOARD;
        this.vy *= 0.98; this.vz *= 0.88;
      }
    }

    // left board (normal -X)
    {
      const hoop = PHYS.HOOPS.left;
      const planeX = hoop.x - PHYS.BACKBOARD_OFFSET;
      const withinY = Math.abs(this.ball.position.y - PHYS.RIM_HEIGHT) <= PHYS.BACKBOARD_HALF_W;
      const withinZ = Math.abs(this.ball.position.z - hoop.z) <= PHYS.BACKBOARD_HALF_Z;
      if (withinY && withinZ && this.ball.position.x - rBall < planeX && this.vx < 0) {
        this.ball.position.x = planeX + rBall;
        this.vx *= -PHYS.REST_COEFF_BACKBOARD;
        this.vy *= 0.98; this.vz *= 0.88;
      }
    }
  }

  /** step movement when idle (arrow keys) */
  step(dt) {
    if (this.state.mode === "idle") {
      const dx = this.input.axis.x * this.moveSpeed * dt;
      const dz = this.input.axis.z * this.moveSpeed * dt;

      if (dx || dz) { this.ball.position.x += dx; this.ball.position.z += dz; }
      this.applyBoundsXZ();
      this.snapToFloor();

      if (dt > 0) this._lastVel.set(dx / dt, 0, dz / dt);
      else this._lastVel.set(0, 0, 0);

      this.applyRotation(dt, true); // rolling on floor
      return;
    }

    if (this.state.mode === "flying") {
      this.stepFlying(dt);
      return;
    }
  }

  // integrate physics while airborne
  stepFlying(dt) {
    // air drag
    this.vx *= (1 - PHYS.AIR_DAMP);
    this.vy *= (1 - PHYS.AIR_DAMP * 0.5);
    this.vz *= (1 - PHYS.AIR_DAMP);

    // integrate velocity/pos
    this.vy += PHYS.GRAVITY * dt;
    this.ball.position.x += this.vx * dt;
    this.ball.position.y += this.vy * dt;
    this.ball.position.z += this.vz * dt;

    // bounds + collisions
    this.applyBoundsXZ();
    this.handleRimCollision();
    this.handleBackboardCollision();

    // scoring gate (nearest hoop)
    const center = (this.ball.position.x < 0) ? PHYS.HOOPS.left : PHYS.HOOPS.right;
    this.updateScoreGate(center);

    // floor collision & potential sleep/miss
    this.handleFloorCollision();

    // spin in air
    this.applyRotation(dt, false);
  }

  // rotate ball based on velocity (rolling vs flight)
  applyRotation(dt, isOnFloor) {
    const r = this.ball.userData.radius || 0.12;
    const v = this._tmpV.set(
      isOnFloor ? this._lastVel.x : this.vx,
      isOnFloor ? 0               : this.vy,
      isOnFloor ? this._lastVel.z : this.vz
    );
    const speed = v.length();
    if (speed < 1e-4) return;

    let axis, angle;
    if (isOnFloor) {
      axis = new THREE.Vector3().crossVectors(this._up, v).normalize(); // roll axis
      angle = (speed / r) * dt;
    } else {
      axis = v.normalize().clone();                                     // flight spin
      angle = ((this.spinFactorAir * speed / r) * dt) * -1;             // backspin
    }
    if (!isFinite(angle) || !axis.lengthSq()) return;
    const q = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    this.ball.quaternion.premultiply(q); // world-space rotate
  }

  // launch toward target with power-mapped speed
  shoot(power, target) {
    const px = this.ball.position.x, pz = this.ball.position.z;
    const dx = target.x - px, dz = target.z - pz;
    const horizLen = Math.hypot(dx, dz) || 1e-6;
    const dirX = dx / horizLen, dirZ = dz / horizLen;

    const speed = THREE.MathUtils.lerp(6.0, 18.0, power); // tuneable
    const angle = THREE.MathUtils.degToRad(55);           // shot arc
    const vHoriz = speed * Math.cos(angle);
    const vVert  = speed * Math.sin(angle);

    this.vx = dirX * vHoriz;
    this.vy = vVert;
    this.vz = dirZ * vHoriz;

    this.state.mode = "flying";
    this.scoredThisFlight = false;
    this.rimTouchedThisFlight = false;
    this._gateDepth = 0;
    this._prevY = this.ball.position.y;
    this._passedTopPlane = false;   // reset gate arming

  }
}
