/* ============================================================
   MY COFFEE — main.js
   Brand: My Coffee (mycoffeelk) | Sri Lanka
   Handles: Sticky nav, hamburger, menu tabs, scroll animations,
            dark/light theme toggle
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


/* ============================================================
   9. DARK / LIGHT THEME TOGGLE
      - Reads saved preference from localStorage
      - Falls back to system prefers-color-scheme on first visit
      - Toggles data-theme="dark" on <html>
      - Saves preference on every toggle
   ============================================================ */
(function initThemeToggle() {
  const html        = document.documentElement;
  const toggleBtn   = document.getElementById('themeToggle');
  const STORAGE_KEY = 'mycoffee-theme';
  const DARK        = 'dark';
  const LIGHT       = 'light';

  /* ----------------------------------------------------------
     Determine initial theme:
     1. Saved user preference in localStorage
     2. System prefers-color-scheme
     3. Default: light
  ---------------------------------------------------------- */
  function getInitialTheme() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === DARK || saved === LIGHT) return saved;

    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return DARK;
    }
    return LIGHT;
  }

  /* ----------------------------------------------------------
     Apply a theme to <html> and update button aria-label
  ---------------------------------------------------------- */
  function applyTheme(theme) {
    if (theme === DARK) {
      html.setAttribute('data-theme', DARK);
      if (toggleBtn) toggleBtn.setAttribute('aria-label', 'Switch to light mode');
    } else {
      html.removeAttribute('data-theme');
      if (toggleBtn) toggleBtn.setAttribute('aria-label', 'Switch to dark mode');
    }
  }

  /* ----------------------------------------------------------
     Toggle between dark and light, save to localStorage
  ---------------------------------------------------------- */
  function toggleTheme() {
    const current = html.getAttribute('data-theme') === DARK ? DARK : LIGHT;
    const next    = current === DARK ? LIGHT : DARK;

    applyTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  // Apply on page load immediately (before render to avoid flash)
  applyTheme(getInitialTheme());

  // Wire up the toggle button
  if (toggleBtn) {
    toggleBtn.addEventListener('click', toggleTheme);
  }

  /* ----------------------------------------------------------
     Optional: respond to system theme changes in real-time
     (only if user hasn't set a manual preference)
  ---------------------------------------------------------- */
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      const savedPref = localStorage.getItem(STORAGE_KEY);
      if (!savedPref) {
        // No manual preference saved — follow the system
        applyTheme(e.matches ? DARK : LIGHT);
      }
    });
  }
})();

/* ============================================================
   10. SUPABASE CLIENT INIT
   Runs after DOM + all scripts are fully loaded
   ============================================================ */
window.addEventListener('load', function () {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('YOUR_PROJECT')) {
    console.warn('My Coffee: Supabase credentials not set.');
    showMenuFallback();
    return;
  }

  if (typeof supabase === 'undefined') {
    console.error('My Coffee: Supabase CDN script did not load.');
    showMenuFallback();
    return;
  }

  try {
    window._supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON);
    console.log('My Coffee: Supabase client ready.');
    loadMenuFromSupabase();
    loadFeedbackReviews();
  } catch (e) {
    console.error('My Coffee: Supabase init failed:', e);
    showMenuFallback();
  }
});

function showMenuFallback() {
  ['hot', 'iced', 'specials'].forEach(function (cat) {
    var grid = document.getElementById('menu-grid-' + cat);
    if (grid) grid.innerHTML = '<div class="menu-error">⚠️ Could not connect to database. Please check configuration.</div>';
  });
  var list = document.getElementById('feedbackReviewsList');
  if (list) list.innerHTML = '<div class="feedback-reviews-empty">Could not load reviews.</div>';
}


/* ============================================================
   11. DYNAMIC MENU — load from Supabase menu_items table
   ============================================================ */
function loadMenuFromSupabase() {
  var client = window._supabase;
  if (!client) return;

  var grids = {
    hot:      document.getElementById('menu-grid-hot'),
    iced:     document.getElementById('menu-grid-iced'),
    specials: document.getElementById('menu-grid-specials')
  };

  console.log('My Coffee: Fetching menu items...');

  client
    .from('menu_items')
    .select('*')
    .order('display_order', { ascending: true })
    .then(function (result) {
      var data  = result.data;
      var error = result.error;

      console.log('My Coffee menu result:', { data: data, error: error });

      if (error) {
        console.error('My Coffee menu error:', error.message, error.details, error.hint);
        ['hot', 'iced', 'specials'].forEach(function (cat) {
          if (grids[cat]) grids[cat].innerHTML =
            '<div class="menu-error">⚠️ ' + error.message + '</div>';
        });
        return;
      }

      if (!data || data.length === 0) {
        console.warn('My Coffee: menu_items table returned 0 rows. Check that the SQL seed ran and RLS allows SELECT.');
        ['hot', 'iced', 'specials'].forEach(function (cat) {
          if (grids[cat]) grids[cat].innerHTML =
            '<div class="menu-empty">No menu items found. Run supabase_setup.sql to seed data.</div>';
        });
        return;
      }

      console.log('My Coffee: Loaded ' + data.length + ' menu items.');

      // Filter to available only (client-side so we can debug count above)
      var available = data.filter(function (item) { return item.is_available !== false; });

      // Group by category
      var grouped = { hot: [], iced: [], specials: [] };
      available.forEach(function (item) {
        if (grouped[item.category]) grouped[item.category].push(item);
      });

      // Render each category
      ['hot', 'iced', 'specials'].forEach(function (cat) {
        var grid  = grids[cat];
        if (!grid) return;
        var items = grouped[cat];

        if (!items.length) {
          grid.innerHTML = '<div class="menu-empty">No items in this category yet.</div>';
          return;
        }

        grid.innerHTML = items.map(function (item) {
          var featuredClass = item.is_featured ? ' menu-card--featured' : '';
          var ribbon        = item.is_featured ? '<div class="menu-ribbon">Today\'s Special</div>' : '';
          return (
            '<div class="menu-card' + featuredClass + ' animate-on-scroll visible">' +
              ribbon +
              '<div class="menu-card-icon">' + (item.emoji || '☕') + '</div>' +
              '<div class="menu-card-body">' +
                '<h3 class="menu-card-name">' + escapeHtml(item.name) + '</h3>' +
                '<p class="menu-card-desc">' + escapeHtml(item.description) + '</p>' +
                '<span class="menu-card-price">Rs. ' + item.price + '</span>' +
              '</div>' +
            '</div>'
          );
        }).join('');
      });
    })
    .catch(function (err) {
      console.error('My Coffee: Unexpected menu fetch error:', err);
    });
}


/* ============================================================
   12. FEEDBACK — load approved reviews
   ============================================================ */
function loadFeedbackReviews() {
  var client = window._supabase;
  var list   = document.getElementById('feedbackReviewsList');
  if (!client || !list) return;

  console.log('My Coffee: Fetching approved reviews...');

  client
    .from('feedbacks')
    .select('*')
    .eq('approved', true)
    .order('created_at', { ascending: false })
    .limit(20)
    .then(function (result) {
      var data  = result.data;
      var error = result.error;

      console.log('My Coffee feedback result:', { data: data, error: error });

      if (error) {
        console.error('My Coffee feedback error:', error.message, error.hint);
        list.innerHTML = '<div class="feedback-reviews-empty">Unable to load reviews: ' + error.message + '</div>';
        return;
      }

      if (!data || !data.length) {
        list.innerHTML = '<div class="feedback-reviews-empty">No reviews yet — be the first! ☕</div>';
        return;
      }

      list.innerHTML = data.map(function (review) {
        var stars = '';
        for (var i = 1; i <= 5; i++) {
          stars += i <= review.rating ? '★' : '☆';
        }
        var date = new Date(review.created_at).toLocaleDateString('en-US', {
          year: 'numeric', month: 'short', day: 'numeric'
        });
        return (
          '<div class="review-card">' +
            '<div class="review-card-header">' +
              '<span class="review-card-name">' + escapeHtml(review.name) + '</span>' +
              '<span class="review-card-stars">' + stars + '</span>' +
            '</div>' +
            '<p class="review-card-message">' + escapeHtml(review.message) + '</p>' +
            '<span class="review-card-date">' + date + '</span>' +
          '</div>'
        );
      }).join('');
    });
}


/* ============================================================
   13. FEEDBACK — submit new review
   Runs after DOM is ready so star elements exist
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {

  var starEls       = document.querySelectorAll('.star');
  var ratingInput   = document.getElementById('ratingValue');
  var nameInput     = document.getElementById('feedbackName');
  var msgInput      = document.getElementById('feedbackMessage');
  var submitBtn     = document.getElementById('feedbackSubmitBtn');
  var statusEl      = document.getElementById('feedbackStatus');
  var selectedRating = 0;

  if (!starEls.length) return; // feedback section not on this page

  /* ------ Star hover & click -------------------------------- */
  starEls.forEach(function (star) {

    star.addEventListener('mouseover', function () {
      highlightStars(parseInt(star.getAttribute('data-value')));
    });

    star.addEventListener('mouseout', function () {
      highlightStars(selectedRating); // revert to selected
    });

    star.addEventListener('click', function () {
      selectedRating = parseInt(star.getAttribute('data-value'));
      if (ratingInput) ratingInput.value = selectedRating;
      highlightStars(selectedRating);
    });

    // Keyboard support
    star.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectedRating = parseInt(star.getAttribute('data-value'));
        if (ratingInput) ratingInput.value = selectedRating;
        highlightStars(selectedRating);
      }
    });
  });

  function highlightStars(count) {
    starEls.forEach(function (s) {
      var val = parseInt(s.getAttribute('data-value'));
      if (val <= count) {
        s.classList.add('selected');
      } else {
        s.classList.remove('selected');
      }
    });
  }

  /* ------ Form submit --------------------------------------- */
  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      var client = window._supabase;

      if (!client) {
        setStatus('Database not connected. Check your Supabase credentials.', 'error');
        return;
      }

      var name    = nameInput ? nameInput.value.trim()  : '';
      var message = msgInput  ? msgInput.value.trim()   : '';
      var rating  = selectedRating;

      // Validation
      if (!name)           { setStatus('Please enter your name.', 'error');           nameInput.focus(); return; }
      if (!rating)         { setStatus('Please select a star rating.', 'error');      return; }
      if (!message)        { setStatus('Please write a review message.', 'error');    msgInput.focus();  return; }
      if (message.length < 10) { setStatus('Review too short (min 10 characters).', 'error'); return; }

      submitBtn.disabled  = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      setStatus('', '');

      client
        .from('feedbacks')
        .insert([{ name: name, rating: rating, message: message, approved: false }])
        .then(function (result) {
          submitBtn.disabled  = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Review';

          if (result.error) {
            console.error('Feedback submit error:', result.error);
            setStatus('Something went wrong. Please try again.', 'error');
            return;
          }

          // Success — reset form
          setStatus('✅ Thank you! Your review is pending approval.', 'success');
          nameInput.value = '';
          msgInput.value  = '';
          selectedRating  = 0;
          if (ratingInput) ratingInput.value = 0;
          highlightStars(0);
        });
    });
  }

  function setStatus(msg, type) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.className   = 'feedback-status' + (type ? ' ' + type : '');
  }

}); // end DOMContentLoaded


/* ============================================================
   14. UTILITY — HTML escape for user content
   ============================================================ */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}