document.addEventListener("DOMContentLoaded", () => {
  initSmoothScroll();
  initScreenshotSlider();
  renderActivityRecords();
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