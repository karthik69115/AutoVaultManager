import { api } from './api.js';
import { showToast, formatCurrency, formatDate, showLoader } from './utils.js';

let records = [];
let vehicles = [];
let chart = null;

export async function renderFuel(container) {
  showLoader(container);
  [records, vehicles] = await Promise.all([api.getFuel(), api.getVehicles()]);

  container.innerHTML = `
    <!-- Chart Section -->
    <div class="av-card" style="margin-bottom:var(--sp-6)">
      <div class="av-overline">Trends</div>
      <h2 class="av-section-title" style="margin-bottom:var(--sp-4)">Refuel timeline</h2>
      <canvas id="fuel-chart" height="100"></canvas>
    </div>

    <div class="av-page-header" style="margin-bottom:var(--sp-6)">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">Fuel Tracker</h1>
        <p class="av-page-subtitle">Liters in, kilometers out — track every drop.</p>
      </div>
      <button class="av-btn av-btn-primary" id="add-fuel-btn">
        <i class="ph ph-plus"></i> Add entry
      </button>
    </div>

    <div class="av-filter-bar">
      <select class="av-select" id="fuel-vehicle-filter" style="max-width:280px">
        <option value="">All vehicles</option>
        ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
      </select>
    </div>

    <div class="av-table-wrap">
      <table class="av-table">
        <thead>
          <tr><th>Vehicle</th><th>Date</th><th>Liters</th><th>Mileage (km)</th><th>Cost</th><th>Actions</th></tr>
        </thead>
        <tbody id="fuel-tbody"></tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="av-modal-overlay" id="fuel-modal">
      <div class="av-modal">
        <div class="av-modal-header">
          <h3 class="av-modal-title" id="fuel-modal-title">Add Fuel Entry</h3>
          <button class="av-modal-close" id="fuel-modal-close">×</button>
        </div>
        <form id="fuel-form">
          <input type="hidden" id="fuel-id">
          <div class="av-form-group" style="margin-bottom:var(--sp-4)">
            <label class="av-form-label">Vehicle *</label>
            <select class="av-select" id="f-vehicle" required>
              <option value="">Select vehicle…</option>
              ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
            </select>
          </div>
          <div class="av-form-grid">
            <div class="av-form-group">
              <label class="av-form-label">Date *</label>
              <input type="date" class="av-input" id="f-date" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Liters *</label>
              <input type="number" class="av-input" id="f-liters" placeholder="e.g. 40.5" min="0" step="0.1" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Odometer (km) *</label>
              <input type="number" class="av-input" id="f-mileage" placeholder="e.g. 28050" min="0" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Cost ($) *</label>
              <input type="number" class="av-input" id="f-cost" placeholder="0.00" min="0" step="0.01" required>
            </div>
          </div>
          <div class="av-modal-footer">
            <button type="button" class="av-btn av-btn-ghost" id="fuel-cancel-btn">Cancel</button>
            <button type="submit" class="av-btn av-btn-primary">Save Entry</button>
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
  const tbody = document.getElementById('fuel-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="av-empty-state"><div class="av-empty-icon"><i class="ph ph-gas-pump"></i></div><div class="av-empty-title">No fuel entries yet</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => `
    <tr>
      <td style="color:var(--eggshell)">${r.vehicleId?.make || ''} ${r.vehicleId?.model || ''}</td>
      <td>${formatDate(r.date)}</td>
      <td>${r.liters.toFixed(2)} L</td>
      <td>${(r.mileage || 0).toLocaleString()}</td>
      <td style="color:var(--eggshell)">${formatCurrency(r.cost)}</td>
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
  const canvas = document.getElementById('fuel-chart');
  if (!canvas) return;

  // Sort by date for the timeline
  const sorted = [...list].sort((a, b) => new Date(a.date) - new Date(b.date));
  const labels = sorted.map(r => formatDate(r.date));
  const liters  = sorted.map(r => r.liters);
  const costs   = sorted.map(r => r.cost);

  const getCssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const slate = getCssVar('--slate');
  const space = getCssVar('--space');
  const accent = getCssVar('--accent');

  if (chart) chart.destroy();
  chart = new Chart(canvas, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Cost ($)',
          data: costs,
          borderColor: slate,
          backgroundColor: accent, // Yellow fill
          borderWidth: 3,
          tension: 0, // Sharp lines for brutalism
          pointBackgroundColor: slate,
          pointBorderColor: slate,
          pointRadius: 5,
          pointBorderWidth: 2,
          fill: true,
        },
        {
          label: 'Liters',
          data: liters,
          borderColor: slate,
          backgroundColor: space, // Matches card background
          borderWidth: 3,
          tension: 0, // Sharp lines
          pointBackgroundColor: space,
          pointBorderColor: slate,
          pointRadius: 5,
          pointBorderWidth: 2,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: slate }, ticks: { color: slate, font: { family: 'Space Mono', weight: 'bold' } } },
        y: { grid: { color: slate }, ticks: { color: slate, font: { family: 'Space Mono', weight: 'bold' } } },
      },
    },
  });
}

function setupListeners() {
  document.getElementById('fuel-vehicle-filter').addEventListener('change', async (e) => {
    records = await api.getFuel(e.target.value || undefined);
    renderTable(records);
    renderChart(records);
  });

  document.getElementById('add-fuel-btn').addEventListener('click', () => openModal());

  const closeModal = () => {
    document.getElementById('fuel-modal').classList.remove('active');
    document.getElementById('fuel-form').reset();
    document.getElementById('fuel-id').value = '';
    document.getElementById('fuel-modal-title').textContent = 'Add Fuel Entry';
  };
  document.getElementById('fuel-modal-close').addEventListener('click', closeModal);
  document.getElementById('fuel-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('fuel-modal').addEventListener('click', e => { if (e.target === document.getElementById('fuel-modal')) closeModal(); });

  document.getElementById('fuel-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('fuel-id').value;
    const body = {
      vehicleId: document.getElementById('f-vehicle').value,
      date:      document.getElementById('f-date').value,
      liters:    parseFloat(document.getElementById('f-liters').value),
      mileage:   parseInt(document.getElementById('f-mileage').value),
      cost:      parseFloat(document.getElementById('f-cost').value),
    };
    try {
      if (id) {
        const updated = await api.updateFuel(id, body);
        records = records.map(r => r._id === id ? updated : r);
        showToast('Fuel entry updated.');
      } else {
        const created = await api.createFuel(body);
        records.unshift(created);
        showToast('Fuel entry added.');
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
  document.getElementById('fuel-modal').classList.add('active');
  if (r) {
    document.getElementById('fuel-modal-title').textContent = 'Edit Entry';
    document.getElementById('fuel-id').value     = r._id;
    document.getElementById('f-vehicle').value   = r.vehicleId?._id || r.vehicleId;
    document.getElementById('f-date').value      = r.date?.slice(0, 10);
    document.getElementById('f-liters').value    = r.liters;
    document.getElementById('f-mileage').value   = r.mileage;
    document.getElementById('f-cost').value      = r.cost;
  }
}

function openEdit(id) { openModal(records.find(r => r._id === id)); }

async function deleteRecord(id) {
  if (!confirm('Delete this fuel entry?')) return;
  try {
    await api.deleteFuel(id);
    records = records.filter(r => r._id !== id);
    renderTable(records);
    renderChart(records);
    showToast('Fuel entry deleted.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
