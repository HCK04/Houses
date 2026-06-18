# Kling AI Prompts — Maison Solène

Image-to-video prompts for your exterior/interior home photos, tuned for **scroll-interactive** playback on the site.

## The trick for scroll
Scroll-driven sections need video that is **slow, steady, single-direction, and loop-friendly** — so the clip can be "scrubbed" (frame position tied to scroll) or quietly looped behind text. So:

- **One camera move per clip.** Push-in, OR tilt-up, OR dolly — never a combo. Mixed moves look broken when scrubbed.
- **Slow + constant speed.** No easing, no acceleration, no sudden whips.
- **No cuts.** A single continuous shot, 5–10s.
- **Loopable where possible.** For ambient backgrounds (hero), aim for motion that can ping-pong.
- **Hold the start frame.** Your photo should still read clearly in the first ~0.5s.

### Kling settings (apply to all)
- Mode: **Image-to-Video** (upload your photo as the start frame)
- Model: **Kling 1.6 / 2.0+**, **Professional** mode
- Duration: **5s** (extend to 10s for hero)
- CFG / Creativity: **0.3–0.5** (low = stays faithful to your real house)
- Camera Movement: set the **specific** move named in each prompt; keep magnitude **low/medium**
- **Negative prompt (paste into every clip):**
  `distortion, warping walls, melting furniture, morphing architecture, extra windows, people, text, watermark, fast motion, camera shake, jump cut, blur, lens flare, oversaturated`

---

## 1 · HERO — Exterior establishing (the big drone-style background)
**Photo to use:** widest exterior shot (facade / pool / sea behind).
**Scroll role:** ambient loop behind the headline; subtle parallax already handled in CSS.

> Cinematic aerial establishing shot of a luxury modern villa, camera slowly pushing forward and gently rising, golden-hour light, calm sea on the horizon, gentle shimmer on the infinity pool, palm fronds barely swaying, ultra-smooth constant motion, photorealistic, shallow depth, film grain, anamorphic, 4K.

- Camera: **slow dolly-in + slight crane up**, low magnitude
- Save as: `assets/hero-drone.mp4`

---

## 2 · ENTERING THE HOUSE — the "walk inside" moment (your favorite idea)
**Photo to use:** front door / entry hallway shot.
**Scroll role:** scrub this to scroll — as the user scrolls down, the camera moves *through* the doorway into the home. Feels like you're walking in.

> First-person cinematic walk-through approaching a grand villa entrance, camera gliding smoothly forward through the open doorway into a sunlit interior, soft natural light spilling across stone floors, sheer curtains drifting gently, steady gimbal motion at constant speed, no cuts, photorealistic architectural visualization, warm and inviting, 4K.

- Camera: **forward dolly / "move through door"**, medium magnitude, constant speed
- This is the clip to tie to scroll position (see "Wiring" below)

---

## 3 · INTERIOR REVEAL — living pavilion
**Photo to use:** main living room / open-plan shot.
**Scroll role:** plays as the section enters viewport (reveal-on-scroll).

> Slow cinematic reveal of a luxury open-plan living room, camera drifting sideways in a smooth lateral dolly, late-afternoon sunlight, soft shadows moving subtly, floating dust motes in the light beams, completely steady constant motion, photorealistic interior design, warm neutral tones, 4K.

- Camera: **lateral dolly (left→right)**, low magnitude

---

## 4 · DETAIL — tilt-up on a feature (stairs / window wall / pool edge)
**Photo to use:** a tall vertical feature.
**Scroll role:** vertical scroll ↔ vertical camera tilt feels natural and tactile.

> Elegant vertical tilt revealing architectural detail, camera slowly craning upward at constant speed, soft directional light grazing the surfaces, gentle reflections, no people, ultra-stable cinematic motion, photorealistic, 4K.

- Camera: **tilt up**, low magnitude

---

## 5 · CINEMATIC TOUR — the embedded player clip
**Photo to use:** best hero interior.
**Scroll role:** plays on click in the Tour section (not scrubbed — full clip).

> Cinematic interior walkthrough of an ultra-luxury villa, smooth continuous gimbal glide through connected living spaces, soft golden light, curtains and water surfaces gently moving, serene and editorial, slow constant pace, photorealistic, anamorphic, 4K.

- Duration: **10s**, save as: `assets/interior-tour.mp4`

---

## Wiring a clip to scroll (the interactive part)
For the **"entering the house"** scrub effect (clip #2), tie the video's playback time to scroll progress instead of letting it autoplay. Drop this into `js/main.js` and add `data-scroll-video` to the section + a `<video data-scrub muted playsinline preload="auto">` inside it:

```js
/* Scrub a video's timeline to scroll progress over its section */
const initScrubVideo = () => {
  const section = document.querySelector("[data-scroll-video]");
  const video = section?.querySelector("[data-scrub]");
  if (!section || !video) return;

  const update = () => {
    const r = section.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress: 0 when section top hits bottom of screen, 1 when it leaves top
    const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
    if (video.duration) video.currentTime = p * video.duration;
  };

  // rAF-throttled (reuse your existing rafThrottle helper)
  window.addEventListener("scroll", rafThrottle(update), { passive: true });
  video.addEventListener("loadedmetadata", update);
};
```

Then call `initScrubVideo()` inside `init()`. Pin the section (`height: 200vh` with a `position: sticky` video) for a longer, more luxurious scrub. Want me to build that section out for you? Just say so.

## Tips
- **Render at the photo's aspect ratio** to avoid crop/warp. Hero/tour = 16:9; portrait details = 9:16 or 4:5.
- **Generate 2–3 variations** per prompt and keep the steadiest — Kling occasionally adds drift.
- **Compress before shipping:** H.264, ~1080p, target < 8 MB each (HandBrake or `ffmpeg -crf 24`). Scrubbing needs a small, keyframe-dense file to stay smooth.
- For smooth scrubbing add dense keyframes: `ffmpeg -i in.mp4 -g 12 -crf 23 -c:v libx264 out.mp4`
