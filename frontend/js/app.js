/* ══════════════════════════════════════════════════════════════════
   AutoVault V2 — SPA Router & App Shell
   ══════════════════════════════════════════════════════════════════ */
import { api } from './api.js';
import { showToast } from './utils.js';
import { renderDashboard } from './dashboard.js';
import { renderGarage } from './garage.js';
import { renderMaintenance } from './maintenance.js';
import { renderFuel } from './fuel.js';
import { renderExpenses } from './expenses.js';
import { renderProfile } from './profile.js';

// ── State ───────────────────────────────────────────────────────────
let currentUser = null;

// ── Routes ──────────────────────────────────────────────────────────
const routes = {
  dashboard:   { render: renderDashboard,   label: 'Dashboard',   icon: 'ph ph-house' },
  garage:      { render: renderGarage,      label: 'My Garage',   icon: 'ph ph-garage' },
  maintenance: { render: renderMaintenance, label: 'Maintenance', icon: 'ph ph-wrench' },
  fuel:        { render: renderFuel,        label: 'Fuel',        icon: 'ph ph-gas-pump' },
  expenses:    { render: renderExpenses,    label: 'Expenses',    icon: 'ph ph-currency-dollar' },
  profile:     { render: renderProfile,     label: 'Profile',     icon: 'ph ph-user-circle' },
};

// ── Init ─────────────────────────────────────────────────────────────
async function init() {
  // Init Theme
  if (localStorage.getItem('av-theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  try {
    const { user } = await api.getMe();
    currentUser = user;
    showApp();
  } catch {
    showAuthPage();
  }
}

// ── Auth Page ─────────────────────────────────────────────────────────
function showAuthPage() {
  document.getElementById('app-shell').style.display = 'none';
  const auth = document.getElementById('auth-page');
  auth.style.display = 'flex';
  setupAuthListeners();
}

function setupAuthListeners() {
  const form        = document.getElementById('auth-form');
  const toggleBtn   = document.getElementById('auth-toggle');
  const titleEl     = document.getElementById('auth-title');
  const submitEl    = document.getElementById('auth-submit');
  const nameWrap    = document.getElementById('name-wrap');
  let isLogin       = true;

  toggleBtn.addEventListener('click', () => {
    isLogin = !isLogin;
    titleEl.textContent   = isLogin ? 'Welcome back.' : 'Create account.';
    submitEl.textContent  = isLogin ? 'Sign in' : 'Create account';
    toggleBtn.textContent = isLogin ? "Don't have an account? Register" : 'Already have an account? Sign in';
    nameWrap.style.display = isLogin ? 'none' : 'block';
    document.getElementById('auth-error').textContent = '';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email    = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const name     = document.getElementById('auth-name').value.trim();
    const errorEl  = document.getElementById('auth-error');
    submitEl.disabled = true;
    submitEl.textContent = isLogin ? 'Signing in…' : 'Creating…';
    try {
      const res = isLogin
        ? await api.login({ email, password })
        : await api.register({ name, email, password });
      currentUser = res.user;
      document.getElementById('auth-page').style.display = 'none';
      showApp();
    } catch (err) {
      errorEl.textContent = err.message;
    } finally {
      submitEl.disabled = false;
      submitEl.textContent = isLogin ? 'Sign in' : 'Create account';
    }
  });
}

// ── App Shell ─────────────────────────────────────────────────────────
function showApp() {
  document.getElementById('app-shell').style.display = 'flex';
  renderSidebar();
  navigate(location.hash.slice(1) || 'dashboard');
}

function renderSidebar() {
  // User info
  document.getElementById('sidebar-user-name').textContent  = currentUser.name;
  document.getElementById('sidebar-user-email').textContent = currentUser.email;
  document.getElementById('sidebar-user-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

  // Nav links
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = Object.entries(routes).map(([key, r]) => `
    <a class="av-nav-link" data-route="${key}" href="#${key}">
      <i class="${r.icon}"></i>
      ${r.label}
    </a>
  `).join('');

  nav.querySelectorAll('.av-nav-link').forEach(link => {
    link.addEventListener('click', () => navigate(link.dataset.route));
  });

  // Theme Toggle
  const themeBtn = document.getElementById('theme-toggle-btn');
  const updateThemeBtn = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeBtn.innerHTML = isDark 
      ? `<i class="ph ph-sun"></i> <span>Sunlight Mode</span>`
      : `<i class="ph ph-moon"></i> <span>Midnight Vault</span>`;
  };
  updateThemeBtn();

  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('av-theme', 'light');
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('av-theme', 'dark');
    }
    updateThemeBtn();
    navigate(location.hash.slice(1) || 'dashboard'); // Re-render to update charts
  });

  // Sign out
  document.getElementById('sign-out-btn').addEventListener('click', async () => {
    await api.logout();
    location.reload();
  });
}

// ── Router ───────────────────────────────────────────────────────────
async function navigate(route) {
  if (!routes[route]) route = 'dashboard';
  location.hash = route;

  // Highlight active link
  document.querySelectorAll('.av-nav-link').forEach(l => l.classList.remove('active'));
  document.querySelector(`.av-nav-link[data-route="${route}"]`)?.classList.add('active');

  // Render view
  const main = document.getElementById('main-content');
  main.innerHTML = `<div class="av-loader"><div class="av-spinner"></div></div>`;
  try {
    await routes[route].render(main, currentUser);
  } catch (err) {
    main.innerHTML = `<div class="av-empty-state">
      <div class="av-empty-icon">⚠️</div>
      <div class="av-empty-title">Failed to load page</div>
      <div class="text-muted">${err.message}</div>
    </div>`;
  }
}

// Expose navigate globally so sub-modules can call it
window.navigate = navigate;

// ── Start ──────────────────────────────────────────────────────────
init();
