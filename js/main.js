/* ============================================================================
   MAISON SOLÈNE — main.js
   ----------------------------------------------------------------------------
   Modular, dependency-light. GSAP + ScrollTrigger enhance the experience when
   present; everything degrades gracefully (IntersectionObserver fallback) so
   the site never breaks if the CDN is blocked.

   Each concern is an isolated init function, wired up in one place at the end:
     · preloader       — curtain reveal
     · navigation      — menu overlay + hide-on-scroll
     · reveals         — scroll-triggered text/element reveals
     · heroLines       — masked headline reveal on load
     · magneticButtons — pointer-tracked magnetic + liquid fill
     · parallax        — subtle depth on media (rAF-throttled)
     · galleryDrag     — click-drag horizontal scroll
     · tourPlayer      — custom play affordance
     · form            — floating-label submit handling

   Performance notes:
     · All visual motion is transform/opacity (GPU-composited).
     · Scroll/mouse work is throttled with requestAnimationFrame.
     · prefers-reduced-motion short-circuits heavy effects.
============================================================================ */

(() => {
  "use strict";

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = () => typeof window.gsap !== "undefined";

  /* ------------------------------------------------------------------ utils */
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // rAF throttle: collapses bursts of events into one paint-aligned call
  const rafThrottle = (fn) => {
    let ticking = false;
    return (...args) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => { fn(...args); ticking = false; });
    };
  };

  const lerp = (a, b, t) => a + (b - a) * t;

  /* =====================================================================
     PRELOADER — lift the curtain once the page (and fonts) are ready
  ===================================================================== */
  const initPreloader = () => {
    const el = $("[data-preloader]");
    if (!el) return;
    const reveal = () => setTimeout(() => el.classList.add("is-done"), 650);
    window.addEventListener("load", reveal, { once: true });
    // Safety net if 'load' is slow / already fired
    setTimeout(reveal, 2200);
  };

  /* =====================================================================
     NAVIGATION — full-screen menu + hide-on-scroll-down
  ===================================================================== */
  const initNavigation = () => {
    const nav    = $("[data-nav]");
    const toggle = $("[data-nav-toggle]");
    const menu   = $("[data-menu]");
    const links  = $$("[data-menu-link]");
    if (!nav || !toggle || !menu) return;

    let open = false;

    const setMenu = (state) => {
      open = state;
      menu.classList.toggle("is-open", open);
      toggle.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      menu.setAttribute("aria-hidden", String(!open));
      document.body.style.overflow = open ? "hidden" : "";
    };

    // Stagger index for each link's CSS entrance
    links.forEach((a, i) => a.style.setProperty("--i", i));

    toggle.addEventListener("click", () => setMenu(!open));
    links.forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) setMenu(false); });

    // Hide nav when scrolling down, reveal when scrolling up
    let lastY = window.scrollY;
    const onScroll = rafThrottle(() => {
      const y = window.scrollY;
      if (open) return;                       // never hide while menu is open
      nav.classList.toggle("is-hidden", y > lastY && y > 160);
      lastY = y;
    });
    window.addEventListener("scroll", onScroll, { passive: true });
  };

  /* =====================================================================
     REVEALS — elements with [data-reveal] slide+fade into view.
     Prefers GSAP ScrollTrigger; falls back to IntersectionObserver.
  ===================================================================== */
  const initReveals = () => {
    const items = $$("[data-reveal]");
    if (!items.length) return;

    if (REDUCED) { items.forEach((el) => el.classList.add("is-in")); return; }

    if (hasGSAP() && window.ScrollTrigger) {
      window.gsap.registerPlugin(window.ScrollTrigger);
      items.forEach((el) => {
        window.ScrollTrigger.create({
          trigger: el,
          start: "top 85%",
          once: true,
          onEnter: () => el.classList.add("is-in"),
        });
      });
      return;
    }

    // Fallback — native IntersectionObserver
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });

    items.forEach((el) => io.observe(el));
  };

  /* =====================================================================
     HERO LINES — masked headline lines rise on load (staggered)
  ===================================================================== */
  const initHeroLines = () => {
    const lines = $$("[data-reveal-line]");
    if (!lines.length) return;
    if (REDUCED) { lines.forEach((l) => l.classList.add("is-in")); return; }

    // Slight delay so it plays just after the preloader lifts
    setTimeout(() => {
      lines.forEach((line, i) => {
        line.style.transitionDelay = `${i * 120}ms`;
        line.classList.add("is-in");
      });
    }, 900);
  };

  /* =====================================================================
     MAGNETIC BUTTONS — the button drifts toward the cursor, and the
     liquid fill originates from the pointer position.
  ===================================================================== */
  const initMagnetic = () => {
    if (REDUCED || window.matchMedia("(hover: none)").matches) return;
    const buttons = $$("[data-magnetic]");

    buttons.forEach((btn) => {
      const fill = $(".btn-magnetic__fill", btn);
      const strength = 0.35;            // how far it leans toward the cursor

      const onMove = (e) => {
        const r = btn.getBoundingClientRect();
        const mx = e.clientX - r.left;
        const my = e.clientY - r.top;
        // Magnetic translate (relative to centre)
        const dx = (mx - r.width / 2) * strength;
        const dy = (my - r.height / 2) * strength;
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
        // Liquid fill origin follows the pointer
        if (fill) fill.style.transformOrigin = `${mx}px ${my}px`;
      };

      const reset = () => { btn.style.transform = "translate(0,0)"; };

      btn.addEventListener("mousemove", rafThrottle(onMove));
      btn.addEventListener("mouseleave", reset);
    });
  };

  /* =====================================================================
     PARALLAX — elements with [data-parallax="<factor>"] translate at a
     fraction of scroll speed. GSAP path is pinned/eased; fallback is a
     hand-rolled rAF loop with smoothing (lerp) for buttery motion.
  ===================================================================== */
  const initParallax = () => {
    if (REDUCED) return;
    const layers = $$("[data-parallax]");
    if (!layers.length) return;

    if (hasGSAP() && window.ScrollTrigger) {
      layers.forEach((el) => {
        const factor = parseFloat(el.dataset.parallax) || 0.12;
        const scope = el.closest("[data-parallax-scope]") || el.parentElement;
        window.gsap.to(el, {
          yPercent: factor * 100,
          ease: "none",
          scrollTrigger: {
            trigger: scope,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });
      return;
    }

    // Fallback — smoothed manual parallax
    const state = layers.map((el) => ({
      el,
      factor: parseFloat(el.dataset.parallax) || 0.12,
      current: 0,
    }));

    const tick = () => {
      const vh = window.innerHeight;
      state.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;   // skip off-screen
        const progress = (r.top + r.height / 2 - vh / 2) / vh; // -0.5..0.5-ish
        const target = -progress * s.factor * 100;
        s.current = lerp(s.current, target, 0.08);          // smoothing
        s.el.style.transform = `translate3d(0, ${s.current}px, 0)`;
      });
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* =====================================================================
     GALLERY DRAG — click-and-drag horizontal scrolling (desktop)
  ===================================================================== */
  const initGalleryDrag = () => {
    const track = $("[data-gallery]");
    if (!track) return;

    let down = false, startX = 0, startScroll = 0, moved = false;

    const start = (x) => { down = true; moved = false; startX = x; startScroll = track.scrollLeft; track.classList.add("is-dragging"); };
    const move  = (x) => {
      if (!down) return;
      const dx = x - startX;
      if (Math.abs(dx) > 4) moved = true;
      track.scrollLeft = startScroll - dx;
    };
    const end = () => { down = false; track.classList.remove("is-dragging"); };

    track.addEventListener("mousedown", (e) => { e.preventDefault(); start(e.pageX); });
    window.addEventListener("mousemove", rafThrottle((e) => move(e.pageX)));
    window.addEventListener("mouseup", end);

    // Prevent a drag from registering as an image click
    track.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); } }, true);

    // Translate vertical wheel into horizontal scroll for a desktop feel
    track.addEventListener("wheel", (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        track.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });
  };

  /* =====================================================================
     SCRUB VIDEO — tie the hero clip's timeline to scroll progress.
     A continuous rAF loop eases (lerps) the video's currentTime toward
     the scroll target, so playback glides instead of snapping frame to
     frame. Seeks are skipped while the decoder is already seeking, which
     keeps it smooth even on heavier files.
  ===================================================================== */
  const initScrubVideo = () => {
    const section = $("[data-scroll-video]");
    const video = section && $("[data-scrub]", section);
    if (!section || !video) return;

    video.pause();          // we drive the timeline manually
    video.muted = true;     // required for autoplay-policy-free seeking

    let ready = false;
    let current = 0;        // eased playhead (seconds)

    const markReady = () => { ready = true; };
    if (video.readyState >= 1) markReady();
    else video.addEventListener("loadedmetadata", markReady, { once: true });

    // Some browsers won't let us seek until a play() is kicked; do it muted
    // then immediately pause so the first frame decodes and seeking unlocks.
    const primePlayback = () => {
      const p = video.play();
      if (p && typeof p.then === "function") p.then(() => video.pause()).catch(() => {});
    };
    primePlayback();

    // Scroll progress through the tall hero track → 0..1
    const progress = () => {
      const scrollable = section.offsetHeight - window.innerHeight;
      if (scrollable <= 0) return 0;
      const scrolled = Math.min(Math.max(-section.getBoundingClientRect().top, 0), scrollable);
      return scrolled / scrollable;
    };

    // Reduced-motion: hold the first frame, no scroll-driven motion
    if (REDUCED) {
      video.addEventListener("loadeddata", () => { video.currentTime = 0; }, { once: true });
      return;
    }

    const tick = () => {
      if (ready && video.duration) {
        const target = progress() * video.duration;
        current = lerp(current, target, 0.12);                 // smoothing factor
        if (!video.seeking && Math.abs(target - current) > 0.015) {
          video.currentTime = current;
        }
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  /* =====================================================================
     TOUR PLAYER — custom play button overlays the native video
  ===================================================================== */
  const initTourPlayer = () => {
    const btn   = $("[data-tour-play]");
    const video = $(".tour__video");
    if (!btn || !video) return;

    btn.addEventListener("click", () => {
      video.play();
      btn.classList.add("is-hidden");
      video.setAttribute("controls", "");
    });
    video.addEventListener("pause", () => {
      if (!video.ended) btn.classList.remove("is-hidden");
    });
    video.addEventListener("ended", () => btn.classList.remove("is-hidden"));
  };

  /* =====================================================================
     FORM — floating-label inquiry, graceful (no backend) submit
  ===================================================================== */
  const initForm = () => {
    const form   = $("[data-form]");
    const status = $("[data-form-status]");
    if (!form) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();

      if (!name || !form.checkValidity()) {
        if (status) status.textContent = "Veuillez compléter les champs requis.";
        form.reportValidity?.();
        return;
      }

      // No backend wired here — replace with your endpoint / mailto handler.
      if (status) {
        status.textContent = `Merci, ${name.split(" ")[0]}. Notre directeur de la demeure vous contactera sous 24 heures.`;
      }
      form.reset();
    });
  };

  /* =====================================================================
     BOOTSTRAP
  ===================================================================== */
  const init = () => {
    initPreloader();
    initNavigation();
    initReveals();
    initHeroLines();
    initMagnetic();
    initParallax();
    initScrubVideo();
    initGalleryDrag();
    initTourPlayer();
    initForm();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
