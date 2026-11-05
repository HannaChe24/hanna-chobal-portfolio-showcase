(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hero = document.querySelector('.hero');
  // Preserve the staged entrance, with durations 10% shorter than the previous version.
  const heroTimeScale = 0.576;
  document.querySelector('#about-title br')?.replaceWith(' ');
  const taskManagerMeta = document.querySelector('.case-bank-ai .case-heading p');
  if (taskManagerMeta) taskManagerMeta.textContent = 'TASK MANAGEMENT';
  const canvas = document.querySelector('#particle-field');
  const ctx = canvas.getContext('2d', { alpha: true });
  const words = [...document.querySelectorAll('.morph-word')];
  const techMarks = [...document.querySelectorAll('.hero-tech[data-word]')];
  const introMarks = [...document.querySelectorAll('.hero-specialisation[data-word], .hero-intro [data-word], .hero-work-link [data-word]')];
  const heroTypography = [...techMarks, ...words, ...introMarks];
  // Final glyphs reserve stable slots; scramble characters must fit without distortion.
  const decodeSlots = new Map();
  heroTypography.forEach(element => {
    element.textContent = '';
    element.setAttribute('aria-label', element.dataset.word);
    const slots = [];
    element.dataset.word.split(/(\s+)/).forEach(part => {
      if (/^\s+$/.test(part)) { element.append(document.createTextNode(part)); return; }
      const word = document.createElement('span');
      word.className = 'decode-word';
      word.setAttribute('aria-hidden', 'true');
      for (const letter of part) {
        const slot = document.createElement('span');
        slot.className = 'decode-slot';
        const anchor = document.createElement('span');
        anchor.className = 'decode-anchor';
        anchor.textContent = letter;
        const glyph = document.createElement('span');
        glyph.className = 'decode-glyph';
        glyph.textContent = letter;
        slot.append(anchor, glyph);
        word.append(slot);
        slots.push({ glyph, letter, slot, candidates: [] });
      }
      element.append(word);
    });
    decodeSlots.set(element, slots);
  });
  techMarks.forEach((element, index) => element.style.setProperty('--hero-delay', `${index * 54.4 * heroTimeScale}ms`));
  words.forEach((element, index) => element.style.setProperty('--hero-delay', `${(108.8 + index * 54.4) * heroTimeScale}ms`));
  introMarks.forEach((element, index) => {
    const target = element.closest('.hero-work-link') || element;
    target.style.setProperty('--hero-delay', `${(299.2 + index * 54.4) * heroTimeScale}ms`);
  });
  let particles = [], w = 0, h = 0, running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth; h = canvas.clientHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = w < 700 ? 150 : 440;
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .72, vy: (Math.random() - .5) * .72,
      size: .5, seed: Math.random() * 10
    }));
  }
  function draw(t) {
    if (!running) return;
    const elapsed = (t - start) / (1000 * heroTimeScale);
    const transformed = elapsed > 1.836;
    ctx.clearRect(0, 0, w, h);
    particles.forEach((p, i) => {
      if (transformed) {
        const tx = w / 2 + ((i % 31) - 15) * (w / 40);
        const ty = h / 2 + (Math.floor(i / 31) - 17) * 5;
        const pull = Math.min((elapsed - 1.836) / .85, 1) * .026;
        p.vx += (tx - p.x) * pull; p.vy += (ty - p.y) * pull;
      }
      p.x += p.vx; p.y += p.vy; p.vx *= .986; p.vy *= .986;
      if (!transformed && (p.x < 0 || p.x > w || p.y < 0 || p.y > h)) { p.x = Math.random() * w; p.y = Math.random() * h; }
      const alpha = transformed ? .035 : .16 + Math.sin(t / 330 + p.seed) * .07;
      ctx.fillStyle = transformed ? `rgba(0,0,0,${alpha})` : `rgba(255,255,255,${alpha})`;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    });
    requestAnimationFrame(draw);
  }
  let heroResolved = false, lastScramble = 0;
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const glyphMeasure = document.createElement('canvas').getContext('2d');
  function measureDecodeSlots() {
    decodeSlots.forEach((slots, element) => {
      const style = getComputedStyle(element);
      glyphMeasure.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      slots.forEach(item => {
        item.slot.style.width = '';
        const available = item.slot.getBoundingClientRect().width;
        item.candidates = [...digits].filter(character => glyphMeasure.measureText(character).width <= available);
        if (item.letter === 'I') item.candidates = ['I', '!', ':'];
        else if (!item.candidates.length) item.candidates = [item.letter];
      });
    });
  }
  measureDecodeSlots();
  document.fonts.ready.then(measureDecodeSlots);
  window.addEventListener('resize', measureDecodeSlots);
  function decode(element, progress) {
    const slots = decodeSlots.get(element);
    slots.forEach(({ glyph, letter, candidates }, index) => {
      const resolved = index / slots.length < progress || !/[a-z0-9]/i.test(letter);
      const pool = candidates.length ? candidates : [letter];
      const choices = letter === 'I' ? pool.filter(character => character !== glyph.textContent) : pool;
      glyph.textContent = resolved ? letter : choices[Math.floor(Math.random() * choices.length)];
    });
  }
  function animateUnresolved(now) {
    if (heroResolved) return;
    if (now - lastScramble > 180 * heroTimeScale) {
      heroTypography.forEach(element => decode(element, 0));
      lastScramble = now;
    }
    requestAnimationFrame(animateUnresolved);
  }
  function morphWord(element, delay) {
    const begin = performance.now() + delay;
    let lastUpdate = 0;
    function tick(now) {
      const progress = Math.max(0, Math.min((now - begin) / (285.6 * heroTimeScale), 1));
      if (now >= begin && (now - lastUpdate > 130 * heroTimeScale || progress === 1)) {
        decode(element, progress);
        lastUpdate = now;
      }
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  function beginSharpPhase() {
    heroResolved = true;
    heroTypography.forEach((element, index) => morphWord(element, index * 19.04 * heroTimeScale));
    hero.classList.add('resolved');
    document.body.classList.add('hero-resolved');
  }
  function beginLightPhase() {
    hero.classList.add('hero-light');
    document.body.classList.add('hero-light');
    setTimeout(beginSharpPhase, 1054 * heroTimeScale);
  }
  const start = performance.now();
  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) { hero.classList.add('resolved'); document.body.classList.add('hero-resolved'); running = false; heroTypography.forEach(element => decode(element, 1)); ctx.clearRect(0, 0, w, h); }
  else {
    requestAnimationFrame(draw);
    requestAnimationFrame(animateUnresolved);
    setTimeout(beginLightPhase, 1224 * heroTimeScale);
  }

  const steps = [...document.querySelectorAll('.process-step')];
  const stepObserver = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { steps.forEach(s => s.classList.remove('active')); entry.target.classList.add('active'); } }), { threshold: .6 });
  steps.forEach(step => stepObserver.observe(step));

  const revealGroups = [
    ...document.querySelectorAll('.section-head'),
    ...document.querySelectorAll('.capability'),
    ...document.querySelectorAll('.case'),
    ...document.querySelectorAll('.process-step'),
    document.querySelector('.about-grid'),
    document.querySelector('.geometry-landing'),
    document.querySelector('.contact-bottom')
  ].filter(Boolean);
  revealGroups.forEach(group => group.classList.add('editorial-reveal'));
  document.body.classList.add('motion-ready');
  if (reduceMotion) revealGroups.forEach(group => group.classList.add('is-revealed'));
  else {
    const revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-revealed');
        revealObserver.unobserve(entry.target);
      }
    }), { threshold: .12, rootMargin: '0px 0px -5% 0px' });
    revealGroups.forEach(group => revealObserver.observe(group));
  }

  if (!reduceMotion) {
    const geometry = document.querySelector('.scroll-geometry');
    const workSection = document.querySelector('.work');
    const geometricForms = [...geometry.querySelectorAll('i')];
    const geometryLanding = document.querySelector('.geometry-landing');
    const landingTargets = [...document.querySelectorAll('.geometry-grid > i')];
    const desktopLandingOrder = [9, 0, 1, 2, 3, 4, 5, 6, 7, 8];
    const mobileLandingOrder = [8, 0, 2, 4, 6, 9, 1, 3, 5, 7];
    let geometryEngaged = false;
    let geometryFrame;
    const updateGeometry = () => {
      const travel = window.scrollY;
      const geometryEnd = workSection.offsetTop;
      const fallProgress = Math.min(1, travel / Math.max(geometryEnd - window.innerHeight * .28, 1));
      const gridDocumentTop = geometryLanding.getBoundingClientRect().top + window.scrollY;
      const gridStart = gridDocumentTop - window.innerHeight * .72;
      // Complete the chaos → structure transition while the landing grid is
      // still clearly in view, leaving a calm resolved beat before Selected Work.
      const gridEnd = geometryEnd - window.innerHeight * .72;
      const gridProgress = Math.max(0, Math.min(1, (travel - gridStart) / Math.max(gridEnd - gridStart, 1)));
      const pacedGrid = Math.pow(gridProgress, 1.05);
      const easedGrid = pacedGrid * pacedGrid * (3 - 2 * pacedGrid);
      // Desktop groups matching shapes vertically by column. On the two-column
      // mobile grid, matching pairs occupy the same horizontal row instead.
      const landingOrder = window.matchMedia('(max-width: 700px)').matches
        ? mobileLandingOrder
        : desktopLandingOrder;
      geometry.style.setProperty('--geometry-end', `${geometryEnd}px`);
      geometry.style.setProperty('--geometry-opacity', (1 - gridProgress * .08).toFixed(3));
      geometry.classList.toggle('is-active', geometryEngaged && travel > 8);
      geometricForms.forEach((form, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const floorY = Math.max(0, geometryEnd - form.offsetTop - form.offsetHeight);
        const stagger = index * .024;
        const localFallProgress = Math.max(0, Math.min(1, (fallProgress - stagger) / Math.max(1 - stagger, .01)));
        const localEasedFall = Math.pow(localFallProgress, 1.16);
        const fallY = floorY * (index === 0 ? localEasedFall * .72 : localEasedFall);
        const fallX = Math.sin(travel / 360 + index * 1.7) * (18 + index * 9) * direction * (1 - fallProgress);
        const fallingScale = 1 + Math.sin(travel / 680 + index) * .1 * (1 - fallProgress);
        form.style.setProperty('--geo-opacity', window.matchMedia('(max-width: 700px)').matches ? '.38' : '.55');
        const target = landingTargets[landingOrder[index]];
        const targetRect = target.getBoundingClientRect();
        const targetX = targetRect.left + window.scrollX + targetRect.width / 2 - form.offsetLeft - form.offsetWidth / 2;
        const targetY = targetRect.top + window.scrollY + targetRect.height / 2 - form.offsetTop - form.offsetHeight / 2;
        const targetScale = Math.min(targetRect.width / form.offsetWidth, targetRect.height / form.offsetHeight) * .58;
        const y = fallY * (1 - easedGrid) + targetY * easedGrid;
        const x = fallX * (1 - easedGrid) + targetX * easedGrid;
        const scale = fallingScale * (1 - easedGrid) + targetScale * easedGrid;
        const blur = Math.abs(Math.sin(travel / 720 + index)) * .6 * (1 - gridProgress);
        form.style.setProperty('--geo-x', `${x.toFixed(1)}px`);
        form.style.setProperty('--geo-y', `${y.toFixed(1)}px`);
        form.style.setProperty('--geo-scale', scale.toFixed(3));
        form.style.setProperty('--geo-blur', `${blur.toFixed(2)}px`);
        form.style.setProperty('--geo-rotate', `${(fallProgress * (24 + index * 13) * direction).toFixed(2)}deg`);
      });
      geometryFrame = undefined;
    };
    const requestGeometryUpdate = () => { if (!geometryFrame) geometryFrame = requestAnimationFrame(updateGeometry); };
    const engageGeometry = () => { geometryEngaged = true; requestGeometryUpdate(); };
    window.addEventListener('scroll', requestGeometryUpdate, { passive: true });
    window.addEventListener('wheel', engageGeometry, { passive: true, once: true });
    window.addEventListener('touchmove', engageGeometry, { passive: true, once: true });
    window.addEventListener('keydown', event => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) engageGeometry();
    });
    window.addEventListener('resize', requestGeometryUpdate);
    updateGeometry();
    requestAnimationFrame(updateGeometry);
    setTimeout(requestGeometryUpdate, 180);
  }

})();
