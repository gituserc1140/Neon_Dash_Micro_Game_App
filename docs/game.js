/**
 * game.js – Main game loop, input handling, rendering, and screen management.
 *
 * Screens:
 *  TITLE    – shown on load; tap/click starts the game.
 *  PLAYING  – active gameplay.
 *  GAMEOVER – shown on collision; tap/click restarts.
 *
 * Input:
 *  Swipe left/right  → change lane
 *  Tap / short swipe → jump
 *  Arrow keys        → change lane (keyboard fallback)
 *  Space / Up key    → jump (keyboard fallback)
 *
 * Rendering uses HTML5 Canvas with simple neon-glow shapes.
 */

// ── canvas setup ─────────────────────────────────────────────────────────────
const canvas = document.getElementById("gameCanvas");
const ctx    = canvas.getContext("2d");

// ── game constants ────────────────────────────────────────────────────────────
const LANE_COUNT      = 3;
const INITIAL_SPEED   = 5;     // px per frame
const MAX_SPEED       = 18;
const SPEED_INCREMENT = 0.0008; // added to speed each frame
const BASE_OBS_INTERVAL  = 90;  // frames between obstacle spawns at start
const MIN_OBS_INTERVAL   = 35;  // minimum frames between obstacle spawns
const BASE_SHARD_INTERVAL = 60; // frames between shard spawns

// ── game state ────────────────────────────────────────────────────────────────
let STATE    = "TITLE";  // "TITLE" | "PLAYING" | "GAMEOVER"
let speed    = INITIAL_SPEED;
let frameCount = 0;

// Computed lane geometry (recalculated on resize)
let laneYs   = [0, 0, 0];   // y-centre of each lane
let laneH    = 0;            // lane height

// ── input helpers ─────────────────────────────────────────────────────────────
let touchStartX = 0;
let touchStartY = 0;
const SWIPE_THRESHOLD = 30;  // px – minimum swipe distance to register as swipe

// ── canvas resize ─────────────────────────────────────────────────────────────

/**
 * Resize the canvas to fill the window while keeping a 9:16 portrait ratio on
 * narrow screens, or a capped landscape view on wider screens.
 * Notifies all subsystems of the new geometry.
 */
function resize() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer portrait layout on tall screens; landscape otherwise
  let cw, ch;
  if (vh / vw > 1.5) {
    // Tall/portrait phone
    cw = vw;
    ch = vh;
  } else {
    // Landscape or desktop – keep a playable aspect
    const ratio = 9 / 16;
    ch = vh;
    cw = Math.min(vw, Math.round(ch / ratio));
    if (cw > vw) { cw = vw; ch = Math.round(vw * ratio); }
  }

  canvas.width  = cw;
  canvas.height = ch;

  // Divide canvas height into three equal lanes
  laneH  = Math.floor(ch / LANE_COUNT);
  laneYs = [
    Math.floor(laneH * 0.5),
    Math.floor(laneH * 1.5),
    Math.floor(laneH * 2.5),
  ];

  // Notify subsystems
  Player.resize(cw, ch, laneYs);
  Obstacles.resize(cw, laneYs, laneH);
  Shards.resize(cw, laneYs);
}

// ── game control ──────────────────────────────────────────────────────────────

function startGame() {
  STATE      = "PLAYING";
  speed      = INITIAL_SPEED;
  frameCount = 0;
  Player.reset(laneYs);
  Obstacles.reset(BASE_OBS_INTERVAL);
  Shards.reset(BASE_SHARD_INTERVAL);
}

// ── input events ─────────────────────────────────────────────────────────────

/** Handle a user action (tap or swipe direction). */
function handleAction(action) {
  if (STATE === "TITLE" || STATE === "GAMEOVER") {
    if (action === "tap" || action === "start") startGame();
    return;
  }
  if (STATE === "PLAYING") {
    if (action === "left")  Player.moveLeft();
    if (action === "right") Player.moveRight();
    if (action === "jump" || action === "tap") Player.jump();
  }
}

// Touch input – swipe or tap
canvas.addEventListener("touchstart", e => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: false });

canvas.addEventListener("touchend", e => {
  e.preventDefault();
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (absDx < SWIPE_THRESHOLD && absDy < SWIPE_THRESHOLD) {
    // Short movement = tap
    handleAction("tap");
  } else if (absDx > absDy) {
    // Horizontal swipe
    handleAction(dx < 0 ? "left" : "right");
  } else {
    // Vertical swipe up = jump
    if (dy < 0) handleAction("jump");
  }
}, { passive: false });

// Keyboard fallback for desktop testing
window.addEventListener("keydown", e => {
  switch (e.key) {
    case "ArrowLeft":  handleAction("left");  break;
    case "ArrowRight": handleAction("right"); break;
    case "ArrowUp":
    case " ":          handleAction("jump");  break;
    case "Enter":      handleAction("start"); break;
  }
});

// Click/mouse fallback
canvas.addEventListener("click", () => handleAction("tap"));

// ── drawing helpers ───────────────────────────────────────────────────────────

/** Neon text helper – draws glowing text centred at (x, y). */
function neonText(text, x, y, size, color) {
  ctx.save();
  ctx.font         = `bold ${size}px "Courier New", monospace`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor  = color;
  ctx.shadowBlur   = 20;
  ctx.fillStyle    = color;
  ctx.fillText(text, x, y);
  // Second pass for brighter core
  ctx.shadowBlur   = 6;
  ctx.fillStyle    = "#ffffff";
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Draw scrolling lane divider lines for depth effect. */
let bgOffset = 0;
function drawBackground() {
  const cw = canvas.width;
  const ch = canvas.height;

  // Deep-space background
  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, cw, ch);

  // Subtle lane dividers
  ctx.strokeStyle = "rgba(0,200,255,0.12)";
  ctx.lineWidth   = 1;
  for (let i = 1; i < LANE_COUNT; i++) {
    const y = laneYs[i - 1] + laneH / 2;
    ctx.beginPath();
    ctx.setLineDash([20, 15]);
    ctx.moveTo(0, y);
    ctx.lineTo(cw, y);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Speed-lines (horizontal streaks that drift leftward)
  bgOffset = (bgOffset + speed * 0.6) % cw;
  ctx.strokeStyle = "rgba(0,150,255,0.08)";
  ctx.lineWidth   = 1;
  for (let i = 0; i < 8; i++) {
    const y  = (ch / 8) * i + ch / 16;
    const x0 = ((cw - bgOffset + (i * 137)) % cw);
    const len = 60 + i * 20;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(x0 - len, y);
    ctx.stroke();
  }
}

/** Draw HUD: score and current speed in the top-right corner. */
function drawHUD() {
  const score = Shards.getScore();
  const cw    = canvas.width;
  const fs    = Math.max(14, Math.floor(canvas.height * 0.04));

  ctx.save();
  ctx.font         = `bold ${fs}px "Courier New", monospace`;
  ctx.textAlign    = "right";
  ctx.textBaseline = "top";
  ctx.shadowColor  = "#00ffcc";
  ctx.shadowBlur   = 10;
  ctx.fillStyle    = "#00ffcc";
  ctx.fillText(`SCORE: ${score}`, cw - 14, 12);

  ctx.fillStyle   = "rgba(0,255,204,0.5)";
  ctx.shadowBlur  = 0;
  ctx.fillText(`SPD: ${speed.toFixed(1)}`, cw - 14, 12 + fs + 6);
  ctx.restore();
}

// ── title screen ──────────────────────────────────────────────────────────────

function drawTitle() {
  const cw = canvas.width;
  const ch = canvas.height;

  drawBackground();

  neonText("NEON DASH",   cw / 2, ch * 0.30, Math.floor(ch * 0.09), "#00ffff");
  neonText("Dodge obstacles · collect shards",
           cw / 2, ch * 0.46, Math.floor(ch * 0.032), "#ff80ff");

  // Controls hint
  const hint = Math.floor(ch * 0.028);
  ctx.save();
  ctx.font         = `${hint}px "Courier New", monospace`;
  ctx.textAlign    = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle    = "rgba(200,220,255,0.7)";
  ctx.fillText("Swipe ← → to change lane", cw / 2, ch * 0.56);
  ctx.fillText("Tap to jump",               cw / 2, ch * 0.61);
  ctx.restore();

  // Pulsing start button
  const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.05);
  ctx.save();
  ctx.globalAlpha = pulse;
  neonText("TAP TO START", cw / 2, ch * 0.76, Math.floor(ch * 0.045), "#ffe000");
  ctx.restore();
}

// ── game-over screen ──────────────────────────────────────────────────────────

function drawGameOver() {
  const cw    = canvas.width;
  const ch    = canvas.height;
  const score = Shards.getScore();

  drawBackground();

  neonText("GAME OVER",    cw / 2, ch * 0.32, Math.floor(ch * 0.09), "#ff2060");
  neonText(`SCORE: ${score}`, cw / 2, ch * 0.48, Math.floor(ch * 0.06), "#ffe000");

  const pulse = 0.85 + 0.15 * Math.sin(frameCount * 0.05);
  ctx.save();
  ctx.globalAlpha = pulse;
  neonText("TAP TO RESTART", cw / 2, ch * 0.68, Math.floor(ch * 0.042), "#00ffcc");
  ctx.restore();
}

// ── game loop ─────────────────────────────────────────────────────────────────

function gameLoop() {
  frameCount++;

  if (STATE === "TITLE") {
    drawTitle();
  } else if (STATE === "PLAYING") {
    // Gradually increase difficulty
    if (speed < MAX_SPEED) speed += SPEED_INCREMENT;
    const obsInterval = Math.max(
      MIN_OBS_INTERVAL,
      Math.floor(BASE_OBS_INTERVAL - frameCount * 0.04)
    );

    // Update subsystems
    Player.update();
    Obstacles.update(speed, obsInterval);
    Shards.update(speed, BASE_SHARD_INTERVAL, Player.getBounds());

    // Collision check
    if (Obstacles.checkCollision(Player.getBounds())) {
      STATE = "GAMEOVER";
    }

    // Render
    drawBackground();
    Obstacles.draw(ctx);
    Shards.draw(ctx);
    Player.draw(ctx);
    drawHUD();
  } else if (STATE === "GAMEOVER") {
    drawGameOver();
  }

  requestAnimationFrame(gameLoop);
}

// ── boot ─────────────────────────────────────────────────────────────────────

window.addEventListener("resize", resize);
resize();       // initial sizing
gameLoop();     // kick off the render loop
