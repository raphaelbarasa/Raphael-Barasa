(function () {
    'use strict';

    const root = document.documentElement;
    try {
      const savedTheme = localStorage.getItem('theme');
      const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      root.setAttribute('data-theme', initialTheme);
    } catch (e) {}
    const themeToggle = document.getElementById('themeToggle');

    function setTheme(theme) {
      root.setAttribute('data-theme', theme);
      try { localStorage.setItem('theme', theme); } catch (e) {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'dark' ? '#0b1120' : '#2563EB');
    }

    themeToggle.addEventListener('click', () => {
      const current = root.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });

    setTheme(root.getAttribute('data-theme') || 'light');

    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

     const mobileBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.getElementById('navLinks');
    mobileBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      })
    );

    const sections = ['about', 'experience', 'skills', 'work', 'contact']
      .map(id => document.getElementById(id)).filter(Boolean);
    const linkMap = {};
    navLinks.querySelectorAll('a').forEach(a => {
      const id = a.getAttribute('href').slice(1);
      if (id) linkMap[id] = a;
    });

    const spy = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          Object.values(linkMap).forEach(a => a.classList.remove('active'));
          const link = linkMap[entry.target.id];
          if (link) link.classList.add('active');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(s => spy.observe(s));

    const revealEls = document.querySelectorAll('.reveal');
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(el => revealObs.observe(el));

    const filterBar = document.getElementById('filterBar');
    const workCards = document.querySelectorAll('.work-card');
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        workCards.forEach(card => {
          const cats = (card.dataset.category || '').split(/\s+/);
          const show = filter === 'all' || cats.includes(filter);
          card.classList.toggle('hidden', !show);
        });
      });
    }

    const counters = document.querySelectorAll('.stat-value[data-target]');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function formatNumber(value, decimals) {
      return decimals > 0
        ? value.toFixed(decimals)
        : Math.round(value).toLocaleString();
    }

    function runCounter(el) {
      const target = parseFloat(el.dataset.target);
      if (isNaN(target)) return;

      const prefix   = el.dataset.prefix || '';
      const suffix   = el.dataset.suffix || '';
      const duration = parseInt(el.dataset.duration, 10) || 1800;
      const decimals = parseInt(el.dataset.decimals, 10) || 0;

      if (reduceMotion) {
        el.textContent = prefix + formatNumber(target, decimals) + suffix;
        return;
      }

      const start = performance.now();
      const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const current = target * easeOutCubic(progress);

        el.textContent = prefix + formatNumber(current, decimals) + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
      
          el.textContent = prefix + formatNumber(target, decimals) + suffix;
        }
      }
      requestAnimationFrame(tick);
    }

    if (counters.length) {
      const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            runCounter(entry.target);
            counterObs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(el => counterObs.observe(el));
    }

    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    (() => {
  const gallery = document.querySelector('.portfolio-gallery');
  if (!gallery) return;

  const tiles = Array.from(gallery.querySelectorAll('.portfolio-gallery__tile'));
  const filters = Array.from(gallery.querySelectorAll('.portfolio-gallery__filter'));
  const status = gallery.querySelector('#galleryStatus');
  const themeToggle = gallery.querySelector('#galleryThemeToggle');
  const themeLabel = themeToggle?.querySelector('.portfolio-gallery__theme-label');
  const lightbox = gallery.querySelector('#galleryLightbox');
  const lightboxImage = gallery.querySelector('#galleryLightboxImage');
  const lightboxFallback = gallery.querySelector('#galleryLightboxFallback');
  const lightboxCaption = gallery.querySelector('#galleryLightboxCaption');
  const closeButton = gallery.querySelector('#galleryLightboxClose');
  const previousButton = gallery.querySelector('#galleryLightboxPrev');
  const nextButton = gallery.querySelector('#galleryLightboxNext');
  let activeTiles = tiles;
  let currentIndex = 0;
  let previousFocus = null;

  function setTheme(theme, persist = false) {
    const isDark = theme === 'dark';
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    themeToggle?.setAttribute('aria-pressed', String(isDark));
    themeToggle?.setAttribute('aria-label', `Enable ${isDark ? 'light' : 'dark'} mode`);
    if (themeLabel) themeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';
    if (persist) {
      try {
        localStorage.setItem('portfolio-gallery-theme', isDark ? 'dark' : 'light');
      } catch {
      
      }
    }
  }

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('portfolio-gallery-theme');
  } catch {

  }
  const initialTheme = savedTheme === 'dark' || (savedTheme !== 'light' && document.documentElement.dataset.theme === 'dark')
    ? 'dark'
    : 'light';
  setTheme(initialTheme);
  themeToggle?.addEventListener('click', () => {
    const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme, true);
  });

  tiles.forEach((tile) => {
    const image = tile.querySelector('img');
    if (!image) return;
    image.addEventListener('error', () => tile.classList.add('image-unavailable'));
    if (image.complete && image.naturalWidth === 0) tile.classList.add('image-unavailable');
  });

  function applyFilter(category) {
    activeTiles = tiles.filter((tile) => category === 'all' || tile.dataset.category === category);
    tiles.forEach((tile) => {
      tile.hidden = !activeTiles.includes(tile);
    });
    filters.forEach((filter) => {
      filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
    });
    if (status) {
      const count = activeTiles.length;
      status.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
    }
  }

  function displayImage(tile) {
    const sourceImage = tile.querySelector('img');
    const source = sourceImage?.getAttribute('src');
    lightboxCaption.textContent = tile.dataset.caption || sourceImage?.alt || '';
    lightboxImage.alt = sourceImage?.alt || '';
    lightboxImage.hidden = !source || tile.classList.contains('image-unavailable');
    lightboxFallback.hidden = !lightboxImage.hidden;
    lightboxImage.onload = () => {
      lightboxImage.hidden = false;
      lightboxFallback.hidden = true;
    };
    lightboxImage.onerror = () => {
      lightboxImage.hidden = true;
      lightboxFallback.hidden = false;
    };
    lightboxImage.removeAttribute('src');
    if (source && !tile.classList.contains('image-unavailable')) lightboxImage.src = source;
  }

  function openLightbox(index, saveFocus = false) {
    if (!lightbox || activeTiles.length === 0) return;
    currentIndex = (index + activeTiles.length) % activeTiles.length;
    if (saveFocus) previousFocus = document.activeElement;
    displayImage(activeTiles[currentIndex]);
    lightbox.hidden = false;
    document.body.classList.add('portfolio-gallery-lock');
    closeButton.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('portfolio-gallery-lock');
    lightboxImage.removeAttribute('src');
    if (previousFocus && previousFocus.isConnected) previousFocus.focus();
  }

  filters.forEach((filter) => {
    filter.addEventListener('click', () => applyFilter(filter.dataset.filter || 'all'));
  });

  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      const index = activeTiles.indexOf(tile);
      if (index !== -1) openLightbox(index, true);
    });
  });

  closeButton?.addEventListener('click', closeLightbox);
  previousButton?.addEventListener('click', () => openLightbox(currentIndex - 1));
  nextButton?.addEventListener('click', () => openLightbox(currentIndex + 1));

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (event) => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === 'Escape') {
      closeLightbox();
      return;
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      openLightbox(currentIndex - 1);
      return;
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      openLightbox(currentIndex + 1);
      return;
    }
    if (event.key === 'Tab') {
      const focusable = Array.from(lightbox.querySelectorAll('button:not([disabled])'));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  applyFilter('all');
})();


})();
