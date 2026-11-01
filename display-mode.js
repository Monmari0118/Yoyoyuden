/* Apply the saved viewport before the page is drawn. No zoom restrictions. */
(() => {
  const key = 'yoyoyudenSiteView';
  const desktopWidth = 1280;
  const root = document.documentElement;
  const viewport = document.querySelector('meta[name="viewport"]');
  const normalViewport = viewport?.content || 'width=device-width, initial-scale=1';
  let mode = 'auto';
  let nativeWidth = window.innerWidth;

  function measureScreen() {
    const visual = window.visualViewport;
    return Math.round(visual ? visual.width * visual.scale : window.innerWidth);
  }

  function applyView() {
    root.dataset.siteView = mode;
    root.dataset.compactScreen = String(nativeWidth <= 980);
    root.style.setProperty('--view-ui-scale', String(mode === 'desktop' ? Math.max(1, desktopWidth / nativeWidth) : 1));
    if (viewport) viewport.content = mode === 'desktop' ? `width=${desktopWidth}` : normalViewport;
  }

  try {
    if (localStorage.getItem(key) === 'desktop') mode = 'desktop';
  } catch (error) {
    // Reading the site still works when browser storage is unavailable.
  }
  nativeWidth = measureScreen() || nativeWidth;
  applyView();

  function refreshControls() {
    document.querySelectorAll('[data-view-toggle]').forEach(button => {
      button.textContent = mode === 'desktop' ? 'スマホ表示に戻す' : 'PC表示に切り替え';
    });
  }

  function changeView() {
    mode = mode === 'desktop' ? 'auto' : 'desktop';
    let saved = false;
    try {
      if (mode === 'auto') localStorage.removeItem(key);
      else localStorage.setItem(key, mode);
      saved = true;
    } catch (error) {}
    // A fresh document lets Safari choose the initial scale for the selected view.
    if (saved) {
      window.location.reload();
    } else {
      applyView();
      refreshControls();
    }
  }

  function makeSwitch() {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'view-mode-toggle';
    button.dataset.viewToggle = '';
    button.addEventListener('click', changeView);
    return button;
  }

  function initControls() {
    const header = document.querySelector('.site-header');
    if (!header) return;
    const strip = document.createElement('div');
    strip.className = 'view-strip';
    const inner = document.createElement('div');
    inner.className = 'view-strip-inner';
    const note = document.createElement('span');
    note.textContent = 'PCでの閲覧を推奨しています。';
    inner.append(note, makeSwitch());
    strip.appendChild(inner);
    header.before(strip);

    const footer = document.querySelector('.site-footer');
    if (footer) {
      const footerSwitch = document.createElement('div');
      footerSwitch.className = 'view-footer-switch';
      footerSwitch.appendChild(makeSwitch());
      footer.appendChild(footerSwitch);
    }

    const nav = header.querySelector('.site-nav');
    if (nav) {
      nav.id ||= 'site-menu';
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'mobile-nav-toggle';
      toggle.textContent = 'メニューを開く';
      toggle.setAttribute('aria-controls', nav.id);
      toggle.setAttribute('aria-expanded', 'false');
      nav.dataset.mobileOpen = 'false';
      const closeMenu = () => {
        nav.dataset.mobileOpen = 'false';
        toggle.setAttribute('aria-expanded', 'false');
        toggle.textContent = 'メニューを開く';
      };
      toggle.addEventListener('click', () => {
        const open = nav.dataset.mobileOpen !== 'true';
        nav.dataset.mobileOpen = String(open);
        toggle.setAttribute('aria-expanded', String(open));
        toggle.textContent = open ? 'メニューを閉じる' : 'メニューを開く';
      });
      nav.addEventListener('click', event => {
        if (event.target.closest('a')) closeMenu();
      });
      header.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.dataset.mobileOpen === 'true') {
          closeMenu();
          toggle.focus();
        }
      });
      nav.before(toggle);
      root.dataset.mobileNavReady = 'true';
    }
    refreshControls();
    // Diary text is rendered by script.js in its DOMContentLoaded listener.
    requestAnimationFrame(prepareReadingBreaks);
  }

  function prepareReadingBreaks() {
    document.querySelectorAll('.devlog-text, .qa-answer, .qa-intro').forEach(paragraph => {
      const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(node => {
        if (!node.textContent.includes('\n')) return;
        const fragment = document.createDocumentFragment();
        node.textContent.split(/(\n+)/).forEach(part => {
          if (part === '\n') {
            const lineBreak = document.createElement('span');
            lineBreak.className = 'prose-line-break';
            lineBreak.textContent = part;
            fragment.appendChild(lineBreak);
          } else fragment.appendChild(document.createTextNode(part));
        });
        node.replaceWith(fragment);
      });
    });
  }

  window.addEventListener('resize', () => {
    nativeWidth = measureScreen() || nativeWidth;
    root.dataset.compactScreen = String(nativeWidth <= 980);
    root.style.setProperty('--view-ui-scale', String(mode === 'desktop' ? Math.max(1, desktopWidth / nativeWidth) : 1));
  });
  document.addEventListener('DOMContentLoaded', initControls);
})();
