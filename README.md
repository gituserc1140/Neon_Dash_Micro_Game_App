# Neon Dash 🎮

A fast, mobile‑friendly neon runner game built with plain HTML5 Canvas and vanilla JavaScript – no libraries required.

## How to Play

| Action | Mobile | Keyboard |
|--------|--------|----------|
| Switch lane left | Swipe ← | Arrow Left |
| Switch lane right | Swipe → | Arrow Right |
| Jump | Tap screen | Space / Arrow Up |
| Start / Restart | Tap screen | Enter |

- Dodge the **red obstacles** – touching one ends the game.
- Collect **yellow shards** – each shard is worth 10 points.
- The game speeds up over time; survive as long as you can!

## Project Structure

```
/docs
  index.html   – game shell, loads all scripts
  styles.css   – minimal full-screen dark theme
  player.js    – player state, lane switching, jump physics
  obstacles.js – obstacle spawning, movement, collision detection
  shards.js    – shard spawning, collection, scoring
  game.js      – main game loop, input handling, screen management
```

## Running Locally

Open `docs/index.html` directly in any modern browser, or serve the `/docs` folder with a local HTTP server:

```bash
# Python 3
python3 -m http.server 8080 --directory docs
# Then open http://localhost:8080
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Go to **Settings → Pages**.
3. Set **Source** to `Deploy from a branch`, branch `main`, folder `/docs`.
4. Save – GitHub Pages will publish the game at `https://<username>.github.io/<repo-name>/`.

The root `index.html` automatically redirects visitors to `./docs/`, so both the root URL and the `/docs/` URL work.

## Technical Notes

- Pure HTML5 Canvas rendering – rectangles with neon `shadowBlur` glow.
- No external libraries or frameworks.
- Touch events use `passive: false` to allow `preventDefault` (prevents accidental scroll while playing).
- Canvas is resized on every `window.resize` event to stay full‑screen on any device.
