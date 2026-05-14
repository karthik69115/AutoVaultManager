import { api } from './api.js';
import { showToast, formatCurrency, formatDate, showLoader } from './utils.js';

let records = [];
let vehicles = [];
let chart = null;

const CATEGORIES = ['Insurance', 'Registration', 'Repairs', 'Accessories', 'Parking', 'Tolls', 'Other'];

export async function renderExpenses(container) {
  showLoader(container);
  [records, vehicles] = await Promise.all([api.getExpenses(), api.getVehicles()]);

  container.innerHTML = `
    <!-- Chart Section -->
    <div class="av-card" style="margin-bottom:var(--sp-6)">
      <div class="av-overline">Spend</div>
      <h2 class="av-section-title" style="margin-bottom:var(--sp-4)">Monthly summary</h2>
      <canvas id="expense-chart" height="100"></canvas>
    </div>

    <div class="av-page-header" style="margin-bottom:var(--sp-6)">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">Expenses</h1>
        <p class="av-page-subtitle">Insurance, registration, repairs — all in one ledger.</p>
      </div>
      <button class="av-btn av-btn-primary" id="add-exp-btn">
        <i class="ph ph-plus"></i> Add entry
      </button>
    </div>

    <div class="av-filter-bar">
      <select class="av-select" id="exp-vehicle-filter" style="max-width:280px">
        <option value="">All vehicles</option>
        ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
      </select>
    </div>

    <div class="av-table-wrap">
      <table class="av-table">
        <thead>
          <tr><th>Vehicle</th><th>Category</th><th>Date</th><th>Amount</th><th>Description</th><th>Actions</th></tr>
        </thead>
        <tbody id="exp-tbody"></tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="av-modal-overlay" id="exp-modal">
      <div class="av-modal">
        <div class="av-modal-header">
          <h3 class="av-modal-title" id="exp-modal-title">Add Expense</h3>
          <button class="av-modal-close" id="exp-modal-close">×</button>
        </div>
        <form id="exp-form">
          <input type="hidden" id="exp-id">
          <div class="av-form-group" style="margin-bottom:var(--sp-4)">
            <label class="av-form-label">Vehicle *</label>
            <select class="av-select" id="e-vehicle" required>
              <option value="">Select vehicle…</option>
              ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
            </select>
          </div>
          <div class="av-form-grid">
            <div class="av-form-group">
              <label class="av-form-label">Category *</label>
              <select class="av-select" id="e-category" required>
                <option value="">Select category…</option>
                ${CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Amount ($) *</label>
              <input type="number" class="av-input" id="e-amount" placeholder="0.00" min="0" step="0.01" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Date *</label>
              <input type="date" class="av-input" id="e-date" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Description</label>
              <input type="text" class="av-input" id="e-description" placeholder="Brief description...">
            </div>
          </div>
          <div class="av-modal-footer">
            <button type="button" class="av-btn av-btn-ghost" id="exp-cancel-btn">Cancel</button>
            <button type="submit" class="av-btn av-btn-primary">Save Expense</button>
          </div>
        </form>
      </div>
    </div>
  `;

  renderTable(records);
  renderChart(records);
  setupListeners();
}

function renderTable(list) {
  const tbody = document.getElementById('exp-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="av-empty-state"><div class="av-empty-icon"><i class="ph ph-receipt"></i></div><div class="av-empty-title">No expenses yet</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => `
    <tr>
      <td style="color:var(--eggshell)">${r.vehicleId?.make || ''} ${r.vehicleId?.model || ''}</td>
      <td>${r.category}</td>
      <td>${formatDate(r.date)}</td>
      <td style="color:var(--eggshell)">${formatCurrency(r.amount)}</td>
      <td>${r.description || '—'}</td>
      <td>
        <div style="display:flex;gap:var(--sp-2)">
          <button class="av-btn av-btn-icon av-btn-ghost" data-edit="${r._id}"><i class="ph ph-pencil-simple"></i></button>
          <button class="av-btn av-btn-icon av-btn-danger" data-delete="${r._id}"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    </tr>`).join('');

  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEdit(b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteRecord(b.dataset.delete)));
}

function renderChart(list) {
  const canvas = document.getElementById('expense-chart');
  if (!canvas) return;

  // Group by YYYY-MM
  const monthly = {};
  list.forEach(r => {
    const key = r.date?.slice(0, 7);
    if (!key) return;
    monthly[key] = (monthly[key] || 0) + r.amount;
  });
  const sorted = Object.keys(monthly).sort();

  const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const slate = getCssVar('--slate');
  const accent = getCssVar('--accent');

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: sorted,
      datasets: [{
        label: 'Spend ($)',
        data: sorted.map(k => monthly[k]),
        backgroundColor: accent, // Solid Yellow
        borderColor: slate, // Black/White border depending on theme
        borderWidth: 3, // Thick border
        borderRadius: 0, // No border radius
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: slate }, ticks: { color: slate, font: { family: 'Space Mono', weight: 'bold' } } },
        y: { grid: { color: slate }, ticks: { color: slate, font: { family: 'Space Mono', weight: 'bold' }, callback: v => `$${v}` } },
      },
    },
  });
}

function setupListeners() {
  document.getElementById('exp-vehicle-filter').addEventListener('change', async (e) => {
    records = await api.getExpenses(e.target.value || undefined);
    renderTable(records);
    renderChart(records);
  });

  document.getElementById('add-exp-btn').addEventListener('click', () => openModal());

  const closeModal = () => {
    document.getElementById('exp-modal').classList.remove('active');
    document.getElementById('exp-form').reset();
    document.getElementById('exp-id').value = '';
    document.getElementById('exp-modal-title').textContent = 'Add Expense';
  };
  document.getElementById('exp-modal-close').addEventListener('click', closeModal);
  document.getElementById('exp-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('exp-modal').addEventListener('click', e => { if (e.target === document.getElementById('exp-modal')) closeModal(); });

  document.getElementById('exp-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('exp-id').value;
    const body = {
      vehicleId:   document.getElementById('e-vehicle').value,
      category:    document.getElementById('e-category').value,
      date:        document.getElementById('e-date').value,
      amount:      parseFloat(document.getElementById('e-amount').value),
      description: document.getElementById('e-description').value.trim(),
    };
    try {
      if (id) {
        const updated = await api.updateExpense(id, body);
        records = records.map(r => r._id === id ? updated : r);
        showToast('Expense updated.');
      } else {
        const created = await api.createExpense(body);
        records.unshift(created);
        showToast('Expense added.');
      }
      renderTable(records);
      renderChart(records);
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function openModal(r = null) {
  document.getElementById('exp-modal').classList.add('active');
  if (r) {
    document.getElementById('exp-modal-title').textContent = 'Edit Expense';
    document.getElementById('exp-id').value       = r._id;
    document.getElementById('e-vehicle').value    = r.vehicleId?._id || r.vehicleId;
    document.getElementById('e-category').value   = r.category;
    document.getElementById('e-date').value       = r.date?.slice(0, 10);
    document.getElementById('e-amount').value     = r.amount;
    document.getElementById('e-description').value = r.description || '';
  }
}

function openEdit(id) { openModal(records.find(r => r._id === id)); }

async function deleteRecord(id) {
  if (!confirm('Delete this expense?')) return;
  try {
    await api.deleteExpense(id);
    records = records.filter(r => r._id !== id);
    renderTable(records);
    renderChart(records);
    showToast('Expense deleted.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
