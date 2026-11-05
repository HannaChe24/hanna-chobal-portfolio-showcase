(() => {
  const finePointer = window.matchMedia('(pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const start = () => {
    if (!document.body || document.querySelector('.cursor-trail')) return;

    const cursor = document.createElement('div');
    cursor.className = 'cursor-trail';
    cursor.setAttribute('aria-hidden', 'true');

    const ring = document.createElement('i');
    ring.className = 'cursor-ring';
    cursor.append(ring);

    const dots = Array.from({ length: 11 }, (_, index) => {
      const element = document.createElement('i');
      element.className = 'cursor-dot';
      element.style.setProperty('--dot-index', index);
      cursor.append(element);
      return { element, x: -100, y: -100 };
    });

    document.body.append(cursor);
    document.body.classList.add('has-cursor-trail');

    const syncCursorLayer = () => {
      const openDialogs = Array.from(document.querySelectorAll('dialog[open]'));
      const targetLayer = openDialogs.at(-1) || document.body;
      if (cursor.parentElement !== targetLayer) targetLayer.append(cursor);
    };

    const observeDialog = dialog => {
      dialog.addEventListener('close', syncCursorLayer);
      dialog.addEventListener('toggle', syncCursorLayer);
    };

    document.querySelectorAll('dialog').forEach(observeDialog);
    new MutationObserver(syncCursorLayer).observe(document.body, {
      subtree: true,
      attributes: true,
      attributeFilter: ['open']
    });

    let targetX = -100;
    let targetY = -100;
    let ringX = -100;
    let ringY = -100;

    const setInteractiveState = target => {
      const interactive = target instanceof Element && target.closest('a[href], button:not(:disabled), [role="button"]:not([aria-disabled="true"]), summary, select, input:not(:disabled), textarea:not(:disabled)');
      cursor.classList.toggle('is-link', Boolean(interactive));
    };

    document.addEventListener('pointermove', event => {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      if (event.target instanceof Element && event.target.closest('#mobile-trading-demo')) {
        cursor.classList.remove('is-visible');
        return;
      }
      targetX = event.clientX;
      targetY = event.clientY;
      cursor.classList.add('is-visible');
      setInteractiveState(event.target);
    }, { passive: true });

    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    window.addEventListener('blur', () => cursor.classList.remove('is-visible'));
    document.addEventListener('pointerdown', () => cursor.classList.add('is-pressed'));
    document.addEventListener('pointerup', () => cursor.classList.remove('is-pressed'));
    document.addEventListener('pointercancel', () => cursor.classList.remove('is-pressed'));

    const animate = () => {
      ringX += (targetX - ringX) * .32;
      ringY += (targetY - ringY) * .32;
      const dialog = cursor.parentElement instanceof HTMLDialogElement ? cursor.parentElement : null;
      const dialogBounds = dialog?.getBoundingClientRect();
      const offsetX = dialogBounds?.left || 0;
      const offsetY = dialogBounds?.top || 0;
      ring.style.transform = `translate3d(${ringX - offsetX}px, ${ringY - offsetY}px, 0) translate(-50%, -50%)`;

      let leadX = ringX;
      let leadY = ringY;
      dots.forEach((dot, index) => {
        const ease = .19 - index * .008;
        dot.x += (leadX - dot.x) * ease;
        dot.y += (leadY - dot.y) * ease;
        dot.element.style.transform = `translate3d(${dot.x - offsetX}px, ${dot.y - offsetY}px, 0) translate(-50%, -50%)`;
        leadX = dot.x;
        leadY = dot.y;
      });

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
