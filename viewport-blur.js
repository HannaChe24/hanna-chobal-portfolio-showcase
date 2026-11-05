(() => {
  if (document.querySelector('.viewport-blur')) return;
  const overlay = document.createElement('div');
  overlay.className = 'viewport-blur';
  overlay.setAttribute('aria-hidden', 'true');
  for (let layer = 0; layer < 6; layer++) overlay.append(document.createElement('i'));
  document.body.append(overlay);
  // Keep the sampling surface anchored: translating backdrop-filter layers
  // drags a visibly clipped strip of text across the hero in some browsers.
  if (document.querySelector('.hero') && window.scrollY < 40 && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const descent = overlay.animate([
      { height: '82vh' },
      { height: 'clamp(72px, 12vh, 104px)' }
    ], { duration: 1497.6, easing: 'cubic-bezier(.22, 1, .36, 1)' });
    const settle = () => {
      if (window.scrollY > 40) {
        descent.cancel();
        window.removeEventListener('scroll', settle);
      }
    };
    window.addEventListener('scroll', settle, { passive: true });
    descent.finished.then(() => window.removeEventListener('scroll', settle)).catch(() => {});
  }
  let queued = false;
  const update = () => {
    queued = false;
    const remaining = Math.max(0, document.documentElement.scrollHeight - window.innerHeight - window.scrollY);
    // Fade over the last half-screen; leave the final 64px completely clear.
    const progress = Math.min(1, Math.max(0, (remaining - 64) / Math.max(180, window.innerHeight * .5)));
    overlay.style.opacity = String(progress * progress * (3 - 2 * progress));
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  window.addEventListener('pageshow', schedule);
  new ResizeObserver(schedule).observe(document.body);
  update();
})();
