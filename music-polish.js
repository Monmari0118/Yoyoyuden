/* Preview-only music-room additions; the original audio sources and links stay intact. */
(() => {
  'use strict';

  function initMusicPolish() {
    const music = document.getElementById('music');
    const preview = music?.querySelector('.music-preview-card');
    const list = preview?.querySelector('.music-preview-list');
    if (!list || list.closest('.music-polish-layout')) return;

    const destination = preview.querySelector('.compact-actions a[href]');
    const layout = document.createElement('div');
    layout.className = 'music-polish-layout';

    const cover = document.createElement('figure');
    cover.className = 'music-polish-cover';
    const coverLink = document.createElement('a');
    coverLink.href = destination?.getAttribute('href') || 'music.html';
    coverLink.setAttribute('aria-label', 'サウンドトラックの配布ページへ');
    const coverImage = document.createElement('img');
    coverImage.src = 'assets/music-cover01.webp';
    coverImage.alt = '東方葉々癒伝オリジナルサウンドトラック「徒然なる境界線」のジャケット';
    coverImage.loading = 'lazy';
    coverImage.decoding = 'async';
    coverLink.append(coverImage);
    const caption = document.createElement('figcaption');
    caption.textContent = 'サウンドトラック';
    cover.append(coverLink, caption);

    list.before(layout);
    layout.append(cover, list);

    const players = [...list.querySelectorAll('audio')];
    players.forEach((audio, index) => {
      const card = audio.closest('.music-card');
      if (!card) return;

      // The sample MP3 files have no readable ID3 title tags, so use neutral labels.
      const label = document.createElement('div');
      label.className = 'music-polish-track-label';
      const name = document.createElement('span');
      name.textContent = `試聴 ${index + 1}`;
      const status = document.createElement('span');
      status.className = 'music-polish-playing';
      status.textContent = '再生中';
      label.append(name, status);
      audio.before(label);

      if (!audio.hasAttribute('aria-label') && !audio.hasAttribute('aria-labelledby')) {
        audio.setAttribute('aria-label', `試聴 ${index + 1}`);
      }

      const clearPlaying = () => card.classList.remove('is-audio-playing');
      audio.addEventListener('play', () => {
        if (!document.body.classList.contains('detail-polish')) return;
        players.forEach(other => {
          if (other !== audio && !other.paused) other.pause();
        });
      });
      audio.addEventListener('playing', () => card.classList.add('is-audio-playing'));
      ['pause', 'ended', 'waiting', 'emptied', 'error'].forEach(event => {
        audio.addEventListener(event, clearPlaying);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMusicPolish, { once: true });
  } else {
    initMusicPolish();
  }
})();
