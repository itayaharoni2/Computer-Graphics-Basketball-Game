export const PHYS = {
  clampDt(dt) {
    return Math.min(Math.max(dt, 0), 0.05);
  },

  // Downward acceleration (m/s^2)
  GRAVITY: -9.8,

  // Hoop positions (center of rim)
  HOOPS: {
    left:  { x: -12.806, y: 3.048, z: 0.0 }, // 10ft = 3.048m; x = boardFrontX(≈12.956) - 0.150
    right: { x:  12.806, y: 3.048, z: 0.0 }
  },

  // Court boundaries (+ the wood floor height)
  BOUNDS: {
    minX: -14.0,
    maxX:  14.0,
    minZ: -7.5,
    maxZ:  7.5,
    floorY: 0.05,
  },

  // Coefficients (tweak to taste)
  REST_COEFF_FLOOR: 0.55,       // bounciness on the floor
  REST_COEFF_RIM: 0.60,         // bounciness off rim
  REST_COEFF_BACKBOARD: 0.72,   // bounciness off backboard
  FRICTION_FLOOR: 0.90,         // horizontal velocity kept each floor bounce
  AIR_DAMP: 0.0025,             // per-step air drag multiplier
  SLEEP_LIN_VEL: 0.25,          // below this (m/s), consider resting on floor
  SLEEP_ANG_VEL: 0.35,          // for spin

  // Rim/backboard geometry (meters)
  RIM_RADIUS: 0.2286,   // inner radius = 18" / 2 * 0.0254
  RIM_HEIGHT: 3.048,    // exactly 10 ft
  BACKBOARD_OFFSET: 0.15, // rim center → board plane
  RIM_BAND: 0.10,
  BACKBOARD_HALF_W: 0.90,       // half-height coverage on Y
  BACKBOARD_HALF_Z: 0.75,       // half-width coverage on Z

};
