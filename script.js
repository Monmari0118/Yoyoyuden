document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("site-glow");
  initWelcomeGate();
  initSmoothScroll();
  initScreenshotSlider();
  renderActivityRecords();
  renderDevlogPage();
  initContactForm();
  initLeafParticles();
  initScrollReveal();
  initScrollSpy();
});

/* ===== ウェルカム画面（初回のみ表示） ===== */

function initWelcomeGate() {
  const gate = document.querySelector(".welcome-gate");

  if (!gate) {
    return;
  }

  const enterButton = gate.querySelector("[data-welcome-enter]");
  const leaveButton = gate.querySelector("[data-welcome-leave]");

  if (enterButton) {
    enterButton.addEventListener("click", () => {
      try {
        localStorage.setItem("yoyoyudenWelcomeSeen", "1");
      } catch (error) {
        // プライベートモード等で保存できなくても入場は可能にする
      }

      gate.classList.add("is-fading");

      window.setTimeout(() => {
        document.documentElement.classList.add("welcome-seen");
      }, 600);
    });
  }

  if (leaveButton) {
    leaveButton.addEventListener("click", () => {
      window.close();

      // スクリプトからタブを閉じられないブラウザでは空白ページへ退避する
      window.setTimeout(() => {
        window.location.href = "about:blank";
      }, 300);
    });
  }
}

/* ===== 舞い散る葉のパーティクル ===== */

function initLeafParticles() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (reducedMotion.matches) {
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.className = "leaf-canvas";
  canvas.setAttribute("aria-hidden", "true");
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");

  // テーマに合わせた葉の色（緑〜翡翠、たまに金色）
  const LEAF_COLORS = [
    "rgba(142, 240, 212, ALPHA)",
    "rgba(112, 198, 112, ALPHA)",
    "rgba(77, 160, 98, ALPHA)",
    "rgba(164, 255, 240, ALPHA)",
    "rgba(255, 231, 164, ALPHA)"
  ];

  let width = 0;
  let height = 0;
  let leaves = [];

  const makeLeaf = (randomY) => {
    const depth = 0.35 + Math.random() * 0.65; // 奥行き（大きさ・速度・濃さに影響）
    return {
      x: Math.random() * width,
      y: randomY ? Math.random() * height : -30,
      size: 7 + depth * 11,
      speedY: 0.35 + depth * 0.75,
      drift: 0.2 + Math.random() * 0.5,
      swayPhase: Math.random() * Math.PI * 2,
      swaySpeed: 0.006 + Math.random() * 0.012,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.02,
      color: LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)],
      alpha: 0.28 + depth * 0.45
    };
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(26, Math.max(10, Math.round(width / 60)));

    while (leaves.length < count) {
      leaves.push(makeLeaf(true));
    }

    leaves.length = count;
  };

  const drawLeaf = (leaf) => {
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.angle + Math.sin(leaf.swayPhase) * 0.5);

    const s = leaf.size;
    ctx.fillStyle = leaf.color.replace("ALPHA", leaf.alpha.toFixed(2));
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.quadraticCurveTo(s * 0.72, -s * 0.25, 0, s);
    ctx.quadraticCurveTo(-s * 0.72, -s * 0.25, 0, -s);
    ctx.fill();

    // 中央の葉脈
    ctx.strokeStyle = "rgba(6, 22, 24, " + (leaf.alpha * 0.55).toFixed(2) + ")";
    ctx.lineWidth = Math.max(0.6, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.7);
    ctx.lineTo(0, s * 0.8);
    ctx.stroke();

    ctx.restore();
  };

  const step = () => {
    ctx.clearRect(0, 0, width, height);

    for (const leaf of leaves) {
      leaf.swayPhase += leaf.swaySpeed * 16;
      leaf.x += Math.sin(leaf.swayPhase) * 0.6 + leaf.drift * 0.3;
      leaf.y += leaf.speedY;
      leaf.angle += leaf.spin;

      if (leaf.y > height + 40 || leaf.x > width + 60) {
        Object.assign(leaf, makeLeaf(false));
        leaf.x = Math.random() * width - 40;
      }

      drawLeaf(leaf);
    }

    animationId = window.requestAnimationFrame(step);
  };

  let animationId = 0;

  resize();
  window.addEventListener("resize", resize);
  animationId = window.requestAnimationFrame(step);

  // 途中で「動きを減らす」に切り替えた場合は停止して消す
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      window.cancelAnimationFrame(animationId);
      canvas.remove();
    }
  });
}

/* ===== スクロールで要素をふわっと表示 ===== */

function initScrollReveal() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    return;
  }

  const selector = [
    ".section-head",
    ".card",
    ".download-panel",
    ".pv-card",
    ".activity-card",
    ".staff-card",
    ".link-card",
    ".contact-card > div",
    ".music-preview-card",
    ".zip-card",
    ".secret-card",
    ".quick-info > div",
    ".myaga-work",
    ".tengoku-illust-card",
    ".history-item",
    ".log-article",
    ".devlog-article",
    ".contact-form-card",
    ".qa-item",
    ".qa-jump-card"
  ].join(", ");

  const targets = Array.from(document.querySelectorAll(selector));

  if (targets.length === 0) {
    return;
  }

  // 同じ親を持つ要素は順番に少しずつ遅らせて現れる
  const siblingCounts = new Map();

  targets.forEach((el) => {
    const parent = el.parentElement;
    const index = siblingCounts.get(parent) || 0;
    siblingCounts.set(parent, index + 1);
    el.classList.add("reveal");
    el.style.setProperty("--reveal-delay", Math.min(index * 90, 360) + "ms");
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const el = entry.target;
      el.classList.add("is-in");
      observer.unobserve(el);

      window.setTimeout(() => {
        el.classList.add("is-done");
      }, 1300);
    });
  }, {
    threshold: 0.1,
    rootMargin: "0px 0px -8% 0px"
  });

  targets.forEach((el) => observer.observe(el));
}

/* ===== ナビの現在地ハイライト（トップページのみ） ===== */

function initScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.site-nav a[href^="#"]'));

  if (navLinks.length === 0 || !("IntersectionObserver" in window)) {
    return;
  }

  const linkByHash = new Map();

  navLinks.forEach((link) => {
    linkByHash.set(link.getAttribute("href"), link);
  });

  const sections = Array.from(document.querySelectorAll("section[id]"))
    .filter((section) => linkByHash.has("#" + section.id));

  if (sections.length === 0) {
    return;
  }

  const setCurrent = (hash) => {
    navLinks.forEach((link) => {
      link.classList.toggle("is-current", link.getAttribute("href") === hash);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        setCurrent("#" + entry.target.id);
      }
    });
  }, {
    rootMargin: "-38% 0px -55% 0px",
    threshold: 0
  });

  sections.forEach((section) => observer.observe(section));
}

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

  let updateList = null;

  const ensureUpdateList = () => {
    if (!updateList) {
      updateList = document.createElement("ul");
      updateList.className = "update-list";
      target.appendChild(updateList);
    }

    return updateList;
  };

  updates.forEach((item) => {
    if (item.title) {
      updateList = null;

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

    const ul = ensureUpdateList();
    const li = document.createElement("li");

    const time = document.createElement("time");
    time.dateTime = item.date || "";
    time.textContent = item.label || "";

    const span = document.createElement("span");
    span.textContent = item.text || "";

    li.appendChild(time);
    li.appendChild(span);
    ul.appendChild(li);
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

    const tickerItems = [...data.ticker, ...data.ticker];

    tickerItems.forEach((item) => {
      const span = document.createElement("span");
      span.className = "ticker-item";

      const label = document.createElement("strong");
      label.textContent = item.label || "";

      const text = document.createElement("span");
      text.textContent = item.text || "";

      span.appendChild(label);
      span.appendChild(text);
      tickerTrack.appendChild(span);
    });
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

  window.yoyoyudenDevlog.forEach((entry) => {
    const article = document.createElement("article");
    article.className = "devlog-article";

    const head = document.createElement("div");
    head.className = "devlog-head";

    const time = document.createElement("time");
    time.dateTime = entry.date || "";
    time.textContent = entry.label || "";
    head.appendChild(time);

    if (entry.title) {
      const h2 = document.createElement("h2");
      h2.textContent = entry.title;
      head.appendChild(h2);
    }

    article.appendChild(head);

    (entry.blocks || []).forEach((block) => {
      if (block.type === "text") {
        const p = document.createElement("p");
        p.className = "devlog-text";
        p.textContent = block.text || "";
        article.appendChild(p);
        return;
      }

      if (block.type === "image" && block.src) {
        const figure = document.createElement("figure");
        figure.className = "devlog-figure";

        const img = document.createElement("img");
        img.src = block.src;
        img.alt = block.alt || "";
        img.loading = "lazy";
        figure.appendChild(img);

        if (block.caption) {
          const caption = document.createElement("figcaption");
          caption.textContent = block.caption;
          figure.appendChild(caption);
        }

        article.appendChild(figure);
        return;
      }

      if (block.type === "sign") {
        const p = document.createElement("p");
        p.className = "devlog-sign";
        p.textContent = block.text || "";
        article.appendChild(p);
        return;
      }

      if (block.type === "divider") {
        const hr = document.createElement("hr");
        hr.className = "devlog-divider";
        article.appendChild(hr);
      }
    });

    target.appendChild(article);
  });
}

/* ===== 問い合わせフォーム（送信完了メッセージ） ===== */

function initContactForm() {
  const formCard = document.querySelector(".contact-form-card");

  if (!formCard) {
    return;
  }

  const params = new URLSearchParams(window.location.search);

  if (params.get("sent") !== "1") {
    return;
  }

  const success = document.createElement("p");
  success.className = "form-success";
  success.textContent = "送信しました。お問い合わせありがとうございました！";
  formCard.insertBefore(success, formCard.querySelector("form"));
}
