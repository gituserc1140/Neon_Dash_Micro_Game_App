/**
 * player.js – Defines the Player object.
 *
 * The player character is a glowing rectangle that:
 *  - Stays at a fixed horizontal position (left-third of the canvas).
 *  - Occupies one of three vertical lanes.
 *  - Can jump upward briefly when the screen is tapped.
 *  - Changes lane instantly on left/right swipe.
 */

const Player = (() => {
  // ── constants ────────────────────────────────────────────────────────────
  const JUMP_VELOCITY = -14;   // upward speed on jump (px per frame, negative = up)
  const GRAVITY       = 0.7;   // downward acceleration per frame
  const WIDTH         = 40;    // sprite width (px)
  const HEIGHT        = 50;    // sprite height (px)
  const NEON_COLOR    = "#00ffff";
  const GLOW_COLOR    = "rgba(0,255,255,0.35)";

  // ── state ────────────────────────────────────────────────────────────────
  let lane      = 1;   // current lane index 0,1,2  (0 = top, 2 = bottom)
  let x         = 0;   // set by resize()
  let y         = 0;   // current vertical position (top of sprite)
  let baseY     = 0;   // resting y for current lane
  let vy        = 0;   // vertical velocity
  let isJumping = false;

  // ── public API ───────────────────────────────────────────────────────────

  /**
   * Called whenever the canvas is resized.
   * Recalculates x, baseY and snaps y to lane.
   * @param {number} cw  canvas width
   * @param {number} ch  canvas height
   * @param {number[]} laneYs  y-centre for each lane [0..2]
   */
  function resize(cw, ch, laneYs) {
    const prevBaseY = baseY;
    x     = Math.floor(cw * 0.15);
    baseY = laneYs[lane] - HEIGHT / 2;
    if (!isJumping) {
      y = baseY;
    } else {
      // Keep the same jump offset from the lane baseline across resizes.
      y += (baseY - prevBaseY);
    }
  }

  /** Move the player one lane to the left (lower index). */
  function moveLeft() {
    if (lane > 0) {
      lane  = lane - 1;
      baseY = _laneYs[lane] - HEIGHT / 2;
    }
  }

  /** Move the player one lane to the right (higher index). */
  function moveRight() {
    if (lane < 2) {
      lane  = lane + 1;
      baseY = _laneYs[lane] - HEIGHT / 2;
    }
  }

  /** Initiate a jump if not already airborne. */
  function jump() {
    if (!isJumping) {
      vy        = JUMP_VELOCITY;
      isJumping = true;
    }
  }

  /**
   * Update vertical position each frame.
   * Applies gravity; lands back on baseY.
   */
  function update() {
    if (isJumping) {
      vy += GRAVITY;
      y  += vy;
      if (y >= baseY) {
        y         = baseY;
        vy        = 0;
        isJumping = false;
      }
    } else {
      // Smoothly snap y toward baseY when lane changes (not jumping)
      y += (baseY - y) * 0.25;
    }
  }

  /**
   * Draw the player onto ctx as a neon-glowing rectangle.
   * @param {CanvasRenderingContext2D} ctx
   */
  function draw(ctx) {
    // Outer glow
    ctx.shadowColor = NEON_COLOR;
    ctx.shadowBlur  = 18;
    ctx.fillStyle   = GLOW_COLOR;
    ctx.fillRect(x - 4, y - 4, WIDTH + 8, HEIGHT + 8);

    // Main body
    ctx.fillStyle   = NEON_COLOR;
    ctx.shadowBlur  = 8;
    ctx.fillRect(x, y, WIDTH, HEIGHT);

    // Reset shadow so subsequent draws aren't affected
    ctx.shadowBlur  = 0;
    ctx.shadowColor = "transparent";
  }

  /**
   * Return the axis-aligned bounding box of the player for collision tests.
   * @returns {{ x: number, y: number, w: number, h: number }}
   */
  function getBounds() {
    return { x, y, w: WIDTH, h: HEIGHT };
  }

  /** Reset player to default state (used on restart). */
  function reset(laneYs) {
    lane      = 1;
    vy        = 0;
    isJumping = false;
    baseY     = laneYs[lane] - HEIGHT / 2;
    y         = baseY;
  }

  // Internal cache of lane centres (set by resize / reset)
  let _laneYs = [0, 0, 0];

  function resizeWithCache(cw, ch, laneYs) {
    _laneYs = laneYs;
    resize(cw, ch, laneYs);
  }

  function resetWithCache(laneYs) {
    _laneYs = laneYs;
    reset(laneYs);
  }

  return {
    moveLeft,
    moveRight,
    jump,
    update,
    draw,
    getBounds,
    resize: resizeWithCache,
    reset:  resetWithCache,
    get lane() { return lane; },
  };
})();
