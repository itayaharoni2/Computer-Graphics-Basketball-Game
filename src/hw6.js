import { OrbitControls } from './OrbitControls.js';
import { createCourtLines } from './CourtLines.js';
import { createHoops } from './Hoops.js';
import { createBasketball } from './Basketball.js';
import { Input } from "./game/Input.js";
import { GameState } from "./game/GameState.js";
import { PHYS } from './physics/Physics.js';
import { BallController } from "./BallController.js";
import { UI } from './game/UI.js';
import { SFX } from './SFX.js';
import { BallTrail } from './BallTrail.js';
import { BonusUI } from './game/BonusUI.js';

// Constants & leaderboard helpers
const POWER_SPEED = 0.6;          // power change per second
const HOOP_X = 12.806;             // right hoop X (left is -HOOP_X)
const LB_KEY = 'bb_leaderboard_v1';
function loadLB(){ try{ return JSON.parse(localStorage.getItem(LB_KEY))||{timed60:0,bestCombo:0}; }catch{ return {timed60:0,bestCombo:0}; } }
function saveLB(data){ localStorage.setItem(LB_KEY, JSON.stringify(data)); }
let leaderboard = loadLB();

// Scene & renderer
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
scene.background = new THREE.Color(0x000000);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
dirLight.position.set(-15, 10, 5);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 50;
scene.add(dirLight);
const fillLight1 = new THREE.PointLight(0xffffff, 0.3); fillLight1.position.set(-15,15,-10); scene.add(fillLight1);
const fillLight2 = new THREE.PointLight(0xffffff, 0.3); fillLight2.position.set( 15,15,-10); scene.add(fillLight2);
const fillLight3 = new THREE.PointLight(0xffffff, 0.3); fillLight3.position.set(  0,15, 15); scene.add(fillLight3);

// Globals created during setup
let ballMesh;     // the basketball mesh
let trail;        // flight trail
let activeCamera; // current camera
let controls;     // orbit controls
let isOrbitEnabled = true;

// Court builder (apron + wood + lines + hoops + ball)
function createBasketballCourt(){
  // Apron (out-of-bounds)
  const apron = new THREE.Mesh(
    new THREE.PlaneGeometry(32,19),
    new THREE.MeshStandardMaterial({ color:0xFDB927, roughness:0.5 })
  );
  apron.receiveShadow = true; apron.rotation.x = -Math.PI/2; apron.position.y = 0.00; scene.add(apron);

  // Wood floor
  const wood = new THREE.TextureLoader().load('/src/textures/WoodFloor.jpg');
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping; wood.repeat.set(14,8);
  const court = new THREE.Mesh(
    new THREE.PlaneGeometry(28,15),
    new THREE.MeshStandardMaterial({ map: wood, roughness:0.4 })
  );
  court.receiveShadow = true; court.rotation.x = -Math.PI/2; court.position.y = 0.05; scene.add(court);

  // Logos (sidelines)
  const logoTex = new THREE.TextureLoader().load('/src/textures/nba_logo.png');
  const logoMat = new THREE.MeshBasicMaterial({ map:logoTex, transparent:true, side:THREE.DoubleSide });
  const logoGeom = new THREE.PlaneGeometry(1.5, 0.75);
  const courtHalfW = 15/2, offsetX = 5.0, edge = 1;
  const logoLeft = new THREE.Mesh(logoGeom, logoMat); logoLeft.position.set( offsetX,0.06, -(courtHalfW+edge)); logoLeft.rotation.x = -Math.PI/2; scene.add(logoLeft);
  const logoRight = logoLeft.clone(); logoRight.position.set(-offsetX,0.06, +(courtHalfW+edge)); scene.add(logoRight);

  // Lines + hoops
  createCourtLines(scene);
  createHoops(scene);

  // Ball (with radius + start height)
  ballMesh = createBasketball(scene);
  ballMesh.geometry?.computeBoundingSphere?.();
  ballMesh.userData = ballMesh.userData || {};
  ballMesh.userData.radius = ballMesh.geometry?.boundingSphere?.radius || 0.12;
  ballMesh.position.y = PHYS.BOUNDS.floorY + ballMesh.userData.radius + 0.02;

  // Ball Trail
  trail = new BallTrail(scene, ballMesh, 48);
}

// Cameras (main + behind right hoop)
function createCameras(){
  const cameraMain = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  cameraMain.position.set(0,12,28);
  cameraMain.lookAt(0,0,0);

  const cameraBehindHoop = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 1000);
  cameraBehindHoop.position.set(HOOP_X + 2, 2.5, 0);
  cameraBehindHoop.lookAt(HOOP_X, 3.05, 0);

  return { cameraMain, cameraBehindHoop };
}

// Helpers: target hoop by side; keyboard camera toggles
function getNearestHoopCenter(){ const x = ballMesh.position.x; return (x < 0) ? PHYS.HOOPS.left : PHYS.HOOPS.right; }
function handleKeyDown(e){
  if (e.key === 'o') isOrbitEnabled = !isOrbitEnabled;
  if (e.key === 'c'){
    // swap camera while preserving orbit enabled flag
    activeCamera = (activeCamera === cams.cameraMain) ? cams.cameraBehindHoop : cams.cameraMain;
    controls = new OrbitControls(activeCamera, renderer.domElement);
    controls.target.set(activeCamera === cams.cameraMain ? 0 : HOOP_X, activeCamera === cams.cameraMain ? 0 : 3.05, 0);
    controls.enabled = isOrbitEnabled;
  }
}

// Timed challenge (start/end + leaderboard write)
function startTimedChallenge(seconds=60){
  if (gameState.challengeActive) return;
  gameState.startTimed(seconds);
  bonusUI.setMode('Timed 60s');
  bonusUI.setTimer(gameState.timeLeft);
  ui.flash('Timed Challenge: 60s — Go!', 'info');
}

function endTimedChallenge(){
  if (!gameState.challengeActive) return;
  gameState.endTimed();
  bonusUI.setMode('Free Shoot');
  bonusUI.setTimer('--');

  let updated = false;
  if ((leaderboard.timed60||0) < gameState.score){ leaderboard.timed60 = gameState.score; updated = true; }
  if ((leaderboard.bestCombo||0) < gameState.bestCombo){ leaderboard.bestCombo = gameState.bestCombo; updated = true; }
  if (updated){
    saveLB(leaderboard);
    bonusUI.setHighScore(leaderboard.timed60);
    bonusUI.setBestCombo(leaderboard.bestCombo);
    ui.flash(`New Record! Score ${leaderboard.timed60} | Best Combo ${leaderboard.bestCombo}`, 'success');
  } else {
    ui.flash(`Time! Score ${gameState.score} | Acc ${gameState.accuracy}% | Best Combo ${gameState.bestCombo}`, 'info');
  }
}

// Build scene (court, cameras, controls)
createBasketballCourt();
const cams = createCameras();
activeCamera = cams.cameraMain;
let controlsTarget = new THREE.Vector3(0,0,0);
let controlsInit = new OrbitControls(activeCamera, renderer.domElement);
controlsInit.target.copy(controlsTarget);
controls = controlsInit;

// Core systems (input/state/controllers/UI/clock/SFX/bonusUI)
const input = new Input();
const gameState = new GameState();
const ballController = new BallController(ballMesh, gameState, input);
const clock = new THREE.Clock();
const ui = new UI();
const sfx = new SFX();
const bonusUI = new BonusUI();
bonusUI.setMode('Free Shoot');
bonusUI.setTimer('--');
bonusUI.setHighScore(leaderboard.timed60 || 0);
bonusUI.setBestCombo(leaderboard.bestCombo || 0);
ui.setPower(gameState.power);
ui.updateStats(gameState);

// Event wiring (ball feedback + window events)
ballController.onRimHit = () => { sfx.play('rim'); };
ballController.onScore = (ev = {}) => {
  gameState.made += 1;
  gameState.combo = (gameState.combo || 0) + 1;
  gameState.bestCombo = Math.max(gameState.bestCombo || 0, gameState.combo);

  let points = 2;
  if (ev.swish) points += 1;                 // swish bonus
  points += Math.max(0, gameState.combo-1);  // combo bonus
  gameState.score += points;

  ui.updateStats(gameState);

  const parts = ['SHOT MADE!'];
  if (ev.swish) parts.push('SWISH +1');
  if (gameState.combo > 1) parts.push(`COMBO x${gameState.combo} +${gameState.combo-1}`);
  ui.flash(parts.join(' | '), 'success');

  if ((leaderboard.bestCombo||0) < gameState.bestCombo){
    leaderboard.bestCombo = gameState.bestCombo; saveLB(leaderboard); bonusUI.setBestCombo(leaderboard.bestCombo);
  }
  sfx?.play('score');
};
ballController.onMiss = () => {
  if (gameState.attempts > 0){ gameState.combo = 0; ui.flash('MISSED SHOT', 'miss'); sfx?.play('miss'); }
};
document.addEventListener('keydown', handleKeyDown);
window.addEventListener('resize', () => {
  const w = window.innerWidth, h = window.innerHeight;
  cams.cameraMain.aspect = w/h; cams.cameraMain.updateProjectionMatrix();
  cams.cameraBehindHoop.aspect = w/h; cams.cameraBehindHoop.updateProjectionMatrix();
  renderer.setSize(w, h);
});
window.addEventListener('blur', () => input.reset()); // clear keys on tab blur

// Main loop (input → game logic → render)
function animate(){
  requestAnimationFrame(animate);
  const dt = PHYS.clampDt(clock.getDelta());

  input.update(); // read keys

  // Mode hotkeys
  if (input.wasPressed('KeyT')) startTimedChallenge(60);
  if (input.wasPressed('KeyF')) endTimedChallenge();

  // Shoot once on Space (edge-triggered), block when timer ended
  if (input.wasPressed('Space') && gameState.mode === 'idle' && (!gameState.challengeActive || gameState.timeLeft > 0)){
    const target = getNearestHoopCenter();
    gameState.attempts += 1;
    ui.updateStats(gameState);
    ballController.shoot(gameState.power, target);
  }

  // Physics step + trail
  ballController.step(dt);
  trail.update(gameState.mode === 'flying', ballMesh.position);

  // Timer countdown (timed mode)
  if (gameState.challengeActive){
    gameState.timeLeft = Math.max(0, gameState.timeLeft - dt);
    bonusUI.setTimer(gameState.timeLeft);
    if (gameState.timeLeft <= 0) endTimedChallenge();
  }

  // Power control (W/S)
  if (input.isDown('KeyW')) gameState.power = Math.min(1, gameState.power + POWER_SPEED * dt);
  if (input.isDown('KeyS')) gameState.power = Math.max(0, gameState.power - POWER_SPEED * dt);
  ui.setPower(gameState.power);

  // Reset (R)
  if (input.wasPressed('KeyR')){
    ballController.resetToCenter();
    gameState.power = 0.5;
    ui.setPower(gameState.power);
    trail.clear();
  }

  // Camera orbit
  controls.enabled = isOrbitEnabled;
  controls.update?.();

  // Draw
  renderer.render(scene, activeCamera);

  // finalize input (edge detection)
  input.postUpdate();
}

// Kick-off
animate();
