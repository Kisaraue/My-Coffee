/* ============================================================
   MY COFFEE — main.js
   Brand: My Coffee (mycoffeelk) | Sri Lanka
   Handles: Sticky nav, hamburger, menu tabs, scroll animations
   ============================================================ */

'use strict';

/* ============================================================
   1. STICKY NAVIGATION — background on scroll
   ============================================================ */
(function initStickyNav() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  function handleScroll() {
    if (window.scrollY > 60) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  // Run once on load in case page is already scrolled
  handleScroll();
  window.addEventListener('scroll', handleScroll, { passive: true });
})();


/* ============================================================
   2. HAMBURGER MENU — mobile toggle
   ============================================================ */
(function initHamburger() {
  const hamburger  = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');
  const mobileLinks = document.querySelectorAll('.mobile-link');

  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('open');
    mobileMenu.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden'; // prevent scroll behind menu
  }

  function closeMenu() {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', function () {
    const isOpen = mobileMenu.classList.contains('open');
    isOpen ? closeMenu() : openMenu();
  });

  // Close menu when any mobile link is clicked
  mobileLinks.forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close menu on outside click
  document.addEventListener('click', function (e) {
    if (
      mobileMenu.classList.contains('open') &&
      !mobileMenu.contains(e.target) &&
      !hamburger.contains(e.target)
    ) {
      closeMenu();
    }
  });

  // Close on ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
      closeMenu();
      hamburger.focus();
    }
  });
})();


/* ============================================================
   3. MENU TAB SWITCHER
   ============================================================ */
(function initMenuTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanels  = document.querySelectorAll('.menu-tab-content');

  if (!tabButtons.length) return;

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetTab = btn.getAttribute('data-tab');

      // Update button states
      tabButtons.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Show the matching panel
      tabPanels.forEach(function (panel) {
        if (panel.id === 'tab-' + targetTab) {
          panel.classList.add('active');

          // Re-trigger scroll animations for newly visible cards
          const cards = panel.querySelectorAll('.animate-on-scroll');
          cards.forEach(function (card, i) {
            card.classList.remove('visible');
            setTimeout(function () {
              card.classList.add('visible');
            }, i * 80);
          });
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
})();


/* ============================================================
   4. INTERSECTION OBSERVER — section entrance animations
   ============================================================ */
(function initScrollAnimations() {
  const animatables = document.querySelectorAll('.animate-on-scroll');
  if (!animatables.length) return;

  // Stagger delay for sibling elements in the same parent grid/flex
  function getStaggerDelay(el) {
    const parent = el.parentElement;
    if (!parent) return 0;
    const siblings = Array.from(parent.querySelectorAll('.animate-on-scroll'));
    const idx = siblings.indexOf(el);
    return idx * 80; // 80ms per item
  }

  const observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = getStaggerDelay(el);

          setTimeout(function () {
            el.classList.add('visible');
          }, delay);

          // Stop observing once animated in
          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    }
  );

  animatables.forEach(function (el) {
    observer.observe(el);
  });
})();


/* ============================================================
   5. SMOOTH SCROLL — nav link active state on scroll
   ============================================================ */
(function initActiveNavHighlight() {
  const navLinks   = document.querySelectorAll('.nav-link');
  const sections   = document.querySelectorAll('section[id]');

  if (!navLinks.length || !sections.length) return;

  function onScroll() {
    let currentId = '';
    const scrollY = window.scrollY + 100;

    sections.forEach(function (section) {
      if (scrollY >= section.offsetTop) {
        currentId = section.id;
      }
    });

    navLinks.forEach(function (link) {
      link.classList.remove('active-link');
      const href = link.getAttribute('href');
      if (href === '#' + currentId) {
        link.classList.add('active-link');
      }
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();


/* ============================================================
   6. UTILITY — pre-trigger visible for items in initial viewport
   ============================================================ */
(function triggerInitialViewport() {
  // After a short delay, fire IntersectionObserver for elements
  // already in view when the page loads (above the fold)
  window.addEventListener('load', function () {
    setTimeout(function () {
      const animatables = document.querySelectorAll('.animate-on-scroll:not(.visible)');
      animatables.forEach(function (el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          el.classList.add('visible');
        }
      });
    }, 300);
  });
})();


/* ============================================================
   7. NAV ACTIVE LINK STYLE — inject CSS rule dynamically
   ============================================================ */
(function injectActiveNavStyle() {
  const style = document.createElement('style');
  style.textContent = `
    .nav-link.active-link {
      color: var(--orange) !important;
    }
    .navbar.scrolled .nav-link.active-link {
      color: var(--orange) !important;
    }
  `;
  document.head.appendChild(style);
})();


/* ============================================================
   8. WHATSAPP FLOAT — re-trigger bounce on revisit
   ============================================================ */
(function initWAFloat() {
  const waBtn = document.querySelector('.whatsapp-float');
  if (!waBtn) return;

  // After the initial bounce, add a subtle pulse on idle
  setTimeout(function () {
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
      @keyframes waPulse {
        0%, 100% { box-shadow: 0 6px 24px rgba(37,211,102,0.45); }
        50%       { box-shadow: 0 6px 36px rgba(37,211,102,0.70), 0 0 0 8px rgba(37,211,102,0.12); }
      }
      .whatsapp-float {
        animation: waPulse 3s ease-in-out infinite !important;
      }
      .whatsapp-float:hover {
        animation: none !important;
      }
    `;
    document.head.appendChild(pulseStyle);
  }, 3500); // Start pulse after initial bounce finishes
})();
