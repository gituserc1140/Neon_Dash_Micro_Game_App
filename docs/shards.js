/**
 * shards.js – Collectible neon shards that increase the player's score.
 *
 * Shards are small diamond shapes that travel leftward like obstacles.
 * Collecting one awards 10 points.
 */

const Shards = (() => {
  const COLOR      = "#ffe000";
  const GLOW_COLOR = "#ffe000";
  const SIZE       = 18;  // half-diagonal of the diamond (px)
  const POINTS     = 10;

  let items      = [];
  let spawnTimer = 0;
  let score      = 0;

  let _laneYs  = [0, 0, 0];
  let _canvasW = 400;

  // ── helpers ──────────────────────────────────────────────────────────────

  function _spawn() {
    const lane = Math.floor(Math.random() * 3);
    items.push({
      lane,
      x   : _canvasW + SIZE,
      y   : _laneYs[lane],
      size: SIZE,
    });
  }

  // ── public API ───────────────────────────────────────────────────────────

  /**
   * Update shard positions and check collection against the player.
   * @param {number} speed          current game speed (px/frame)
   * @param {number} spawnInterval  frames between shard spawns
   * @param {{ x,y,w,h }} playerBounds
   */
  function update(speed, spawnInterval, playerBounds) {
    // Move all shards leftward at game speed
    for (const s of items) {
      s.x -= speed;
    }

    // Check collection: player bounding-box vs shard centre circle
    const p = playerBounds;
    items = items.filter(s => {
      const collected =
        s.x > p.x - s.size &&
        s.x < p.x + p.w + s.size &&
        s.y > p.y - s.size &&
        s.y < p.y + p.h + s.size;
      if (collected) {
        score += POINTS;
        return false;  // remove shard
      }
      return s.x + s.size > -10;  // keep if still on screen
    });

    // Spawn new shards
    spawnTimer--;
    if (spawnTimer <= 0) {
      _spawn();
      spawnTimer = spawnInterval;
    }
  }

  /**
   * Draw all shards as neon-yellow diamonds.
   * @param {CanvasRenderingContext2D} ctx
   */
  function draw(ctx) {
    for (const s of items) {
      ctx.save();
      ctx.translate(s.x, s.y);

      ctx.shadowColor = GLOW_COLOR;
      ctx.shadowBlur  = 14;
      ctx.fillStyle   = COLOR;

      // Draw a diamond (rotated square)
      ctx.beginPath();
      ctx.moveTo(0, -s.size);
      ctx.lineTo(s.size * 0.6, 0);
      ctx.lineTo(0,  s.size);
      ctx.lineTo(-s.size * 0.6, 0);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur  = 0;
      ctx.shadowColor = "transparent";
      ctx.restore();
    }
  }

  /** Store canvas / lane metrics. */
  function resize(canvasW, laneYs) {
    _canvasW = canvasW;
    _laneYs  = laneYs;
  }

  /** Clear shards, reset score and spawn timer. */
  function reset(spawnInterval) {
    items      = [];
    spawnTimer = spawnInterval;
    score      = 0;
  }

  /** Return current accumulated score. */
  function getScore() { return score; }

  return { update, draw, resize, reset, getScore };
})();
