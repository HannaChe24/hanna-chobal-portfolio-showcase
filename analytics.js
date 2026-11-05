(() => {
  'use strict';

  const config = window.PORTFOLIO_ANALYTICS_CONFIG || {};
  const isWeb = location.protocol === 'https:' || location.protocol === 'http:';
  const dnt = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  const scriptSrc = typeof config.scriptSrc === 'string' ? config.scriptSrc.trim() : '';
  const websiteId = typeof config.websiteId === 'string' ? config.websiteId.trim() : '';
  const validWebsiteId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(websiteId);
  const enabled = isWeb && scriptSrc.startsWith('https://') && validWebsiteId && !(config.respectDoNotTrack && dnt);
  const sent = new Set();
  const pending = [];
  let lastCaseSection = 'top';
  let maxScroll = 0;
  let exitSent = false;

  const caseIdFromPath = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/service-workspace/')) return 'service_workspace';
    if (path.includes('/trading-experience/')) return 'trading_platform';
    if (path.includes('/market-analysis/')) return 'market_analysis';
    return '';
  };

  const safeProps = props => Object.fromEntries(Object.entries(props || {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, String(value).slice(0, 120)]));

  const flushPending = () => {
    if (!window.umami?.track) return;
    while (pending.length) {
      const [name, props] = pending.shift();
      window.umami.track(name, props);
    }
  };

  if (enabled) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = scriptSrc;
    script.dataset.websiteId = websiteId;
    script.dataset.doNotTrack = 'true';
    script.dataset.excludeSearch = 'true';
    script.dataset.excludeHash = 'true';
    if (typeof config.domains === 'string' && config.domains.trim()) script.dataset.domains = config.domains.trim();
    script.referrerPolicy = 'strict-origin-when-cross-origin';
    script.addEventListener('load', flushPending, { once: true });
    document.head.appendChild(script);
  }

  const track = (name, props = {}, options = {}) => {
    if (!enabled || typeof name !== 'string') return;
    const payload = safeProps(props);
    if (window.umami?.track) window.umami.track(name, payload);
    else pending.push([name, payload]);
    if (typeof options.callback === 'function') setTimeout(options.callback, 120);
  };

  const trackAndNavigate = (name, props, url) => {
    if (!enabled) { location.href = url; return; }
    let navigated = false;
    const go = () => {
      if (navigated) return;
      navigated = true;
      location.href = url;
    };
    track(name, props, { callback: go });
    setTimeout(go, 450);
  };

  const once = (key, name, props = {}, options = {}) => {
    if (sent.has(key)) return;
    sent.add(key);
    track(name, props, options);
  };

  window.portfolioAnalytics = Object.freeze({ enabled, track, trackAndNavigate, once });

  const observeOnce = (element, key, eventName, props = {}, threshold = .35) => {
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return;
      once(key, eventName, props);
      observer.disconnect();
    }, { threshold });
    observer.observe(element);
  };

  const getCaseIdFromLink = link => {
    const href = (link?.getAttribute('href') || '').toLowerCase();
    if (href.includes('service-workspace')) return 'service_workspace';
    if (href.includes('trading-experience')) return 'trading_platform';
    if (href.includes('market-analysis')) return 'market_analysis';
    return 'unknown';
  };

  const initHome = () => {
    once('portfolio_view', 'portfolio_view');
    observeOnce(document.querySelector('.hero'), 'hero_viewed', 'hero_viewed', {}, .45);
    observeOnce(document.querySelector('#work'), 'selected_work_view', 'selected_work_view', {}, .2);
    observeOnce(document.querySelector('#contact'), 'contact_view', 'contact_view', {}, .25);

    document.querySelectorAll('.case').forEach((card, index) => {
      const link = card.querySelector('a[href]');
      const caseId = getCaseIdFromLink(link);
      observeOnce(card, `case_card_view:${caseId}`, 'case_card_view', { case_id: caseId, position: index + 1 }, .35);
      link?.addEventListener('click', () => track('case_card_clicked', { case_id: caseId, position: index + 1 }));
    });

    document.querySelector('.contact-cta')?.addEventListener('click', () => track('contact_click', { source: 'footer_email' }));
    document.querySelector('a[href*="linkedin.com"]')?.addEventListener('click', () => track('linkedin_click', { source: 'footer' }));
    document.querySelector('a[href*="behance.net"]')?.addEventListener('click', () => track('behance_click', { source: 'footer' }));
  };

  const initGate = caseId => {
    once(`password_screen:${caseId}`, 'password_screen_reached', { case_id: caseId });
    document.querySelector('#request-access')?.addEventListener('click', () => track('case_access_request_started', { case_id: caseId }));
    document.querySelector('#request-form')?.addEventListener('submit', () => track('case_access_request_prepared', { case_id: caseId }));
  };

  const sectionName = element => {
    const label = (element.querySelector('.case-label')?.textContent || '').trim().toUpperCase();
    if (label.startsWith('S ·') || label.includes('SITUATION')) return 'problem';
    if (label.startsWith('T ·') || label.includes('TASK')) return 'task';
    if (label.startsWith('A ·') || label.includes('ACTION')) return 'process';
    if (label.startsWith('R ·') || label.includes('RESULT')) return 'outcome';
    if (label.includes('ROLE') || label.includes('CONTRIBUTION')) return 'role';
    if (label.includes('SYSTEM') || label.includes('PRODUCT SCREENS')) return 'solution';
    if (label.includes('LOOKING BACK') || label.includes('VALIDATION')) return 'reflection';
    return '';
  };

  const initCase = caseId => {
    once(`case_open:${caseId}`, 'case_open', { case_id: caseId });
    const thresholds = [25, 50, 75, 100];
    const onScroll = () => {
      const scrollable = Math.max(document.documentElement.scrollHeight - innerHeight, 1);
      const depth = Math.min(100, Math.round((scrollY / scrollable) * 100));
      maxScroll = Math.max(maxScroll, depth);
      thresholds.forEach(value => {
        if (depth >= value) once(`case_scroll:${caseId}:${value}`, value === 100 ? 'case_complete' : `case_scroll_${value}`, { case_id: caseId, depth });
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const sectionCandidates = document.querySelectorAll('.workflow-content article,.case-chapter,.case-outcomes article,.case-role,.principle,.trading-experience-action,.trading-experience-gallery,.brand-logic,.public-reference');
    sectionCandidates.forEach((section, index) => {
      const name = sectionName(section) || `section_${index + 1}`;
      const observer = new IntersectionObserver(entries => {
        if (!entries.some(entry => entry.isIntersecting)) return;
        lastCaseSection = name;
        once(`case_section:${caseId}:${name}`, 'case_section_reached', { case_id: caseId, section: name });
        observer.disconnect();
      }, { threshold: .3 });
      observer.observe(section);
    });

    document.querySelectorAll('figure img,.product-screen,.screen-slot').forEach((media, index) => {
      media.addEventListener('click', () => once(`case_media:${caseId}:${index}`, 'case_media_engagement', { case_id: caseId, media_index: index + 1 }));
    });

    const sendExit = () => {
      if (exitSent) return;
      exitSent = true;
      track('case_exit', { case_id: caseId, last_section: lastCaseSection, max_scroll: maxScroll }, { interactive: false });
    };
    addEventListener('pagehide', sendExit, { once: true });
  };

  const initExternalLinks = caseId => {
    document.querySelectorAll('a[href^="http"]').forEach(link => link.addEventListener('click', () => {
      let destination = 'external';
      try { destination = new URL(link.href).hostname; } catch (_) {}
      track('external_link_click', { case_id: caseId || 'portfolio', destination });
    }));
  };

  const start = () => {
    const caseId = caseIdFromPath();
    const isGate = document.body.classList.contains('gate-page');
    const isCase = document.body.classList.contains('workflow-page') && !isGate;
    if (!caseId) initHome();
    else if (isGate) initGate(caseId);
    else if (isCase) initCase(caseId);
    initExternalLinks(caseId);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
