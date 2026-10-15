/* 既存スライダーを生かした、任意で有効になる額装と拡大表示。 */
(() => {
  "use strict";
  function initGalleryPolish() {
    if (!document.body || typeof HTMLDialogElement === "undefined") return;
    const dialogDocument = document;
    document.querySelectorAll(".screenshot-slider").forEach((slider, galleryIndex) => {
      if (slider.closest(".gallery-frame")) return;
      const slides = Array.from(slider.querySelectorAll(".screenshot-slide"));
      const images = slides.map((slide) => slide.querySelector("img"));
      if (!images.length || images.some((image) => !image)) return;
      const frame = document.createElement("div");
      frame.className = "gallery-frame";
      slider.before(frame);
      frame.append(slider);
      ["tl", "tr", "bl", "br"].forEach((corner) => {
        const ornament = document.createElement("span");
        ornament.className = "gallery-corner gallery-corner--" + corner;
        ornament.setAttribute("aria-hidden", "true");
        frame.append(ornament);
      });
      const expand = document.createElement("button");
      expand.type = "button";
      expand.className = "gallery-expand";
      expand.setAttribute("aria-label", "現在のスクリーンショットを拡大");
      expand.setAttribute("aria-haspopup", "dialog");
      expand.title = "画像を拡大";
      slider.append(expand);

      const dialog = document.createElement("dialog");
      dialog.className = "gallery-viewer";
      const titleId = "gallery-viewer-title-" + galleryIndex;
      dialog.setAttribute("aria-labelledby", titleId);
      const header = document.createElement("div");
      header.className = "gallery-viewer__header";
      const title = document.createElement("h2");
      title.className = "gallery-viewer__title";
      title.id = titleId;
      title.textContent = "スクリーンショット";
      const close = document.createElement("button");
      close.type = "button";
      close.textContent = "閉じる ×";
      close.autofocus = true;
      header.append(title, close);
      const image = document.createElement("img");
      image.className = "gallery-viewer__image";
      const controls = document.createElement("div");
      controls.className = "gallery-viewer__controls";
      const previous = document.createElement("button");
      previous.type = "button";
      previous.textContent = "← 前へ";
      previous.setAttribute("aria-label", "前のスクリーンショット");
      const count = document.createElement("span");
      count.className = "gallery-viewer__count";
      count.setAttribute("aria-live", "polite");
      count.setAttribute("aria-atomic", "true");
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "次へ →";
      next.setAttribute("aria-label", "次のスクリーンショット");
      controls.append(previous, count, next);
      dialog.append(header, image, controls);
      dialogDocument.body.append(dialog);
      let current = 0;
      let returnFocus = null;
      const enabled = () => document.body.classList.contains("detail-polish");
      const pause = (pauseValue, reason) => slider.dispatchEvent(new CustomEvent("yoyoyuden:slider-pause", {
        detail: { pause: pauseValue, reason: "gallery-" + reason }
      }));
      const show = (index) => {
        current = (index + images.length) % images.length;
        image.src = new URL(images[current].currentSrc || images[current].src, document.baseURI).href;
        image.alt = images[current].alt;
        count.textContent = (current + 1) + " / " + images.length;
        slider.dispatchEvent(new CustomEvent("yoyoyuden:slider-select", { detail: { index: current } }));
      };
      expand.addEventListener("click", () => {
        if (!enabled() || dialog.open) return;
        const active = slides.findIndex((slide) => slide.classList.contains("is-active"));
        returnFocus = document.activeElement;
        pause(true, "dialog");
        show(active < 0 ? 0 : active);
        dialog.showModal();
      });
      previous.addEventListener("click", () => show(current - 1));
      next.addEventListener("click", () => show(current + 1));
      close.addEventListener("click", () => dialog.close());
      dialog.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          show(current + (event.key === "ArrowLeft" ? -1 : 1));
        }
      });
      dialog.addEventListener("close", () => {
        pause(false, "dialog");
        if (enabled() && returnFocus && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
        returnFocus = null;
      });
      slider.addEventListener("pointerenter", () => { if (enabled()) pause(true, "pointer"); });
      slider.addEventListener("pointerleave", () => pause(false, "pointer"));
      slider.addEventListener("focusin", () => { if (enabled()) pause(true, "focus"); });
      slider.addEventListener("focusout", (event) => {
        if (!slider.contains(event.relatedTarget)) pause(false, "focus");
      });
      const syncMode = () => {
        expand.tabIndex = enabled() ? 0 : -1;
        expand.setAttribute("aria-hidden", enabled() ? "false" : "true");
        if (!enabled()) {
          if (dialog.open) dialog.close();
          ["dialog", "pointer", "focus"].forEach((reason) => pause(false, reason));
        }
      };
      const modeObserver = new MutationObserver(syncMode);
      modeObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
      window.addEventListener("pagehide", (event) => {
        if (dialog.open) dialog.close();
        // 戻る操作で復元される文書には、拡大用の要素と監視を残す。
        if (event.persisted) return;
        modeObserver.disconnect();
        dialog.remove();
      });
      syncMode();
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initGalleryPolish);
  else initGalleryPolish();
})();
