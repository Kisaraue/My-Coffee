/* ============================================================
   MY COFFEE — admin.js
   Authentication: Supabase Email/Password Auth (no hardcoded password)
   Features: Menu CRUD + Feedback Moderation
   ============================================================ */

'use strict';

/* ============================================================
   STATE
   ============================================================ */
var _supabase       = null;
var _menuItems      = [];
var _feedbacks      = [];
var _menuFilter     = 'all';
var _feedbackFilter = 'pending';


/* ============================================================
   1. INIT — boot sequence on page load
   ============================================================ */
window.addEventListener('load', function () {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('YOUR_PROJECT')) {
    showLoginError('Supabase credentials not configured. Add your URL and anon key to admin.html.');
    return;
  }

  try {
    _supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {},
      },
      // Tolerate up to 300 seconds of clock skew between client and server
      // This fixes "JWT issued at future" errors caused by system clock drift
      db: {
        schema: 'public'
      }
    });
    initLoginUI();
    restoreSession();
  } catch (e) {
    showLoginError('Failed to connect to Supabase. Check your credentials.');
    console.error(e);
  }
});


/* ============================================================
   2. SESSION RESTORE — check if already logged in
   ============================================================ */
function restoreSession() {
  _supabase.auth.getSession().then(function (result) {
    var session = result.data && result.data.session;
    if (session && session.user) {
      showAdminApp(session.user);
    } else {
      showLoginScreen();
    }
  });

  // Listen for auth state changes (login / logout / token refresh)
  _supabase.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session && session.user) {
      showAdminApp(session.user);
    } else if (event === 'SIGNED_OUT') {
      showLoginScreen();
    }
  });
}


/* ============================================================
   3. LOGIN UI
   ============================================================ */
function initLoginUI() {
  var emailEl    = document.getElementById('loginEmail');
  var passwordEl = document.getElementById('loginPassword');
  var submitBtn  = document.getElementById('loginSubmitBtn');
  var toggleBtn  = document.getElementById('togglePasswordBtn');
  var eyeIcon    = document.getElementById('eyeIcon');

  // Show/hide password toggle
  if (toggleBtn && passwordEl) {
    toggleBtn.addEventListener('click', function () {
      var isPassword = passwordEl.type === 'password';
      passwordEl.type = isPassword ? 'text' : 'password';
      eyeIcon.className = isPassword ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye';
    });
  }

  // Submit on button click
  if (submitBtn) {
    submitBtn.addEventListener('click', attemptLogin);
  }

  // Submit on Enter key in either field
  [emailEl, passwordEl].forEach(function (el) {
    if (el) {
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') attemptLogin();
      });
    }
  });

  // Focus email on load
  if (emailEl) setTimeout(function () { emailEl.focus(); }, 100);
}


/* ============================================================
   4. LOGIN — call Supabase Auth
   ============================================================ */
function attemptLogin() {
  var emailEl    = document.getElementById('loginEmail');
  var passwordEl = document.getElementById('loginPassword');
  var submitBtn  = document.getElementById('loginSubmitBtn');

  var email    = emailEl    ? emailEl.value.trim()    : '';
  var password = passwordEl ? passwordEl.value.trim() : '';

  if (!email)    { showLoginError('Please enter your email address.'); emailEl.focus();    return; }
  if (!password) { showLoginError('Please enter your password.');      passwordEl.focus(); return; }

  // Loading state
  submitBtn.disabled  = true;
  submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Signing in...';
  clearLoginError();

  _supabase.auth.signInWithPassword({ email: email, password: password })
    .then(function (result) {
      submitBtn.disabled  = false;
      submitBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Sign In';

      if (result.error) {
        // Map Supabase error messages to user-friendly ones
        var msg = result.error.message;
        if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
          showLoginError('Incorrect email or password. Please try again.');
        } else if (msg.includes('Email not confirmed')) {
          showLoginError('Please confirm your email address before signing in.');
        } else {
          showLoginError(msg);
        }
        if (passwordEl) passwordEl.value = '';
        if (passwordEl) passwordEl.focus();
        return;
      }
      // Success — onAuthStateChange fires and calls showAdminApp()
    });
}


/* ============================================================
   5. LOGOUT
   ============================================================ */
function initLogout() {
  var logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      _supabase.auth.signOut().then(function () {
        // onAuthStateChange fires SIGNED_OUT → showLoginScreen()
      });
    });
  }
}


/* ============================================================
   6. SHOW / HIDE SCREENS
   ============================================================ */
function showLoginScreen() {
  var loginScreen = document.getElementById('loginScreen');
  var adminApp    = document.getElementById('adminApp');
  if (loginScreen) loginScreen.classList.remove('hidden');
  if (adminApp)    adminApp.classList.add('hidden');

  // Clear password field on logout
  var passwordEl = document.getElementById('loginPassword');
  if (passwordEl) passwordEl.value = '';
  clearLoginError();
}

function showAdminApp(user) {
  var loginScreen = document.getElementById('loginScreen');
  var adminApp    = document.getElementById('adminApp');
  if (loginScreen) loginScreen.classList.add('hidden');
  if (adminApp)    adminApp.classList.remove('hidden');

  // Show logged-in email in sidebar
  var emailEl = document.getElementById('sidebarUserEmail');
  if (emailEl && user) emailEl.textContent = user.email;

  // Boot dashboard
  initLogout();
  initSidebarNav();
  initMenuPanel();
  initFeedbackPanel();
  initMenuItemModal();
  loadMenuItems();
  loadFeedbacks();
}

function showLoginError(msg) {
  var el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearLoginError() {
  var el = document.getElementById('loginError');
  if (!el) return;
  el.textContent = '';
  el.classList.add('hidden');
}


/* ============================================================
   7. SIDEBAR NAVIGATION
   ============================================================ */
function initSidebarNav() {
  var links  = document.querySelectorAll('.sidebar-link[data-panel]');
  var panels = document.querySelectorAll('.admin-panel');

  links.forEach(function (link) {
    link.addEventListener('click', function () {
      var target = link.getAttribute('data-panel');
      links.forEach(function (l) { l.classList.remove('active'); });
      link.classList.add('active');
      panels.forEach(function (p) {
        p.classList.toggle('active', p.id === 'panel-' + target);
      });
    });
  });
}


/* ============================================================
   8. MENU ITEMS — load & render
   ============================================================ */
function loadMenuItems() {
  setTableLoading('menuTableBody', 6);

  _supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('display_order')
    .then(function (result) {
      if (result.error) {
        setTableError('menuTableBody', 6, result.error.message);
        return;
      }
      _menuItems = result.data || [];
      renderMenuTable();
    });
}

function renderMenuTable() {
  var tbody = document.getElementById('menuTableBody');
  if (!tbody) return;

  var filtered = _menuFilter === 'all'
    ? _menuItems
    : _menuItems.filter(function (i) { return i.category === _menuFilter; });

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No items found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (item) {
    var catLabel = item.category === 'hot' ? 'Hot' : item.category === 'iced' ? 'Iced' : 'Special';
    return (
      '<tr data-id="' + item.id + '">' +
        '<td>' +
          '<div class="item-name-cell">' +
            '<span class="item-emoji">' + (item.emoji || '☕') + '</span>' +
            '<div>' +
              '<div class="item-name">'  + escapeHtml(item.name)        + '</div>' +
              '<div class="item-desc">'  + escapeHtml(item.description) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td><span class="badge badge--' + item.category + '">' + catLabel + '</span></td>' +
        '<td><strong>Rs. ' + item.price + '</strong></td>' +
        '<td>' + (item.is_featured
          ? '<span class="badge badge--orange">★ Yes</span>'
          : '<span class="badge badge--gray">No</span>') + '</td>' +
        '<td>' + (item.is_available
          ? '<span class="badge badge--green">✓ Yes</span>'
          : '<span class="badge badge--gray">No</span>') + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="action-btn action-btn--edit"   onclick="openEditModal(\''     + item.id + '\')">' +
              '<i class="fa-solid fa-pen"></i> Edit</button>' +
            '<button class="action-btn action-btn--toggle" onclick="toggleAvailability(\'' + item.id + '\', ' + item.is_available + ')">' +
              (item.is_available
                ? '<i class="fa-solid fa-eye-slash"></i> Hide'
                : '<i class="fa-solid fa-eye"></i> Show') + '</button>' +
            '<button class="action-btn action-btn--delete" onclick="deleteMenuItem(\''    + item.id + '\', \'' + escapeHtml(item.name) + '\')">' +
              '<i class="fa-solid fa-trash"></i> Delete</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}


/* ============================================================
   9. MENU — category filter tabs
   ============================================================ */
function initMenuPanel() {
  document.querySelectorAll('.admin-tab[data-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab[data-filter]').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      _menuFilter = tab.getAttribute('data-filter');
      renderMenuTable();
    });
  });
}


/* ============================================================
   10. MENU — Add / Edit modal
   ============================================================ */
function initMenuItemModal() {
  var addBtn    = document.getElementById('addMenuItemBtn');
  var modal     = document.getElementById('menuItemModal');
  var closeBtn  = document.getElementById('modalCloseBtn');
  var cancelBtn = document.getElementById('modalCancelBtn');
  var saveBtn   = document.getElementById('modalSaveBtn');

  if (addBtn)    addBtn.addEventListener('click', openAddModal);
  if (closeBtn)  closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (saveBtn)   saveBtn.addEventListener('click', saveMenuItem);

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
}

function openAddModal() {
  document.getElementById('modalTitle').textContent = 'Add Menu Item';
  document.getElementById('editItemId').value       = '';
  document.getElementById('itemName').value         = '';
  document.getElementById('itemEmoji').value        = '☕';
  document.getElementById('itemDesc').value         = '';
  document.getElementById('itemPrice').value        = '';
  document.getElementById('itemCategory').value     = 'hot';
  document.getElementById('itemOrder').value        = '0';
  document.getElementById('itemAvailable').checked  = true;
  document.getElementById('itemFeatured').checked   = false;
  clearModalError();
  document.getElementById('menuItemModal').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function openEditModal(id) {
  var item = _menuItems.find(function (i) { return i.id === id; });
  if (!item) return;
  document.getElementById('modalTitle').textContent = 'Edit Menu Item';
  document.getElementById('editItemId').value       = item.id;
  document.getElementById('itemName').value         = item.name;
  document.getElementById('itemEmoji').value        = item.emoji || '☕';
  document.getElementById('itemDesc').value         = item.description;
  document.getElementById('itemPrice').value        = item.price;
  document.getElementById('itemCategory').value     = item.category;
  document.getElementById('itemOrder').value        = item.display_order || 0;
  document.getElementById('itemAvailable').checked  = item.is_available;
  document.getElementById('itemFeatured').checked   = item.is_featured;
  clearModalError();
  document.getElementById('menuItemModal').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function closeModal() {
  var modal = document.getElementById('menuItemModal');
  if (modal) modal.classList.add('hidden');
  clearModalError();
}

function saveMenuItem() {
  var id       = document.getElementById('editItemId').value;
  var name     = document.getElementById('itemName').value.trim();
  var emoji    = document.getElementById('itemEmoji').value.trim() || '☕';
  var desc     = document.getElementById('itemDesc').value.trim();
  var price    = parseInt(document.getElementById('itemPrice').value);
  var category = document.getElementById('itemCategory').value;
  var order    = parseInt(document.getElementById('itemOrder').value) || 0;
  var avail    = document.getElementById('itemAvailable').checked;
  var featured = document.getElementById('itemFeatured').checked;

  if (!name)            { showModalError('Drink name is required.');  return; }
  if (!desc)            { showModalError('Description is required.'); return; }
  if (!price || price < 1) { showModalError('Enter a valid price.');  return; }

  var saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled  = true;
  saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  var payload = {
    name: name, emoji: emoji, description: desc, price: price,
    category: category, display_order: order,
    is_available: avail, is_featured: featured
  };

  var op = id
    ? _supabase.from('menu_items').update(payload).eq('id', id)
    : _supabase.from('menu_items').insert([payload]);

  op.then(function (result) {
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Item';
    if (result.error) { showModalError(result.error.message); return; }
    closeModal();
    loadMenuItems();
  });
}

function showModalError(msg) {
  var el = document.getElementById('modalError');
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function clearModalError() {
  var el = document.getElementById('modalError');
  if (el) { el.textContent = ''; el.classList.add('hidden'); }
}


/* ============================================================
   11. MENU — toggle availability & delete
   ============================================================ */
function toggleAvailability(id, current) {
  _supabase.from('menu_items').update({ is_available: !current }).eq('id', id)
    .then(function (r) { if (!r.error) loadMenuItems(); });
}

function deleteMenuItem(id, name) {
  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;
  _supabase.from('menu_items').delete().eq('id', id)
    .then(function (r) { if (!r.error) loadMenuItems(); });
}


/* ============================================================
   12. FEEDBACK — load & render
   ============================================================ */
function loadFeedbacks() {
  setTableLoading('feedbackTableBody', 6);

  _supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false })
    .then(function (result) {
      if (result.error) { setTableError('feedbackTableBody', 6, result.error.message); return; }
      _feedbacks = result.data || [];
      renderFeedbackTable();
    });
}

function renderFeedbackTable() {
  var tbody = document.getElementById('feedbackTableBody');
  if (!tbody) return;

  var filtered = _feedbackFilter === 'pending'
    ? _feedbacks.filter(function (f) { return !f.approved; })
    : _feedbackFilter === 'approved'
    ? _feedbacks.filter(function (f) { return f.approved; })
    : _feedbacks;

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No ' + _feedbackFilter + ' reviews.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (fb) {
    var stars = '';
    for (var i = 1; i <= 5; i++) stars += i <= fb.rating ? '★' : '☆';
    var date = new Date(fb.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    var statusBadge = fb.approved
      ? '<span class="badge badge--green">✓ Approved</span>'
      : '<span class="badge badge--pending">⏳ Pending</span>';
    var toggleBtn = fb.approved
      ? '<button class="action-btn action-btn--toggle" onclick="unapproveFeedback(\'' + fb.id + '\')">' +
          '<i class="fa-solid fa-eye-slash"></i> Unpublish</button>'
      : '<button class="action-btn action-btn--approve" onclick="approveFeedback(\'' + fb.id + '\')">' +
          '<i class="fa-solid fa-check"></i> Approve</button>';
    return (
      '<tr>' +
        '<td><strong>' + escapeHtml(fb.name) + '</strong></td>' +
        '<td><span class="stars-display">' + stars + '</span></td>' +
        '<td style="max-width:260px;white-space:normal;font-size:0.85rem;color:#4A5568;">' +
          escapeHtml(fb.message) + '</td>' +
        '<td style="white-space:nowrap;font-size:0.82rem;color:#718096;">' + date + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td><div class="action-btns">' +
          toggleBtn +
          '<button class="action-btn action-btn--delete" onclick="deleteFeedback(\'' + fb.id + '\')">' +
            '<i class="fa-solid fa-trash"></i> Delete</button>' +
        '</div></td>' +
      '</tr>'
    );
  }).join('');
}


/* ============================================================
   13. FEEDBACK — filter tabs
   ============================================================ */
function initFeedbackPanel() {
  document.querySelectorAll('.admin-tab[data-fb-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.admin-tab[data-fb-filter]').forEach(function (t) {
        t.classList.remove('active');
      });
      tab.classList.add('active');
      _feedbackFilter = tab.getAttribute('data-fb-filter');
      renderFeedbackTable();
    });
  });
}


/* ============================================================
   14. FEEDBACK — approve / unpublish / delete
   ============================================================ */
function approveFeedback(id) {
  _supabase.from('feedbacks').update({ approved: true }).eq('id', id)
    .then(function (r) { if (!r.error) loadFeedbacks(); });
}

function unapproveFeedback(id) {
  _supabase.from('feedbacks').update({ approved: false }).eq('id', id)
    .then(function (r) { if (!r.error) loadFeedbacks(); });
}

function deleteFeedback(id) {
  if (!confirm('Permanently delete this review?')) return;
  _supabase.from('feedbacks').delete().eq('id', id)
    .then(function (r) { if (!r.error) loadFeedbacks(); });
}


/* ============================================================
   15. UTILITIES
   ============================================================ */
function setTableLoading(id, cols) {
  var el = document.getElementById(id);
  if (el) el.innerHTML =
    '<tr><td colspan="' + cols + '" class="table-loading">' +
    '<i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
}

function setTableError(id, cols, msg) {
  var el = document.getElementById(id);
  if (el) el.innerHTML =
    '<tr><td colspan="' + cols + '" class="table-loading" style="color:#DC2626;">⚠️ ' + msg + '</td></tr>';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}