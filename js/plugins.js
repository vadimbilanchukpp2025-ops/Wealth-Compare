// ЛР 10: ініціалізація JS-плагінів, підключених через CDN (Swiper 11, Fancybox 5, Typed.js 2).
// Один клас MediaWidgets: кожен плагін має свій метод, а відсутність бібліотеки (CDN недоступний)
// не ламає сторінку — секція лишається читабельною без JavaScript-ефектів.
class MediaWidgets {
  static TYPED_STRINGS = ["ставку", "комісії", "строк", "умови дострокового зняття", "джерело даних"];

  // Fancybox v5 не має української локалізації — передаємо власні рядки інтерфейсу.
  static FANCYBOX_UK = {
    CLOSE: "Закрити",
    NEXT: "Далі",
    PREV: "Назад",
    MODAL: "Натисніть Esc, щоб закрити",
    ERROR: "Щось пішло не так. Спробуйте пізніше",
    IMAGE_ERROR: "Не вдалося завантажити зображення",
    TOGGLE_ZOOM: "Збільшити / зменшити",
    TOGGLE_THUMBS: "Показати / сховати мініатюри",
    TOGGLE_SLIDESHOW: "Слайд-шоу",
    TOGGLE_FULLSCREEN: "Повноекранний режим",
    ZOOMIN: "Збільшити",
    ZOOMOUT: "Зменшити",
    DOWNLOAD: "Завантажити",
  };

  constructor() {
    this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.status = { swiper: "not-initialised", fancybox: "not-initialised", typed: "not-initialised" };
    this.swiper = null;
    this.typed = null;
  }

  init() {
    this.initSwiper();
    this.initFancybox();
    this.initTyped();
    document.documentElement.dataset.plugins = JSON.stringify(this.status); // видно в DevTools → Elements
  }

  initSwiper() {
    const root = document.querySelector(".guide-swiper");
    if (!root) return;
    if (typeof window.Swiper !== "function") {
      this.status.swiper = "cdn-missing"; // CSS-запасний варіант: горизонтальна прокрутка з scroll-snap
      document.querySelectorAll(".guide-prev, .guide-next").forEach((b) => b.classList.add("hidden")); // без Swiper стрілки нічого не роблять
      return;
    }
    this.swiper = new Swiper(root, {
      slidesPerView: 1,
      spaceBetween: 16,
      speed: this.reducedMotion ? 0 : 600, // тривалість анімації переходу, мс; при reduced motion — миттєва зміна без руху
      loop: true,
      grabCursor: true,
      watchOverflow: true,
      keyboard: { enabled: true, onlyInViewport: true },
      a11y: {
        enabled: true,
        prevSlideMessage: "Попередній слайд",
        nextSlideMessage: "Наступний слайд",
        paginationBulletMessage: "Перейти до слайда {{index}}",
        slideLabelMessage: "{{index}} з {{slidesLength}}",
      },
      // пауза між слайдами, мс; автоплей зупиняється наведенням і фокусом (WCAG 2.2.2 «Pause, Stop, Hide»)
      autoplay: { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true },
      navigation: { nextEl: ".guide-next", prevEl: ".guide-prev" },
      pagination: {
        el: ".guide-pagination",
        clickable: true,
        bulletClass: "guide-bullet",
        bulletActiveClass: "guide-bullet-active",
      },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 20 },
        1024: { slidesPerView: 3, spaceBetween: 24 },
      },
    });
    this.pauseAutoplayOnFocus(root.closest("section") || root);
    this.status.swiper = "ok";
  }

  // pauseOnMouseEnter працює лише для миші; для клавіатури зупиняємо автоплей, поки фокус у секції
  // (стрілки навігації стоять у заголовку секції, поза .guide-swiper, тому слухаємо всю секцію).
  pauseAutoplayOnFocus(root) {
    if (!this.swiper.autoplay) return;
    root.addEventListener("focusin", () => this.swiper.autoplay.stop());
    root.addEventListener("focusout", (event) => {
      if (!root.contains(event.relatedTarget)) this.swiper.autoplay.start();
    });
  }

  initFancybox() {
    if (!window.Fancybox) {
      this.status.fancybox = "cdn-missing"; // посилання ведуть на саме зображення — галерея працює як звичайні лінки
      return;
    }
    Fancybox.bind('[data-fancybox="wc-assets"]', {
      l10n: MediaWidgets.FANCYBOX_UK,
      Carousel: { transition: this.reducedMotion ? false : "fade", infinite: true },
      Images: { zoom: true, Panzoom: { maxScale: 3 } },
      Thumbs: { type: "classic" },
      Toolbar: {
        display: { left: ["infobar"], middle: ["zoomIn", "zoomOut", "toggle1to1"], right: ["slideshow", "thumbs", "close"] },
      },
      dragToClose: true,
      hideScrollbar: true,
    });
    this.status.fancybox = "ok";
  }

  initTyped() {
    const target = document.querySelector("#typedCriteria");
    if (!target) return;
    if (typeof window.Typed !== "function") {
      this.status.typed = "cdn-missing"; // у розмітці вже стоїть статичне слово «ставку»
      return;
    }
    target.textContent = "";
    this.typed = new Typed(target, {
      strings: MediaWidgets.TYPED_STRINGS,
      typeSpeed: 55,
      backSpeed: 30,
      backDelay: 1600,
      startDelay: 300,
      smartBackspace: true,
      loop: true,
      cursorChar: "|",
      showCursor: !this.reducedMotion, // при reduced motion — без блимання курсора
    });
    this.status.typed = "ok";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.wcMediaWidgets = new MediaWidgets();
  window.wcMediaWidgets.init();
});
