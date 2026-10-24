(function () {
    'use strict';

    /* ---------- Theme toggle with localStorage ---------- */
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

    // Sync meta theme-color on first paint
    setTheme(root.getAttribute('data-theme') || 'light');

    /* ---------- Sticky header shadow on scroll ---------- */
    const header = document.getElementById('header');
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Mobile menu ---------- */
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

    /* ---------- Scroll-spy (active nav link) ---------- */
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

    /* ---------- Scroll reveal ---------- */
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

    /* ---------- Case-study filter ---------- */
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

    /* ---------- Animated stat counter ---------- */
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

      // Respect reduced motion — jump straight to final value
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
          // Ensure exact final value (no floating-point drift)
          el.textContent = prefix + formatNumber(target, decimals) + suffix;
        }
      }
      requestAnimationFrame(tick);
    }

    // Fire the counter once the stat card scrolls into view
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

    /* ---------- Footer year ---------- */
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

})();