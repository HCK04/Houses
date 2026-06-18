# Maison Solène — Ultra-Luxury Villa Showcase

A single-page, editorial, cinematic direct-booking site. Obsidian + cream + champagne, high-contrast serif display type, GSAP-enhanced scroll motion with graceful fallbacks.

## Run it
No build step. Open `index.html` directly, or serve locally for video autoplay reliability:

```bash
# from this folder
python -m http.server 8080   # → http://localhost:8080
```

## Where to drop YOUR media
Create an `assets/` folder and add:

| File | Used by | Notes |
|------|---------|-------|
| `assets/hero-drone.mp4` | Hero background | Your Kling AI cinematic drone clip. Muted/looping. Keep it ≤ ~10 MB / well-compressed (H.264, ~1080p) for fast load. A poster image is already wired as the fallback. |
| `assets/interior-tour.mp4` | Cinematic Tour | Your HD interior walkthrough. Has a custom play button + poster. |

Gallery + experience images currently point to Unsplash placeholders — swap the `src` URLs in `index.html` for your own photography.

## Customise
- **Brand / copy:** edit text in `index.html` (search "Maison Solène").
- **Colours & type:** all tokens live at the top of `css/styles.css` under `:root`.
- **Form:** `initForm()` in `js/main.js` currently shows a confirmation only — wire it to your endpoint or a `mailto:` / form service (Formspree, Basin, etc.).

## Structure
```
index.html        semantic markup + media slots
css/styles.css    design tokens + full system + animations
js/main.js        modular ES6 (nav, reveals, magnetic, parallax, gallery, form)
```

## Notes
- All motion is transform/opacity (GPU-composited) and rAF-throttled for 60fps.
- `prefers-reduced-motion` is fully respected.
- GSAP + ScrollTrigger load via CDN; if blocked, an IntersectionObserver + rAF fallback keeps everything working.
