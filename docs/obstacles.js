/**
 * obstacles.js – Obstacle pool that spawns and moves blockers toward the player.
 *
 * Each obstacle occupies one lane and travels rightward-to-leftward across the
 * canvas.  A low-obstacle flag marks obstacles the player can jump over.
 */

const Obstacles = (() => {
  const COLOR      = "#ff2060";
  const GLOW_COLOR = "#ff2060";
  const WIDTH      = 40;   // obstacle width (px)
  // Height depends on whether the obstacle is "low" (jumpable) or "tall"
  const HEIGHT_LOW  = 28;
  const HEIGHT_TALL = 50;

  let items    = [];   // active obstacles
  let spawnTimer = 0;  // frames until next spawn

  // These are set by resize() so obstacles know lane positions and canvas bounds
  let _laneYs  = [0, 0, 0];
  let _laneH   = 50;   // approximate lane height used for vertical centering
  let _canvasW = 400;

  // ── helpers ──────────────────────────────────────────────────────────────

  /** Create one obstacle in a random lane. */
  function _spawn(speed) {
    const lane    = Math.floor(Math.random() * 3);
    const isLow   = Math.random() < 0.4;  // 40% chance of a jumpable obstacle
    const h       = isLow ? HEIGHT_LOW : HEIGHT_TALL;
    const y       = _laneYs[lane] - h / 2;

    items.push({
      lane,
      x    : _canvasW + WIDTH,  // start just off the right edge
      y,
      w    : WIDTH,
      h,
      isLow,
    });
  }

  // ── public API ───────────────────────────────────────────────────────────

  /**
   * Update all obstacles each frame.
   * @param {number} speed   current game speed (px/frame)
   * @param {number} density frames between spawns (lower = denser)
   */
  function update(speed, density) {
    // Move existing obstacles leftward
    for (const obs of items) {
      obs.x -= speed;
    }

    // Remove obstacles that have scrolled off the left edge
    items = items.filter(obs => obs.x + obs.w > -10);

    // Spawn new obstacles
    spawnTimer--;
    if (spawnTimer <= 0) {
      _spawn(speed);
      spawnTimer = density;
    }
  }

  /**
   * Draw all obstacles onto ctx with a neon-red glow.
   * @param {CanvasRenderingContext2D} ctx
   */
  function draw(ctx) {
    for (const obs of items) {
      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur  = 15;
      ctx.fillStyle   = COLOR;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);

      // Lighter inner highlight
      ctx.fillStyle   = "rgba(255,100,130,0.5)";
      ctx.fillRect(obs.x + 4, obs.y + 4, obs.w - 8, Math.min(8, obs.h - 8));

      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
    }
  }

  /**
   * Check whether any obstacle overlaps the player bounds.
   * Uses simple AABB (axis-aligned bounding box) collision.
   * Returns true if a collision occurred.
   * @param {{ x, y, w, h }} playerBounds
   */
  function checkCollision(playerBounds) {
    const p = playerBounds;
    // Shrink collision box slightly for fairness
    const px = p.x + 6, py = p.y + 6, pw = p.w - 12, ph = p.h - 12;
    for (const obs of items) {
      if (
        px < obs.x + obs.w &&
        px + pw > obs.x &&
        py < obs.y + obs.h &&
        py + ph > obs.y
      ) {
        return true;
      }
    }
    return false;
  }

  /** Store canvas/lane metrics for use during spawning. */
  function resize(canvasW, laneYs, laneH) {
    _canvasW = canvasW;
    _laneYs  = laneYs;
    _laneH   = laneH;
  }

  /** Clear all obstacles and reset the spawn timer. */
  function reset(density) {
    items      = [];
    spawnTimer = density;
  }

  return { update, draw, checkCollision, resize, reset };
})();
