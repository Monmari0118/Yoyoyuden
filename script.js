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

  renderTweets(window.yoyoyudenRecords.tweets || []);
  renderUpdates(window.yoyoyudenRecords.updates || []);
}

function renderTweets(tweets) {
  const tweetList = document.getElementById("tweetList");

  if (!tweetList) {
    return;
  }

  tweetList.innerHTML = "";

  tweets.forEach((item) => {
    const li = document.createElement("li");

    const time = document.createElement("time");
    time.dateTime = item.date || "";
    time.textContent = item.label || "";

    const p = document.createElement("p");
    p.textContent = item.text || "";

    li.appendChild(time);
    li.appendChild(p);
    tweetList.appendChild(li);
  });
}

function renderUpdates(updates) {
  const updateList = document.getElementById("updateList");

  if (!updateList) {
    return;
  }

  updateList.innerHTML = "";

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
      updateList.appendChild(article);
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
    updateList.appendChild(ul);
  });
}