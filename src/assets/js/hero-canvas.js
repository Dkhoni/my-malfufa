/**
 * ═══════════════════════════════════════════════════════
 *  HERO SCROLL CANVAS ANIMATION
 *  File: src/assets/js/hero-canvas.js
 *
 *  How it works:
 *  1. Preloads all image frames into memory
 *  2. Listens to window scroll events
 *  3. Maps scroll position → frame index
 *  4. Draws the correct frame on <canvas>
 *  5. Fades in text overlay after first frames load
 * ═══════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ── DOM Elements ──────────────────────────────────────
  const section   = document.getElementById('hero-scroll-section');
  const canvas    = document.getElementById('hero-canvas');
  const loader    = document.getElementById('hero-loader');
  const progress  = document.getElementById('hero-progress');
  const indicator = document.getElementById('scroll-indicator');
  const content   = document.getElementById('hero-content');

  // ── Guard: only run on pages that have the hero ───────
  if (!section || !canvas) return;

  const ctx = canvas.getContext('2d');

  // ── Config from data attributes on the section ────────
  const FRAME_COUNT = parseInt(section.dataset.frameCount) || 80;
  const BASE_URL    = section.dataset.baseUrl || '';

  // ── State ─────────────────────────────────────────────
  const images       = [];        // loaded Image objects
  let   currentFrame = 0;         // frame currently drawn
  let   loadedCount  = 0;         // how many frames loaded
  let   isReady      = false;     // all frames preloaded?
  let   rafId        = null;      // requestAnimationFrame id
  let   targetFrame  = 0;         // frame we're animating toward (for smoothing)

  // ── Canvas sizing ─────────────────────────────────────
  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    drawFrame(currentFrame); // redraw after resize
  }

  // ── Build frame URL ───────────────────────────────────
  // Frames should be named: frame_001.jpg, frame_002.jpg ...
  function getFrameUrl(index) {
    const num = String(index + 1).padStart(3, '0'); // 001, 002, 003 ...
    return `${BASE_URL}frame_${num}.jpg`;
  }

  // ── Draw a single frame on the canvas ─────────────────
  function drawFrame(index) {
    const img = images[index];
    if (!img || !img.complete) return;

    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Cover-fit: keep aspect ratio, fill entire canvas
    const canvasRatio = canvas.width / canvas.height;
    const imgRatio    = img.naturalWidth / img.naturalHeight;

    let drawW, drawH, drawX, drawY;

    if (canvasRatio > imgRatio) {
      // Canvas is wider — fit to width
      drawW = canvas.width;
      drawH = canvas.width / imgRatio;
      drawX = 0;
      drawY = (canvas.height - drawH) / 2;
    } else {
      // Canvas is taller — fit to height
      drawH = canvas.height;
      drawW = canvas.height * imgRatio;
      drawX = (canvas.width - drawW) / 2;
      drawY = 0;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  // ── Smooth animation loop ─────────────────────────────
  // Instead of jumping directly to target frame,
  // we ease toward it for a silky smooth feel
  function animationLoop() {
    const diff = targetFrame - currentFrame;

    if (Math.abs(diff) > 0.5) {
      // Ease: move 20% of the remaining distance each frame
      currentFrame += diff * 0.2;
      drawFrame(Math.round(currentFrame));
    } else {
      currentFrame = targetFrame;
      drawFrame(currentFrame);
    }

    rafId = requestAnimationFrame(animationLoop);
  }

  // ── Map scroll position to frame index ────────────────
  function onScroll() {
    if (!isReady) return;

    const sectionTop    = section.getBoundingClientRect().top + window.scrollY;
    const sectionHeight = section.offsetHeight - window.innerHeight;
    const scrolled      = window.scrollY - sectionTop;
    const progress      = Math.max(0, Math.min(1, scrolled / sectionHeight));

    // Map 0→1 progress to 0→(FRAME_COUNT-1) frame index
    targetFrame = Math.round(progress * (FRAME_COUNT - 1));

    // Hide scroll indicator after user starts scrolling
    if (scrolled > 50) {
      indicator && (indicator.style.opacity = '0');
    } else {
      indicator && (indicator.style.opacity = '1');
    }
  }

  // ── Preload all frames ────────────────────────────────
  // We load them in two waves:
  // Wave 1: first 10 frames immediately (fast start)
  // Wave 2: rest of frames in background
  function preloadFrames() {
    const FAST_LOAD = Math.min(10, FRAME_COUNT); // first N frames load first

    let fastLoaded = 0;

    function onFrameLoaded() {
      loadedCount++;
      fastLoaded++;

      // Update loading bar
      const pct = Math.round((loadedCount / FRAME_COUNT) * 100);
      if (progress) progress.style.width = pct + '%';

      // After first FAST_LOAD frames, show canvas and start playing
      if (fastLoaded === FAST_LOAD && !isReady) {
        isReady = true;
        drawFrame(0);
        hideLader();
        revealContent();
        startAnimationLoop();
      }
    }

    function onFrameError(img, index) {
      // If a frame fails to load, still count it
      // to avoid the loader getting stuck
      console.warn(`[Hero Canvas] Failed to load frame ${index + 1}`);
      onFrameLoaded();
    }

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.src   = getFrameUrl(i);

      // Only the first FAST_LOAD frames trigger the "ready" state
      if (i < FAST_LOAD) {
        img.onload  = onFrameLoaded;
        img.onerror = () => onFrameError(img, i);
      } else {
        // Background frames — just count them
        img.onload  = () => { loadedCount++; };
        img.onerror = () => { loadedCount++; };
      }

      images[i] = img;
    }
  }

  // ── Hide loader overlay ───────────────────────────────
  function hideLader() {
    if (!loader) return;
    loader.style.opacity = '0';
    setTimeout(() => loader.style.display = 'none', 500);
  }

  // ── Reveal text content with animation ───────────────
  function revealContent() {
    const revealEls = document.querySelectorAll('.hero-reveal');
    revealEls.forEach((el, i) => {
      setTimeout(() => {
        el.style.opacity  = '1';
        el.style.transform = 'translateY(0)';
      }, i * 120);
    });
  }

  // ── Start the animation loop ──────────────────────────
  function startAnimationLoop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(animationLoop);
  }

  // ── Intersection observer: pause when not visible ─────
  // Saves CPU when the hero section is scrolled past
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        startAnimationLoop();
      } else {
        cancelAnimationFrame(rafId);
      }
    });
  }, { threshold: 0 });

  // ── Fallback: show placeholder if no BASE_URL set ─────
  function showFallback() {
    if (!loader) return;
    loader.innerHTML = `
      <div class="flex flex-col items-center gap-3 text-white text-center px-6">
        <svg class="w-12 h-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <p class="text-white/60 text-sm max-w-xs">
          Upload your image sequence frames and update the<br/>
          <strong>hero_frames_url</strong> in theme settings.
        </p>
      </div>
    `;
    // Still reveal the content overlay
    revealContent();
    setTimeout(hideLader, 200);
  }

  // ── INIT ──────────────────────────────────────────────
  function init() {
    // Set canvas to full screen
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas, { passive: true });

    // If no base URL set yet, show placeholder
    if (!BASE_URL || BASE_URL.includes('your-store')) {
      showFallback();
      return;
    }

    // Start preloading frames
    preloadFrames();

    // Listen to scroll
    window.addEventListener('scroll', onScroll, { passive: true });

    // Observe visibility
    observer.observe(section);
  }

  // ── Run after DOM is ready ─────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();