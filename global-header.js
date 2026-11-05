(() => {
  const mount = document.querySelector('[data-global-header]');
  if (!mount) return;

  const root = mount.dataset.root || '';
  // Every portfolio page shares the same viewport effect and end-of-page fade.
  const blurStyles = document.createElement('link');
  blurStyles.rel = 'stylesheet';
  blurStyles.href = `${root}viewport-blur.css?v=20261009`;
  document.head.append(blurStyles);
  const loadBlur = () => {
    const blurScript = document.createElement('script');
    blurScript.src = `${root}viewport-blur.js?v=20261027-hero-staged-minus10`;
    document.body.append(blurScript);
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadBlur, { once: true });
  } else loadBlur();
  const home = `${root}index.html`;
  mount.outerHTML = `
    <header class="global-header" aria-label="Primary navigation">
      <a class="wordmark" href="${home}#top">HANNA CHOBAL</a>
      <p class="nav-meta">SENIOR PRODUCT DESIGNER</p>
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-navigation" aria-label="Open menu"><span></span><span></span></button>
      <nav id="mobile-navigation"><a href="${home}#work">WORK</a><a href="${home}#about">ABOUT</a><a href="${home}#contact">CONTACT</a></nav>
      <button class="menu-backdrop" type="button" aria-label="Close menu" tabindex="-1"></button>
    </header>
    <div class="header-progressive-blur" aria-hidden="true"><i></i><i></i><i></i><i></i></div>`;

  const header = document.querySelector('.global-header');
  const toggle = header.querySelector('.menu-toggle');
  const backdrop = header.querySelector('.menu-backdrop');
  const navigation = header.querySelector('#mobile-navigation');
  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };

  toggle.addEventListener('click', () => setMenu(!header.classList.contains('menu-open')));
  backdrop.addEventListener('click', () => setMenu(false));
  navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', () => { if (window.innerWidth > 700) setMenu(false); });
})();
