import { api } from './api.js';
import { showToast, formatCurrency, formatDate, daysUntil, showLoader } from './utils.js';

let records = [];
let vehicles = [];

export async function renderMaintenance(container) {
  showLoader(container);
  [records, vehicles] = await Promise.all([api.getMaintenance(), api.getVehicles()]);

  container.innerHTML = `
    <div class="av-page-header">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">Maintenance</h1>
        <p class="av-page-subtitle">Every service, neatly archived.</p>
      </div>
      <button class="av-btn av-btn-primary" id="add-maint-btn">
        <i class="ph ph-plus"></i> Add entry
      </button>
    </div>

    <div class="av-filter-bar">
      <select class="av-select" id="maint-vehicle-filter" style="max-width:280px">
        <option value="">All vehicles</option>
        ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
      </select>
    </div>

    <div class="av-table-wrap">
      <table class="av-table">
        <thead>
          <tr>
            <th>Vehicle</th><th>Service</th><th>Date</th><th>Next Due</th><th>Cost</th><th>Notes</th><th>Actions</th>
          </tr>
        </thead>
        <tbody id="maint-tbody"></tbody>
      </table>
    </div>

    <!-- Modal -->
    <div class="av-modal-overlay" id="maint-modal">
      <div class="av-modal">
        <div class="av-modal-header">
          <h3 class="av-modal-title" id="maint-modal-title">Add Maintenance Entry</h3>
          <button class="av-modal-close" id="maint-modal-close">×</button>
        </div>
        <form id="maint-form">
          <input type="hidden" id="maint-id">
          <div class="av-form-group" style="margin-bottom:var(--sp-4)">
            <label class="av-form-label">Vehicle *</label>
            <select class="av-select" id="m-vehicle" required>
              <option value="">Select vehicle…</option>
              ${vehicles.map(v => `<option value="${v._id}">${v.make} ${v.model} (${v.plate})</option>`).join('')}
            </select>
          </div>
          <div class="av-form-grid">
            <div class="av-form-group">
              <label class="av-form-label">Service Type *</label>
              <input type="text" class="av-input" id="m-service" placeholder="e.g. Oil Change" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Cost ($) *</label>
              <input type="number" class="av-input" id="m-cost" placeholder="0.00" min="0" step="0.01" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Date *</label>
              <input type="date" class="av-input" id="m-date" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Next Due</label>
              <input type="date" class="av-input" id="m-next-due">
            </div>
          </div>
          <div class="av-form-group" style="margin-top:var(--sp-4)">
            <label class="av-form-label">Notes</label>
            <input type="text" class="av-input" id="m-notes" placeholder="Any additional notes...">
          </div>
          <div class="av-modal-footer">
            <button type="button" class="av-btn av-btn-ghost" id="maint-cancel-btn">Cancel</button>
            <button type="submit" class="av-btn av-btn-primary">Save Entry</button>
          </div>
        </form>
      </div>
    </div>
  `;

  renderTable(records);
  setupListeners();
}

function renderTable(list) {
  const tbody = document.getElementById('maint-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="av-empty-state"><div class="av-empty-icon"><i class="ph ph-wrench"></i></div><div class="av-empty-title">No records yet</div></div></td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(r => {
    const due = r.nextDue ? daysUntil(r.nextDue) : null;
    const dueBadge = due !== null
      ? `<span style="color:${due < 0 ? 'var(--color-danger)' : due < 14 ? '#e67e22' : 'var(--color-text-muted)'}">${formatDate(r.nextDue)}</span>`
      : '—';
    return `
      <tr>
        <td style="color:var(--eggshell)">${r.vehicleId?.make || ''} ${r.vehicleId?.model || ''}</td>
        <td style="color:var(--eggshell)">${r.serviceType}</td>
        <td>${formatDate(r.date)}</td>
        <td>${dueBadge}</td>
        <td style="color:var(--eggshell)">${formatCurrency(r.cost)}</td>
        <td>${r.notes || '—'}</td>
        <td>
          <div style="display:flex;gap:var(--sp-2)">
            <button class="av-btn av-btn-icon av-btn-ghost" data-edit="${r._id}"><i class="ph ph-pencil-simple"></i></button>
            <button class="av-btn av-btn-icon av-btn-danger" data-delete="${r._id}"><i class="ph ph-trash"></i></button>
          </div>
        </td>
      </tr>`;
  }).join('');

  document.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => openEdit(b.dataset.edit)));
  document.querySelectorAll('[data-delete]').forEach(b => b.addEventListener('click', () => deleteRecord(b.dataset.delete)));
}

function setupListeners() {
  document.getElementById('maint-vehicle-filter').addEventListener('change', async (e) => {
    records = await api.getMaintenance(e.target.value || undefined);
    renderTable(records);
  });

  document.getElementById('add-maint-btn').addEventListener('click', () => openModal());

  const closeModal = () => {
    document.getElementById('maint-modal').classList.remove('active');
    document.getElementById('maint-form').reset();
    document.getElementById('maint-id').value = '';
    document.getElementById('maint-modal-title').textContent = 'Add Maintenance Entry';
  };
  document.getElementById('maint-modal-close').addEventListener('click', closeModal);
  document.getElementById('maint-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('maint-modal').addEventListener('click', e => { if (e.target === document.getElementById('maint-modal')) closeModal(); });

  document.getElementById('maint-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('maint-id').value;
    const body = {
      vehicleId:   document.getElementById('m-vehicle').value,
      serviceType: document.getElementById('m-service').value.trim(),
      cost:        parseFloat(document.getElementById('m-cost').value),
      date:        document.getElementById('m-date').value,
      nextDue:     document.getElementById('m-next-due').value || null,
      notes:       document.getElementById('m-notes').value.trim(),
    };
    try {
      if (id) {
        const updated = await api.updateMaintenance(id, body);
        records = records.map(r => r._id === id ? updated : r);
        showToast('Entry updated.');
      } else {
        const created = await api.createMaintenance(body);
        records.unshift(created);
        showToast('Maintenance entry added.');
      }
      renderTable(records);
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function openModal(r = null) {
  document.getElementById('maint-modal').classList.add('active');
  if (r) {
    document.getElementById('maint-modal-title').textContent = 'Edit Entry';
    document.getElementById('maint-id').value    = r._id;
    document.getElementById('m-vehicle').value   = r.vehicleId?._id || r.vehicleId;
    document.getElementById('m-service').value   = r.serviceType;
    document.getElementById('m-cost').value      = r.cost;
    document.getElementById('m-date').value      = r.date?.slice(0, 10);
    document.getElementById('m-next-due').value  = r.nextDue?.slice(0, 10) || '';
    document.getElementById('m-notes').value     = r.notes || '';
  }
}

function openEdit(id) {
  openModal(records.find(r => r._id === id));
}

async function deleteRecord(id) {
  if (!confirm('Delete this maintenance record?')) return;
  try {
    await api.deleteMaintenance(id);
    records = records.filter(r => r._id !== id);
    renderTable(records);
    showToast('Record deleted.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
