const slides = Array.from(document.querySelectorAll(".screenshot-slide"));
const dots = Array.from(document.querySelectorAll(".slider-dots span"));

let currentSlide = 0;

function showSlide(index) {
  if (slides.length === 0) return;

  slides[currentSlide].classList.remove("is-active");
  if (dots[currentSlide]) dots[currentSlide].classList.remove("is-active");

  currentSlide = index;

  slides[currentSlide].classList.add("is-active");
  if (dots[currentSlide]) dots[currentSlide].classList.add("is-active");
}

function nextSlide() {
  const next = (currentSlide + 1) % slides.length;
  showSlide(next);
}

if (slides.length > 1) {
  setInterval(nextSlide, 4200);
}