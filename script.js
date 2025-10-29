// Minimal, production-ready JS utilities
// - IntersectionObserver-based reveal animations
// - Footer year helper

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on intersection
  function initReveal() {
    const targets = document.querySelectorAll('[data-reveal]');
    if (targets.length === 0) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.2 }
    );

    targets.forEach(el => observer.observe(el));
  }

  // Footer year
  function setYear() {
    const el = document.getElementById('year');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // Mobile nav toggle
  function initNavToggle() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav[data-mobile-nav]');
    if (!toggle || !nav) return;
    const update = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      update(!open);
    });
    // Close on link click (mobile)
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => update(false)));
  }

  // Smooth scroll for internal links respecting reduced motion
  function initSmoothScroll() {
    if (reduceMotion) return;
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        const id = link.getAttribute('href');
        if (!id || id === '#' || id.length < 2) return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', id);
      });
    });
  }

  // Theme toggle (light/dark)
  function initThemeToggle() {
    const btn = document.querySelector('.theme-toggle');
    if (!btn) return;
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    const stored = localStorage.getItem('theme');
    let theme = stored ? stored : (prefersLight ? 'light' : 'dark');
    const apply = () => {
      if (theme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        btn.textContent = '🌙 Dark';
        btn.setAttribute('aria-pressed', 'false');
      } else {
        document.documentElement.removeAttribute('data-theme');
        btn.textContent = '☀️ Light';
        btn.setAttribute('aria-pressed', 'false');
      }
    };
    apply();
    btn.addEventListener('click', () => {
      theme = theme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', theme);
      apply();
    });
  }

  // Project filters
  function initProjectFilters() {
    const filters = document.querySelector('.filters');
    const cards = Array.from(document.querySelectorAll('.projects__grid .project-card'));
    if (!filters || cards.length === 0) return;
    const buttons = Array.from(filters.querySelectorAll('.filter-btn'));
    const setActive = (target) => {
      buttons.forEach(b => {
        const active = b === target;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', String(active));
      });
    };
    const applyFilter = (value) => {
      const isAll = value === 'all';
      cards.forEach(card => {
        const cats = (card.dataset.category || '').split(/\s+/);
        const show = isAll || cats.includes(value);
        card.classList.toggle('is-hidden', !show);
        card.setAttribute('aria-hidden', String(!show));
      });
    };
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        setActive(btn);
        applyFilter(btn.dataset.filter || 'all');
      });
    });
    // Initialize
    const initial = buttons.find(b => b.classList.contains('is-active')) || buttons[0];
    if (initial) {
      setActive(initial);
      applyFilter(initial.dataset.filter || 'all');
    }
  }

  // Auto-categorize projects based on tech stack rule:
  // - Laravel or PHP → add 'web' and 'company' (unless already 'freelance')
  // - Flutter → add 'mobile'; otherwise ensure 'mobile' is not set
  function initProjectAutoCategorize() {
    const cards = document.querySelectorAll('.projects__grid .project-card');
    if (!cards.length) return;
    cards.forEach((card) => {
      const tags = Array.from(card.querySelectorAll('.project-card__tags .tag'))
        .map((el) => el.textContent.trim().toLowerCase());

      const cats = new Set((card.dataset.category || '').split(/\s+/).filter(Boolean));
      const hasLaravel = tags.includes('laravel');
      const hasPhp = tags.includes('php');
      const hasFlutter = tags.includes('flutter');

      if (hasLaravel || hasPhp) {
        cats.add('web');
        const isNonCompany = cats.has('freelance') || cats.has('capstone');
        if (isNonCompany) {
          cats.delete('company');
        } else {
          cats.add('company');
        }
      }

      if (hasFlutter) {
        cats.add('mobile');
      } else {
        cats.delete('mobile');
      }

      card.dataset.category = Array.from(cats).join(' ');
    });
  }

  // Contact form (mailto)
  function initContactForm() {
    const form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = (document.getElementById('name') || {}).value || '';
      const email = (document.getElementById('email') || {}).value || '';
      const message = (document.getElementById('message') || {}).value || '';
      if (!name || !email || !message) {
        form.reportValidity?.();
        return;
      }
      const subject = `Portfolio Inquiry — ${name}`;
      const body = `${message}\n\nFrom: ${name} <${email}>`;
      const mailto = `mailto:edmar.crescencio@mhrpci.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  // Auto-calculate years of experience
  function initExperienceYears() {
    const stats = document.querySelectorAll('.stat[data-experience-start]');
    if (!stats.length) return;
    const currentYear = new Date().getFullYear();
    stats.forEach(el => {
      const start = parseInt(el.getAttribute('data-experience-start'), 10);
      if (!Number.isFinite(start)) return;
      // Inclusive count so 2021 in 2025 shows 5+
      let years = currentYear - start + 1;
      if (years < 1) years = 1;
      const numEl = el.querySelector('.stat__num');
      if (numEl) numEl.textContent = `${years}+`;
    });
  }

  // Auto-count shipped projects using GitHub public repos
  function initGitHubProjectCount() {
    const nodes = document.querySelectorAll('.stat[data-github-user]');
    if (!nodes.length) return;
    const ttlMs = 12 * 60 * 60 * 1000; // 12 hours cache
    const now = Date.now();
    nodes.forEach(el => {
      const user = el.getAttribute('data-github-user');
      if (!user) return;
      const key = `gh:${user}:public_repos`;
      const tsKey = `${key}:ts`;
      const cached = localStorage.getItem(key);
      const cachedTs = parseInt(localStorage.getItem(tsKey) || '0', 10);
      const numEl = el.querySelector('.stat__num');
      const update = (count) => { if (numEl) numEl.textContent = `${count}+`; };
      if (cached && (now - cachedTs) < ttlMs) {
        const count = parseInt(cached, 10);
        if (Number.isFinite(count)) update(count);
        return;
      }
      fetch(`https://api.github.com/users/${user}`)
        .then(res => res.ok ? res.json() : Promise.reject(res))
        .then(data => {
          const count = parseInt(data.public_repos, 10) || 0;
          update(count);
          localStorage.setItem(key, String(count));
          localStorage.setItem(tsKey, String(Date.now()));
        })
        .catch(() => {
          // Silently fail; keep existing number
        });
    });
  }

  // Init
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initReveal();
      setYear();
      initNavToggle();
      initSmoothScroll();
      initThemeToggle();
      initProjectAutoCategorize();
      initProjectFilters();
      initContactForm();
      initExperienceYears();
      initGitHubProjectCount();
    });
  } else {
    initReveal();
    setYear();
    initNavToggle();
    initSmoothScroll();
    initThemeToggle();
    initProjectAutoCategorize();
    initProjectFilters();
    initContactForm();
    initExperienceYears();
    initGitHubProjectCount();
  }
})();