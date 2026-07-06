document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  initScreenshotSlider();
  renderSiteInformation();
  renderActivityRecords();
  renderDevlogPreview();
  renderDevlogPage();
});

function initSmoothScroll() {
  const samePageLinks = document.querySelectorAll('a[href^="#"]');

  samePageLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");

      if (!hash || hash === "#") {
        return;
      }

      const target = document.querySelector(hash);

      if (!target) {
        return;
      }

      event.preventDefault();

      const header = document.querySelector(".site-header");
      const headerHeight = header ? header.offsetHeight : 0;
      const extraSpace = 12;
      const targetTop = target.getBoundingClientRect().top + window.pageYOffset - headerHeight - extraSpace;

      window.scrollTo({
        top: targetTop,
        behavior: "smooth"
      });

      window.history.pushState(null, "", hash);
    });
  });
}

function initScreenshotSlider() {
  const slider = document.querySelector(".screenshot-slider");

  if (!slider) {
    return;
  }

  const slides = Array.from(slider.querySelectorAll(".screenshot-slide"));
  const dots = Array.from(slider.querySelectorAll(".slider-dots span"));

  if (slides.length <= 1) {
    return;
  }

  let currentIndex = 0;

  const showSlide = (nextIndex) => {
    slides[currentIndex].classList.remove("is-active");

    if (dots[currentIndex]) {
      dots[currentIndex].classList.remove("is-active");
    }

    currentIndex = nextIndex;

    slides[currentIndex].classList.add("is-active");

    if (dots[currentIndex]) {
      dots[currentIndex].classList.add("is-active");
    }
  };

  window.setInterval(() => {
    const nextIndex = (currentIndex + 1) % slides.length;
    showSlide(nextIndex);
  }, 4500);
}

function renderActivityRecords() {
  if (!window.yoyoyudenRecords) {
    return;
  }

  const tweetTargets = document.querySelectorAll('[data-record-type="tweets"]');
  const updateTargets = document.querySelectorAll('[data-record-type="updates"]');

  tweetTargets.forEach((target) => {
    renderTweets(target, window.yoyoyudenRecords.tweets || []);
  });

  updateTargets.forEach((target) => {
    renderUpdates(target, window.yoyoyudenRecords.updates || []);
  });
}

function renderTweets(target, tweets) {
  target.innerHTML = "";

  tweets.forEach((item) => {
    const li = document.createElement("li");

    const time = document.createElement("time");
    time.dateTime = item.date || "";
    time.textContent = item.label || "";

    const p = document.createElement("p");
    p.textContent = item.text || "";

    li.appendChild(time);
    li.appendChild(p);
    target.appendChild(li);
  });
}

function renderUpdates(target, updates) {
  target.innerHTML = "";

  updates.forEach((item) => {
    if (item.title) {
      const article = document.createElement("article");
      article.className = "mini-log";

      const time = document.createElement("time");
      time.dateTime = item.date || "";
      time.textContent = item.label || "";

      const h4 = document.createElement("h4");
      h4.textContent = item.title || "";

      const p = document.createElement("p");
      p.textContent = item.text || "";

      article.appendChild(time);
      article.appendChild(h4);
      article.appendChild(p);
      target.appendChild(article);

      return;
    }

    const ul = document.createElement("ul");
    ul.className = "update-list";

    const li = document.createElement("li");

    const time = document.createElement("time");
    time.dateTime = item.date || "";
    time.textContent = item.label || "";

    const span = document.createElement("span");
    span.textContent = item.text || "";

    li.appendChild(time);
    li.appendChild(span);
    ul.appendChild(li);
    target.appendChild(ul);
  });
}
function renderSiteInformation() {
  const data = window.yoyoyudenSiteInfo;

  if (!data) {
    return;
  }

  const tickerTrack = document.querySelector("[data-ticker-track]");

  if (tickerTrack && Array.isArray(data.ticker) && data.ticker.length > 0) {
    tickerTrack.innerHTML = "";

    const makeTickerGroup = () => {
      const group = document.createElement("div");
      group.className = "ticker-group";

      for (let repeatIndex = 0; repeatIndex < 8; repeatIndex += 1) {
        data.ticker.forEach((item) => {
          const span = document.createElement("span");
          span.className = "ticker-item";

          const label = document.createElement("strong");
          label.textContent = item.label || "";

          const text = document.createElement("span");
          text.textContent = item.text || "";

          span.appendChild(label);

          if (item.text) {
            span.appendChild(text);
          }

          group.appendChild(span);
        });
      }

      return group;
    };

    tickerTrack.appendChild(makeTickerGroup());
    tickerTrack.appendChild(makeTickerGroup());
  }

  const noticeList = document.querySelector("[data-notice-list]");

  if (noticeList && Array.isArray(data.notices) && data.notices.length > 0) {
    noticeList.innerHTML = "";

    data.notices.forEach((item) => {
      const article = document.createElement("article");
      article.className = "information-card";

      if (item.level === "primary") {
        article.classList.add("information-card-primary");
      }

      const label = document.createElement("p");
      label.className = "info-label";
      label.textContent = item.label || "";

      const title = document.createElement("h3");
      title.textContent = item.title || "";

      const text = document.createElement("p");
      text.textContent = item.text || "";

      article.appendChild(label);
      article.appendChild(title);
      article.appendChild(text);

      if (item.href) {
        const link = document.createElement("a");
        link.className = "text-link";
        link.href = item.href;
        link.textContent = "準備中";
        article.appendChild(link);
      }

      noticeList.appendChild(article);
    });
  }
}

function renderDevlogPreview() {
  const target = document.querySelector("[data-devlog-preview]");

  if (!target || !Array.isArray(window.yoyoyudenDevlog)) {
    return;
  }

  target.innerHTML = "";

  window.yoyoyudenDevlog.slice(0, 3).forEach((item) => {
    const article = document.createElement("article");
    article.className = "devlog-card";

    const label = document.createElement("p");
    label.className = "log-tag";
    label.textContent = item.label || item.category || "";

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const text = document.createElement("p");
    text.textContent = item.text || "";

    article.appendChild(label);
    article.appendChild(title);
    article.appendChild(text);

    target.appendChild(article);
  });
}

function renderDevlogPage() {
  const target = document.querySelector("[data-devlog-list]");

  if (!target || !Array.isArray(window.yoyoyudenDevlog)) {
    return;
  }

  target.innerHTML = "";

  window.yoyoyudenDevlog.forEach((item) => {
    const article = document.createElement("article");
    article.className = "devlog-article";

    const meta = document.createElement("p");
    meta.className = "log-tag";
    meta.textContent = [item.label, item.category].filter(Boolean).join(" / ");

    const title = document.createElement("h2");
    title.textContent = item.title || "";

    const text = document.createElement("p");
    text.textContent = item.text || "";

    article.appendChild(meta);
    article.appendChild(title);
    article.appendChild(text);

    if (Array.isArray(item.images) && item.images.length > 0) {
      const gallery = document.createElement("div");
      gallery.className = "devlog-gallery";

      item.images.forEach((image) => {
        if (!image.src) {
          return;
        }

        const figure = document.createElement("figure");
        const img = document.createElement("img");
        const caption = document.createElement("figcaption");

        img.src = image.src;
        img.alt = image.alt || "";
        img.loading = "lazy";
        img.addEventListener("error", () => {
          figure.classList.add("is-placeholder");
          img.remove();
        });

        caption.textContent = image.alt || "";

        figure.appendChild(img);
        figure.appendChild(caption);
        gallery.appendChild(figure);
      });

      article.appendChild(gallery);
    }

    if (Array.isArray(item.qa) && item.qa.length > 0) {
      const qaList = document.createElement("div");
      qaList.className = "devlog-qa";

      item.qa.forEach((qa) => {
        const block = document.createElement("div");

        const question = document.createElement("p");
        question.className = "devlog-question";
        question.textContent = qa.question || "";

        const answer = document.createElement("p");
        answer.textContent = qa.answer || "";

        block.appendChild(question);
        block.appendChild(answer);
        qaList.appendChild(block);
      });

      article.appendChild(qaList);
    }

    target.appendChild(article);
  });
}
