(() => {
  const figure = document.querySelector('.competitor-positioning-map');
  if (!figure) return;
  const svg = figure.querySelector('svg');
  const toolbar = document.createElement('div');
  toolbar.className = 'competitor-map-controls';
  toolbar.innerHTML = '<button type="button" data-map-expand aria-label="Expand competitor map">Expand map ↗</button><div data-map-zoom hidden><button type="button" data-map-out aria-label="Zoom out">−</button><output aria-live="polite">100%</output><button type="button" data-map-in aria-label="Zoom in">+</button><button type="button" data-map-reset>Reset</button></div>';
  const viewport = document.createElement('div');
  viewport.className = 'competitor-map-viewport';
  figure.prepend(toolbar);
  viewport.append(svg);
  figure.append(viewport);
  let zoom = 1;
  function resize() {
    svg.style.width = `${zoom * 100}%`;
    svg.style.maxWidth = 'none';
    toolbar.querySelector('output').textContent = `${Math.round(zoom * 100)}%`;
    toolbar.querySelector('[data-map-out]').disabled = zoom <= 1;
    toolbar.querySelector('[data-map-in]').disabled = zoom >= 3;
  }
  const expand = toolbar.querySelector('[data-map-expand]');
  expand.addEventListener('click', async () => {
    if (document.fullscreenElement === figure) await document.exitFullscreen();
    else if (figure.requestFullscreen) await figure.requestFullscreen();
    else { figure.classList.toggle('is-expanded'); sync(); }
  });
  function sync() {
    const open = document.fullscreenElement === figure || figure.classList.contains('is-expanded');
    figure.classList.toggle('is-map-open', open);
    expand.textContent = open ? 'Close map ×' : 'Expand map ↗';
    expand.setAttribute('aria-label', open ? 'Close competitor map' : 'Expand competitor map');
    expand.setAttribute('aria-expanded', String(open));
    toolbar.querySelector('[data-map-zoom]').hidden = !open;
    zoom = 1; resize();
  }
  document.addEventListener('fullscreenchange', sync);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && figure.classList.contains('is-expanded')) { figure.classList.remove('is-expanded'); sync(); expand.focus(); } });
  toolbar.querySelector('[data-map-in]').onclick = () => { zoom = Math.min(3, zoom + .25); resize(); };
  toolbar.querySelector('[data-map-out]').onclick = () => { zoom = Math.max(1, zoom - .25); resize(); };
  toolbar.querySelector('[data-map-reset]').onclick = () => { zoom = 1; resize(); viewport.scrollTo(0, 0); };
  sync();
})();
