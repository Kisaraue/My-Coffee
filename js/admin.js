/* ============================================================
   MY COFFEE — admin.js
   Admin Dashboard: Menu CRUD + Feedback Moderation
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
   1. LOGIN GATE
   ============================================================ */
(function initLogin() {
  var loginScreen = document.getElementById('loginScreen');
  var adminApp    = document.getElementById('adminApp');
  var passwordEl  = document.getElementById('loginPassword');
  var submitBtn   = document.getElementById('loginSubmitBtn');
  var errorEl     = document.getElementById('loginError');
  var logoutBtn   = document.getElementById('logoutBtn');

  // Check if already logged in this session
  if (sessionStorage.getItem('mc_admin') === 'true') {
    showApp();
  }

  function attemptLogin() {
    var entered = passwordEl ? passwordEl.value : '';
    if (entered === window.ADMIN_PASSWORD) {
      sessionStorage.setItem('mc_admin', 'true');
      errorEl.textContent = '';
      showApp();
    } else {
      errorEl.textContent = 'Incorrect password. Please try again.';
      if (passwordEl) passwordEl.value = '';
      passwordEl.focus();
    }
  }

  function showApp() {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (adminApp)    adminApp.classList.remove('hidden');
    initSupabase();
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', attemptLogin);
  }

  if (passwordEl) {
    passwordEl.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') attemptLogin();
    });
    // Focus on load
    setTimeout(function () { passwordEl.focus(); }, 100);
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      sessionStorage.removeItem('mc_admin');
      if (adminApp)    adminApp.classList.add('hidden');
      if (loginScreen) loginScreen.classList.remove('hidden');
      if (passwordEl)  { passwordEl.value = ''; passwordEl.focus(); }
    });
  }
})();


/* ============================================================
   2. SUPABASE INIT
   ============================================================ */
function initSupabase() {
  if (!window.SUPABASE_URL || window.SUPABASE_URL.includes('YOUR_PROJECT')) {
    alert('⚠️  Add your Supabase URL and anon key to admin.html before using the dashboard.');
    return;
  }
  try {
    _supabase = supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON);
    initSidebarNav();
    initMenuPanel();
    initFeedbackPanel();
    loadMenuItems();
    loadFeedbacks();
  } catch (e) {
    console.error('Supabase init error:', e);
    alert('Failed to connect to Supabase. Check credentials.');
  }
}


/* ============================================================
   3. SIDEBAR NAVIGATION
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
   4. MENU ITEMS — load & render
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
        setTableError('menuTableBody', 6, 'Failed to load menu items.');
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
    var catBadge = '<span class="badge badge--' + item.category + '">' +
      (item.category === 'hot' ? 'Hot' : item.category === 'iced' ? 'Iced' : 'Special') +
      '</span>';

    var featuredBadge = item.is_featured
      ? '<span class="badge badge--orange">★ Yes</span>'
      : '<span class="badge badge--gray">No</span>';

    var availBadge = item.is_available
      ? '<span class="badge badge--green">✓ Yes</span>'
      : '<span class="badge badge--gray">No</span>';

    return (
      '<tr data-id="' + item.id + '">' +
        '<td>' +
          '<div class="item-name-cell">' +
            '<span class="item-emoji">' + (item.emoji || '☕') + '</span>' +
            '<div>' +
              '<div class="item-name">' + escapeHtml(item.name) + '</div>' +
              '<div class="item-desc">' + escapeHtml(item.description) + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td>' + catBadge + '</td>' +
        '<td><strong>Rs. ' + item.price + '</strong></td>' +
        '<td>' + featuredBadge + '</td>' +
        '<td>' + availBadge + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="action-btn action-btn--edit" onclick="openEditModal(\'' + item.id + '\')">' +
              '<i class="fa-solid fa-pen"></i> Edit' +
            '</button>' +
            '<button class="action-btn action-btn--toggle" onclick="toggleAvailability(\'' + item.id + '\', ' + item.is_available + ')">' +
              (item.is_available
                ? '<i class="fa-solid fa-eye-slash"></i> Hide'
                : '<i class="fa-solid fa-eye"></i> Show') +
            '</button>' +
            '<button class="action-btn action-btn--delete" onclick="deleteMenuItem(\'' + item.id + '\', \'' + escapeHtml(item.name) + '\')">' +
              '<i class="fa-solid fa-trash"></i> Delete' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}


/* ============================================================
   5. MENU ITEMS — category filter tabs
   ============================================================ */
function initMenuPanel() {
  var tabs = document.querySelectorAll('.admin-tab[data-filter]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      _menuFilter = tab.getAttribute('data-filter');
      renderMenuTable();
    });
  });
}


/* ============================================================
   6. MENU ITEMS — Add / Edit modal
   ============================================================ */
function initMenuItemModal() {
  var addBtn     = document.getElementById('addMenuItemBtn');
  var modal      = document.getElementById('menuItemModal');
  var closeBtn   = document.getElementById('modalCloseBtn');
  var cancelBtn  = document.getElementById('modalCancelBtn');
  var saveBtn    = document.getElementById('modalSaveBtn');

  if (addBtn) {
    addBtn.addEventListener('click', function () { openAddModal(); });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (modal) {
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });
  }

  if (saveBtn) {
    saveBtn.addEventListener('click', saveMenuItem);
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
}

function openAddModal() {
  document.getElementById('modalTitle').textContent  = 'Add Menu Item';
  document.getElementById('editItemId').value        = '';
  document.getElementById('itemName').value          = '';
  document.getElementById('itemEmoji').value         = '☕';
  document.getElementById('itemDesc').value          = '';
  document.getElementById('itemPrice').value         = '';
  document.getElementById('itemCategory').value      = 'hot';
  document.getElementById('itemOrder').value         = '0';
  document.getElementById('itemAvailable').checked   = true;
  document.getElementById('itemFeatured').checked    = false;
  clearModalError();
  document.getElementById('menuItemModal').classList.remove('hidden');
  document.getElementById('itemName').focus();
}

function openEditModal(id) {
  var item = _menuItems.find(function (i) { return i.id === id; });
  if (!item) return;

  document.getElementById('modalTitle').textContent  = 'Edit Menu Item';
  document.getElementById('editItemId').value        = item.id;
  document.getElementById('itemName').value          = item.name;
  document.getElementById('itemEmoji').value         = item.emoji || '☕';
  document.getElementById('itemDesc').value          = item.description;
  document.getElementById('itemPrice').value         = item.price;
  document.getElementById('itemCategory').value      = item.category;
  document.getElementById('itemOrder').value         = item.display_order || 0;
  document.getElementById('itemAvailable').checked   = item.is_available;
  document.getElementById('itemFeatured').checked    = item.is_featured;
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

  // Validation
  if (!name)           { showModalError('Drink name is required.'); return; }
  if (!desc)           { showModalError('Description is required.'); return; }
  if (!price || price < 1) { showModalError('Enter a valid price.'); return; }
  if (!category)       { showModalError('Select a category.'); return; }

  var saveBtn = document.getElementById('modalSaveBtn');
  saveBtn.disabled    = true;
  saveBtn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

  var payload = {
    name:          name,
    emoji:         emoji,
    description:   desc,
    price:         price,
    category:      category,
    display_order: order,
    is_available:  avail,
    is_featured:   featured
  };

  var operation;
  if (id) {
    // Update existing
    operation = _supabase.from('menu_items').update(payload).eq('id', id);
  } else {
    // Insert new
    operation = _supabase.from('menu_items').insert([payload]);
  }

  operation.then(function (result) {
    saveBtn.disabled  = false;
    saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Item';

    if (result.error) {
      showModalError('Save failed: ' + result.error.message);
      return;
    }

    closeModal();
    loadMenuItems(); // Refresh table
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
   7. MENU ITEMS — toggle availability
   ============================================================ */
function toggleAvailability(id, currentValue) {
  _supabase
    .from('menu_items')
    .update({ is_available: !currentValue })
    .eq('id', id)
    .then(function (result) {
      if (result.error) { alert('Failed to update item.'); return; }
      loadMenuItems();
    });
}


/* ============================================================
   8. MENU ITEMS — delete
   ============================================================ */
function deleteMenuItem(id, name) {
  if (!confirm('Delete "' + name + '"? This cannot be undone.')) return;

  _supabase
    .from('menu_items')
    .delete()
    .eq('id', id)
    .then(function (result) {
      if (result.error) { alert('Failed to delete item.'); return; }
      loadMenuItems();
    });
}


/* ============================================================
   9. FEEDBACK — load & render
   ============================================================ */
function loadFeedbacks() {
  setTableLoading('feedbackTableBody', 6);

  _supabase
    .from('feedbacks')
    .select('*')
    .order('created_at', { ascending: false })
    .then(function (result) {
      if (result.error) {
        setTableError('feedbackTableBody', 6, 'Failed to load feedback.');
        return;
      }
      _feedbacks = result.data || [];
      renderFeedbackTable();
    });
}

function renderFeedbackTable() {
  var tbody = document.getElementById('feedbackTableBody');
  if (!tbody) return;

  var filtered;
  if (_feedbackFilter === 'pending') {
    filtered = _feedbacks.filter(function (f) { return !f.approved; });
  } else if (_feedbackFilter === 'approved') {
    filtered = _feedbacks.filter(function (f) { return f.approved; });
  } else {
    filtered = _feedbacks;
  }

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="table-loading">No ' + _feedbackFilter + ' reviews found.</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function (fb) {
    var stars = '';
    for (var i = 1; i <= 5; i++) {
      stars += i <= fb.rating ? '★' : '☆';
    }

    var date = new Date(fb.created_at).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric'
    });

    var statusBadge = fb.approved
      ? '<span class="badge badge--green">✓ Approved</span>'
      : '<span class="badge badge--pending">⏳ Pending</span>';

    var approveBtn = !fb.approved
      ? '<button class="action-btn action-btn--approve" onclick="approveFeedback(\'' + fb.id + '\')">' +
          '<i class="fa-solid fa-check"></i> Approve' +
        '</button>'
      : '<button class="action-btn action-btn--toggle" onclick="unapproveFeedback(\'' + fb.id + '\')">' +
          '<i class="fa-solid fa-eye-slash"></i> Unpublish' +
        '</button>';

    return (
      '<tr>' +
        '<td><strong>' + escapeHtml(fb.name) + '</strong></td>' +
        '<td><span class="stars-display">' + stars + '</span></td>' +
        '<td style="max-width:260px;white-space:normal;font-size:0.85rem;color:#4A5568;">' +
          escapeHtml(fb.message) +
        '</td>' +
        '<td style="white-space:nowrap;font-size:0.82rem;color:#718096;">' + date + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            approveBtn +
            '<button class="action-btn action-btn--delete" onclick="deleteFeedback(\'' + fb.id + '\')">' +
              '<i class="fa-solid fa-trash"></i> Delete' +
            '</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');
}


/* ============================================================
   10. FEEDBACK — filter tabs
   ============================================================ */
function initFeedbackPanel() {
  var tabs = document.querySelectorAll('.admin-tab[data-fb-filter]');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (t) { t.classList.remove('active'); });
      tab.classList.add('active');
      _feedbackFilter = tab.getAttribute('data-fb-filter');
      renderFeedbackTable();
    });
  });
}


/* ============================================================
   11. FEEDBACK — approve / unpublish / delete
   ============================================================ */
function approveFeedback(id) {
  _supabase
    .from('feedbacks')
    .update({ approved: true })
    .eq('id', id)
    .then(function (result) {
      if (result.error) { alert('Failed to approve review.'); return; }
      loadFeedbacks();
    });
}

function unapproveFeedback(id) {
  _supabase
    .from('feedbacks')
    .update({ approved: false })
    .eq('id', id)
    .then(function (result) {
      if (result.error) { alert('Failed to unpublish review.'); return; }
      loadFeedbacks();
    });
}

function deleteFeedback(id) {
  if (!confirm('Permanently delete this review? This cannot be undone.')) return;

  _supabase
    .from('feedbacks')
    .delete()
    .eq('id', id)
    .then(function (result) {
      if (result.error) { alert('Failed to delete review.'); return; }
      loadFeedbacks();
    });
}


/* ============================================================
   12. UTILITY HELPERS
   ============================================================ */
function setTableLoading(tbodyId, cols) {
  var tbody = document.getElementById(tbodyId);
  if (tbody) tbody.innerHTML =
    '<tr><td colspan="' + cols + '" class="table-loading">' +
    '<i class="fa-solid fa-spinner fa-spin"></i> Loading...</td></tr>';
}

function setTableError(tbodyId, cols, msg) {
  var tbody = document.getElementById(tbodyId);
  if (tbody) tbody.innerHTML =
    '<tr><td colspan="' + cols + '" class="table-loading" style="color:#DC2626;">' +
    '⚠️ ' + msg + '</td></tr>';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;');
}

/* Init modal (called after supabase is ready) */
document.addEventListener('DOMContentLoaded', function () {
  initMenuItemModal();
});
