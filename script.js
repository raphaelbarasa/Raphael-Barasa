(() => {
  'use strict';

  const root = document.documentElement;
  const mainThemeToggle = document.getElementById('themeToggle');
  const gallery = document.querySelector('.portfolio-gallery');
  const galleryThemeToggle = document.getElementById('galleryThemeToggle');
  const galleryThemeLabel = galleryThemeToggle?.querySelector('.portfolio-gallery__theme-label');

  function setTheme(theme, persist = false) {
    const isDark = theme === 'dark';
    root.dataset.theme = isDark ? 'dark' : 'light';
    mainThemeToggle?.setAttribute('aria-label', isDark ? 'Toggle light mode' : 'Toggle dark mode');
    galleryThemeToggle?.setAttribute('aria-pressed', String(isDark));
    galleryThemeToggle?.setAttribute('aria-label', `Enable ${isDark ? 'light' : 'dark'} mode`);
    if (galleryThemeLabel) galleryThemeLabel.textContent = isDark ? 'Light mode' : 'Dark mode';

    const themeColor = document.querySelector('meta[name="theme-color"]');
    themeColor?.setAttribute('content', isDark ? '#0b1120' : '#2563EB');

    if (persist) {
      try {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        localStorage.setItem('portfolio-gallery-theme', isDark ? 'dark' : 'light');
      } catch {
        // Theme still works when browser storage is unavailable.
      }
    }
  }

  let savedTheme = null;
  try {
    savedTheme = localStorage.getItem('theme') || localStorage.getItem('portfolio-gallery-theme');
  } catch {
    // Use the page's theme when storage is unavailable.
  }
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  setTheme(savedTheme || root.dataset.theme || (prefersDark ? 'dark' : 'light'));

  mainThemeToggle?.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });
  galleryThemeToggle?.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true);
  });

  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  const mobileBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.getElementById('navLinks');
  if (mobileBtn && navLinks) {
    mobileBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      mobileBtn.setAttribute('aria-expanded', String(open));
    });
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        mobileBtn.setAttribute('aria-expanded', 'false');
      });
    });

    const sections = ['about', 'experience', 'skills', 'work', 'contact']
      .map((id) => document.getElementById(id))
      .filter(Boolean);
    const linkMap = {};
    navLinks.querySelectorAll('a[href^="#"]').forEach((link) => {
      linkMap[link.getAttribute('href').slice(1)] = link;
    });

    if (sections.length && 'IntersectionObserver' in window) {
      const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          Object.values(linkMap).forEach((link) => link.classList.remove('active'));
          linkMap[entry.target.id]?.classList.add('active');
        });
      }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
      sections.forEach((section) => sectionObserver.observe(section));
    }
  }

  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length && 'IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add('visible'));
  }

  const filterBar = document.getElementById('filterBar');
  if (filterBar) {
    const workCards = document.querySelectorAll('.work-card');
    filterBar.addEventListener('click', (event) => {
      const button = event.target.closest('.filter-chip');
      if (!button) return;
      filterBar.querySelectorAll('.filter-chip').forEach((chip) => chip.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      workCards.forEach((card) => {
        const categories = (card.dataset.category || '').split(/\s+/);
        card.classList.toggle('hidden', filter !== 'all' && !categories.includes(filter));
      });
    });
  }

  const counters = document.querySelectorAll('.stat-value[data-target]');
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function formatNumber(value, decimals) {
    return decimals > 0 ? value.toFixed(decimals) : Math.round(value).toLocaleString();
  }
  function runCounter(element) {
    const target = parseFloat(element.dataset.target);
    if (!Number.isFinite(target)) return;
    const prefix = element.dataset.prefix || '';
    const suffix = element.dataset.suffix || '';
    const duration = parseInt(element.dataset.duration, 10) || 1800;
    const decimals = parseInt(element.dataset.decimals, 10) || 0;
    if (reduceMotion) {
      element.textContent = `${prefix}${formatNumber(target, decimals)}${suffix}`;
      return;
    }
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const current = target * (1 - Math.pow(1 - progress, 3));
      element.textContent = `${prefix}${formatNumber(current, decimals)}${suffix}`;
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  if (counters.length && 'IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        runCounter(entry.target);
        counterObserver.unobserve(entry.target);
      });
    }, { threshold: 0.4 });
    counters.forEach((counter) => counterObserver.observe(counter));
  } else {
    counters.forEach(runCounter);
  }

  const yearElement = document.getElementById('year');
  if (yearElement) yearElement.textContent = new Date().getFullYear();

  if (gallery) {
    const tiles = Array.from(gallery.querySelectorAll('.portfolio-gallery__tile'));
    const filters = Array.from(gallery.querySelectorAll('.portfolio-gallery__filter'));
    const status = gallery.querySelector('#galleryStatus');
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

    function applyFilter(category) {
      activeTiles = tiles.filter((tile) => category === 'all' || tile.dataset.category === category);
      tiles.forEach((tile) => { tile.hidden = !activeTiles.includes(tile); });
      filters.forEach((filter) => {
        filter.setAttribute('aria-pressed', String(filter.dataset.filter === category));
      });
      if (status) {
        status.textContent = `${activeTiles.length} ${activeTiles.length === 1 ? 'project' : 'projects'}`;
      }
    }

    function displayImage(tile) {
      const sourceImage = tile.querySelector('img');
      const source = sourceImage?.getAttribute('src');
      const unavailable = !source || tile.classList.contains('image-unavailable');
      lightboxCaption.textContent = tile.dataset.caption || sourceImage?.alt || '';
      lightboxImage.alt = sourceImage?.alt || '';
      lightboxImage.onload = () => {
        lightboxImage.hidden = false;
        lightboxFallback.hidden = true;
      };
      lightboxImage.onerror = () => {
        lightboxImage.hidden = true;
        lightboxFallback.hidden = false;
      };
      lightboxImage.removeAttribute('src');
      lightboxImage.hidden = unavailable;
      lightboxFallback.hidden = !unavailable;
      if (!unavailable) lightboxImage.src = source;
    }

    function openLightbox(index, saveFocus = false) {
      if (!lightbox || !activeTiles.length) return;
      currentIndex = (index + activeTiles.length) % activeTiles.length;
      if (saveFocus) previousFocus = document.activeElement;
      displayImage(activeTiles[currentIndex]);
      lightbox.hidden = false;
      document.body.classList.add('portfolio-gallery-lock');
      closeButton?.focus();
    }

    function closeLightbox() {
      if (!lightbox || lightbox.hidden) return;
      lightbox.hidden = true;
      document.body.classList.remove('portfolio-gallery-lock');
      lightboxImage?.removeAttribute('src');
      if (previousFocus?.isConnected) previousFocus.focus();
    }

    filters.forEach((filter) => {
      filter.addEventListener('click', () => applyFilter(filter.dataset.filter || 'all'));
    });
    tiles.forEach((tile) => {
      const image = tile.querySelector('img');
      image?.addEventListener('error', () => tile.classList.add('image-unavailable'));
      if (image?.complete && image.naturalWidth === 0) tile.classList.add('image-unavailable');
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
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        openLightbox(currentIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        openLightbox(currentIndex + 1);
      }
      if (event.key === 'Tab') {
        const focusable = Array.from(lightbox.querySelectorAll('button:not([disabled])'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    });

    applyFilter('all');
  }
})();
