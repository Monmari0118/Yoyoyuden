/* Google Forms enforces the real deadline; this only updates the site display. */
(() => {
  function initSurveyStatus() {
    const sections = [...document.querySelectorAll('[data-survey-deadline]')];
    if (!sections.length) return;
    let timer = 0;
    function refresh() {
      window.clearTimeout(timer);
      const now = Date.now();
      let nextDeadline = Infinity;
      sections.forEach(section => {
        const deadline = Date.parse(section.dataset.surveyDeadline);
        if (!Number.isFinite(deadline)) return;
        const closed = now >= deadline;
        section.querySelectorAll('[data-survey-open]').forEach(element => { element.hidden = closed; });
        section.querySelectorAll('[data-survey-closed]').forEach(element => { element.hidden = !closed; });
        section.querySelectorAll('iframe[data-survey-src]').forEach(frame => {
          if (closed) frame.removeAttribute('src');
          else if (!frame.hasAttribute('src')) frame.setAttribute('src', frame.dataset.surveySrc);
        });
        if (!closed) nextDeadline = Math.min(nextDeadline, deadline);
      });
      if (Number.isFinite(nextDeadline)) {
        timer = window.setTimeout(refresh, Math.min(Math.max(nextDeadline - now, 1), 2147483647));
      }
    }
    document.addEventListener('visibilitychange', refresh);
    refresh();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSurveyStatus);
  else initSurveyStatus();
})();
