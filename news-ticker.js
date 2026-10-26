/* The newest three entries are read from records.js; no duplicate news data. */
(() => {
  function initNewsTicker() {
    const root = document.querySelector('.news-ticker');
    const records = window.yoyoyudenRecords?.updates;
    if (!root || !Array.isArray(records) || root.dataset.newsReady) return;
    const viewport = root.querySelector('.news-ticker-viewport');
    const entries = records.map((item, recordIndex) => ({ ...item, recordIndex }))
      .filter(item => (item.title || item.text || '').trim())
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
      .slice(0, 3);
    if (!entries.length) return;
    root.dataset.newsReady = 'true';

    // Match the rendered history, including both titled articles and plain entries.
    const history = document.querySelector('[data-record-type="updates"]');
    const historyRows = history ? [...history.querySelectorAll('.mini-log, .update-list > li')] : [];
    historyRows.forEach((row, i) => {
      row.id ||= `update-notice-${i}`;
      row.setAttribute('data-news-record', '');
    });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hasWelcomeGate = Boolean(document.querySelector('.welcome-gate'));
    let index = 0;
    let hovering = false;
    let timer = 0;
    let changing = false;
    let animations = [];
    const slides = entries.map((entry, i) => {
      const link = document.createElement('a');
      link.className = 'news-ticker-slide';
      const targetRow = historyRows[entry.recordIndex];
      link.href = targetRow ? `#${targetRow.id}` : '#update-history';
      link.hidden = i !== 0;
      const date = document.createElement('time');
      date.dateTime = entry.date || '';
      date.textContent = entry.label || entry.date || '';
      const tag = document.createElement('span');
      tag.className = `news-ticker-tag${i === 0 ? ' is-latest' : ''}`;
      tag.textContent = i === 0 ? '最新' : '更新';
      const text = document.createElement('span');
      text.className = 'news-ticker-text';
      text.textContent = (entry.title || entry.text).replace(/\s+/g, ' ').trim();
      link.title = text.textContent;
      link.append(date, tag, text);
      link.addEventListener('click', event => {
        const target = targetRow || document.getElementById('update-history');
        if (!target) return;
        event.preventDefault();
        historyRows.forEach(row => row.classList.remove('is-news-selected'));
        target.classList.add('is-news-selected');
        const header = document.querySelector('.site-header');
        target.style.scrollMarginTop = `${(header?.offsetHeight || 0) + 16}px`;
        target.scrollIntoView({ behavior: motion.matches ? 'auto' : 'smooth', block: 'start' });
        target.tabIndex = -1;
        target.focus({ preventScroll: true });
        window.history.pushState(null, '', link.getAttribute('href'));
      });
      return link;
    });
    viewport.replaceChildren(...slides);
    function schedule() {
      window.clearTimeout(timer);
      if (slides.length < 2 || motion.matches || hovering || changing || document.hidden || root.contains(document.activeElement)) return;
      if (hasWelcomeGate && !document.documentElement.classList.contains('welcome-seen')) return;
      timer = window.setTimeout(() => show(index + 1), 5000);
    }
    function show(nextIndex) {
      if (changing) return;
      window.clearTimeout(timer);
      const previous = slides[index];
      index = (nextIndex + slides.length) % slides.length;
      const next = slides[index];
      if (previous === next) { schedule(); return; }
      next.hidden = false;
      if (!motion.matches && typeof next.animate === 'function') {
        changing = true;
        const options = { duration: 360, easing: 'ease-in-out' };
        animations = [
          previous.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-100%)' }], options),
          next.animate([{ transform: 'translateY(100%)' }, { transform: 'translateY(0)' }], options)
        ];
        Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
          previous.hidden = true;
          changing = false;
          animations = [];
          schedule();
        });
      } else {
        previous.hidden = true;
        schedule();
      }
    }
    root.addEventListener('mouseenter', () => { hovering = true; schedule(); });
    root.addEventListener('mouseleave', () => { hovering = false; schedule(); });
    root.addEventListener('focusin', schedule);
    root.addEventListener('focusout', () => window.setTimeout(schedule, 0));
    document.addEventListener('visibilitychange', schedule);
    if (hasWelcomeGate && !document.documentElement.classList.contains('welcome-seen')) {
      const welcomeObserver = new MutationObserver(() => {
        if (!document.documentElement.classList.contains('welcome-seen')) return;
        welcomeObserver.disconnect();
        schedule();
      });
      welcomeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }
    motion.addEventListener('change', () => {
      if (motion.matches) animations.forEach(animation => animation.cancel());
      schedule();
    });
    schedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNewsTicker);
  else initNewsTicker();
})();
