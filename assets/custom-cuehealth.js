/* CueHealth Custom JavaScript */

(function () {
  'use strict';

  /* =========================================
     STICKY ADD-TO-CART BAR (product pages)
     ========================================= */
  function initStickyATC() {
    var bar = document.getElementById('ch-sticky-atc');
    if (!bar) return;

    var mainForm = document.querySelector('.product-form__submit');
    if (!mainForm) return;

    var productTitle = document.querySelector('.product__title');
    var productPrice = document.querySelector('.price__regular .price-item--regular');
    var productImg   = document.querySelector('.product__media img');

    if (productTitle) {
      var titleEl = bar.querySelector('.ch-sticky-atc__title');
      if (titleEl) titleEl.textContent = productTitle.textContent.trim();
    }
    if (productPrice) {
      var priceEl = bar.querySelector('.ch-sticky-atc__price');
      if (priceEl) priceEl.textContent = productPrice.textContent.trim();
    }
    if (productImg) {
      var imgEl = bar.querySelector('.ch-sticky-atc__img');
      if (imgEl) {
        imgEl.src = productImg.src;
        imgEl.alt = productImg.alt;
      }
    }

    var addBtn = bar.querySelector('.ch-sticky-atc__btn');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var mainBtn = document.querySelector('.product-form__submit:not([disabled])');
        if (mainBtn) mainBtn.click();
      });
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          bar.classList.add('visible');
          document.body.classList.add('has-sticky-atc');
        } else {
          bar.classList.remove('visible');
          document.body.classList.remove('has-sticky-atc');
        }
      });
    }, { threshold: 0.1 });

    observer.observe(mainForm);
  }

  /* =========================================
     TESTIMONIALS CAROUSEL
     ========================================= */
  function initTestimonialsCarousel() {
    var carousels = document.querySelectorAll('[data-ch-testimonials]');
    carousels.forEach(function (carousel) {
      var track = carousel.querySelector('.ch-testimonials__track');
      var cards = carousel.querySelectorAll('.ch-testimonials__card');
      var btnPrev = carousel.querySelector('.ch-testimonials__btn--prev');
      var btnNext = carousel.querySelector('.ch-testimonials__btn--next');
      var dotsContainer = carousel.querySelector('.ch-testimonials__dots');

      if (!track || cards.length === 0) return;

      var current = 0;
      var visibleCount = getVisibleCount();
      var maxIndex = Math.max(0, cards.length - visibleCount);
      var autoplayTimer = null;

      function getVisibleCount() {
        var w = window.innerWidth;
        if (w >= 990) return 3;
        if (w >= 750) return 2;
        return 1;
      }

      function buildDots() {
        if (!dotsContainer) return;
        dotsContainer.innerHTML = '';
        var numDots = maxIndex + 1;
        for (var i = 0; i <= maxIndex; i++) {
          var dot = document.createElement('button');
          dot.className = 'ch-testimonials__dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
          dot.dataset.index = i;
          dot.addEventListener('click', function () {
            goTo(parseInt(this.dataset.index));
          });
          dotsContainer.appendChild(dot);
        }
      }

      function updateDots() {
        if (!dotsContainer) return;
        dotsContainer.querySelectorAll('.ch-testimonials__dot').forEach(function (dot, i) {
          dot.classList.toggle('active', i === current);
        });
      }

      function goTo(index) {
        current = Math.max(0, Math.min(index, maxIndex));
        var cardWidth = cards[0].offsetWidth + 24;
        track.style.transform = 'translateX(-' + (current * cardWidth) + 'px)';
        updateDots();
      }

      function startAutoplay() {
        autoplayTimer = setInterval(function () {
          var next = current >= maxIndex ? 0 : current + 1;
          goTo(next);
        }, 5000);
      }

      function stopAutoplay() {
        clearInterval(autoplayTimer);
      }

      if (btnPrev) {
        btnPrev.addEventListener('click', function () {
          stopAutoplay();
          goTo(current - 1);
          startAutoplay();
        });
      }
      if (btnNext) {
        btnNext.addEventListener('click', function () {
          stopAutoplay();
          goTo(current + 1);
          startAutoplay();
        });
      }

      window.addEventListener('resize', function () {
        visibleCount = getVisibleCount();
        maxIndex = Math.max(0, cards.length - visibleCount);
        current = Math.min(current, maxIndex);
        buildDots();
        goTo(current);
      });

      buildDots();
      startAutoplay();
    });
  }

  /* =========================================
     PRODUCT ACCORDION (new ch-pdp-accordion)
     ========================================= */
  function initProductTabs() {
    var triggers = document.querySelectorAll('.ch-pdp-acc__trigger');
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        var item    = this.closest('.ch-pdp-acc__item');
        var body    = item.querySelector('.ch-pdp-acc__body');
        var isOpen  = !body.hidden;

        /* Close all */
        document.querySelectorAll('.ch-pdp-acc__item').forEach(function (el) {
          el.removeAttribute('data-open');
          el.classList.remove('ch-pdp-acc__item--open');
          el.querySelector('.ch-pdp-acc__trigger').setAttribute('aria-expanded', 'false');
          el.querySelector('.ch-pdp-acc__body').hidden = true;
        });

        /* Open clicked unless it was already open */
        if (!isOpen) {
          item.setAttribute('data-open', '');
          item.classList.add('ch-pdp-acc__item--open');
          trigger.setAttribute('aria-expanded', 'true');
          body.hidden = false;
        }
      });
    });
  }

  /* =========================================
     SOCIAL PROOF COUNTER
     ========================================= */
  function initSocialProof() {
    var el = document.getElementById('ch-viewer-count');
    if (!el) return;
    var base = Math.floor(Math.random() * 18) + 12; /* 12–29 */
    el.textContent = base;
    setInterval(function () {
      var delta = Math.random() > 0.5 ? 1 : -1;
      base = Math.max(8, Math.min(40, base + delta));
      el.textContent = base;
    }, 7000);
  }

  /* =========================================
     ANNOUNCEMENT BAR AUTO-ROTATE (CSS marquee fallback)
     Already handled by Dawn's slideshow for multi-blocks.
     ========================================= */

  /* =========================================
     DISCOUNT CODE FROM URL PARAM
     ========================================= */
  function applyDiscountFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var code = params.get('discount');
    if (!code) return;
    fetch('/discount/' + encodeURIComponent(code))
      .then(function () {})
      .catch(function () {});
  }

  /* =========================================
     HERO IMAGE SLIDESHOW
     ========================================= */
  function initHeroSlideshow() {
    var heroes = document.querySelectorAll('[data-ch-slideshow]');
    heroes.forEach(function (hero) {
      var slides   = hero.querySelectorAll('.ch-hero__slide');
      var dots     = hero.querySelectorAll('.ch-hero__slide-dot');
      var btnPrev  = hero.querySelector('.ch-hero__slide-btn--prev');
      var btnNext  = hero.querySelector('.ch-hero__slide-btn--next');
      if (slides.length < 2) return;

      var current  = 0;
      var interval = parseInt(hero.dataset.interval, 10) || 5000;
      var timer    = null;

      function goTo(index) {
        slides[current].classList.remove('ch-hero__slide--active');
        if (dots[current]) { dots[current].classList.remove('active'); dots[current].setAttribute('aria-selected', 'false'); }
        current = (index + slides.length) % slides.length;
        slides[current].classList.add('ch-hero__slide--active');
        if (dots[current]) { dots[current].classList.add('active'); dots[current].setAttribute('aria-selected', 'true'); }
      }

      function next() { goTo(current + 1); }
      function prev() { goTo(current - 1); }

      function startTimer() {
        timer = setInterval(next, interval);
      }
      function resetTimer() {
        clearInterval(timer);
        startTimer();
      }

      dots.forEach(function (dot) {
        dot.addEventListener('click', function () {
          goTo(parseInt(this.dataset.dotIndex, 10));
          resetTimer();
        });
      });

      if (btnPrev) btnPrev.addEventListener('click', function () { prev(); resetTimer(); });
      if (btnNext) btnNext.addEventListener('click', function () { next(); resetTimer(); });

      /* Pause on hover */
      hero.addEventListener('mouseenter', function () { clearInterval(timer); });
      hero.addEventListener('mouseleave', function () { startTimer(); });

      /* Touch / swipe support */
      var touchStartX = 0;
      hero.addEventListener('touchstart', function (e) { touchStartX = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', function (e) {
        var diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) { diff > 0 ? next() : prev(); resetTimer(); }
      }, { passive: true });

      startTimer();
    });
  }

  /* =========================================
     INIT
     ========================================= */
  document.addEventListener('DOMContentLoaded', function () {
    initStickyATC();
    initTestimonialsCarousel();
    initProductTabs();
    initSocialProof();
    applyDiscountFromUrl();
    initHeroSlideshow();
  });
})();
