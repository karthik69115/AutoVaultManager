/* ══════════════════════════════════════════════════════════════════
   AutoVault V2 — Toast Notification Utility
   ══════════════════════════════════════════════════════════════════ */

let toastContainer = null;

function getContainer() {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'av-toast-container';
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

export function showToast(message, type = 'success', duration = 3500) {
  const container = getContainer();
  const toast = document.createElement('div');
  toast.className = `av-toast ${type}`;
  const icon = type === 'success' ? 'ph ph-check-circle' : 'ph ph-warning-circle';
  toast.innerHTML = `<i class="${icon}"></i> ${message}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ══════════════════════════════════════════════════════════════════
   Formatting Utilities
   ══════════════════════════════════════════════════════════════════ */

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-CA'); // YYYY-MM-DD
}

export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function vehicleName(v) {
  return v ? `${v.make} ${v.model}` : '—';
}

/* ══════════════════════════════════════════════════════════════════
   Loading State Helper
   ══════════════════════════════════════════════════════════════════ */

export function showLoader(container) {
  container.innerHTML = `<div class="av-loader"><div class="av-spinner"></div></div>`;
}

export function showEmpty(container, title = 'No data yet', subtitle = 'Add your first entry to get started.') {
  container.innerHTML = `
    <div class="av-empty-state">
      <div class="av-empty-icon"><i class="ph ph-archive"></i></div>
      <div class="av-empty-title">${title}</div>
      <div class="text-muted" style="font-size:var(--text-sm)">${subtitle}</div>
    </div>
  `;
}
