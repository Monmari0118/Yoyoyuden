document.addEventListener("DOMContentLoaded", () => {
  initScreenshotSlider();
  renderActivityRecords();
});

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

function getLimitedRecords(target, records) {
  const limit = target.dataset.recordLimit;

  if (!limit || limit === "all") {
    return records;
  }

  const count = Number.parseInt(limit, 10);

  if (Number.isNaN(count)) {
    return records;
  }

  return records.slice(0, count);
}

function renderTweets(target, tweets) {
  const limitedTweets = getLimitedRecords(target, tweets);

  target.innerHTML = "";

  limitedTweets.forEach((item) => {
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
  const limitedUpdates = getLimitedRecords(target, updates);

  target.innerHTML = "";

  limitedUpdates.forEach((item) => {
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