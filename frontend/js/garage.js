import { api } from './api.js';
import { showToast, formatDate, showLoader } from './utils.js';

let vehicles = [];

export async function renderGarage(container) {
  showLoader(container);
  vehicles = await api.getVehicles();

  container.innerHTML = `
    <div class="av-page-header">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">My Garage</h1>
        <p class="av-page-subtitle">Every vehicle, logged and remembered.</p>
      </div>
      <button class="av-btn av-btn-primary" id="add-vehicle-btn">
        <i class="ph ph-plus"></i> Add Vehicle
      </button>
    </div>

    <div class="av-filter-bar">
      <div class="av-search-wrap">
        <i class="ph ph-magnifying-glass av-search-icon"></i>
        <input type="text" class="av-input" id="garage-search" placeholder="Search by brand, model, plate...">
      </div>
    </div>

    <div class="av-garage-grid" id="garage-grid"></div>

    <!-- Add/Edit Modal -->
    <div class="av-modal-overlay" id="vehicle-modal">
      <div class="av-modal">
        <div class="av-modal-header">
          <h3 class="av-modal-title" id="vehicle-modal-title">Add Vehicle</h3>
          <button class="av-modal-close" id="vehicle-modal-close">×</button>
        </div>
        <form id="vehicle-form">
          <input type="hidden" id="vehicle-id">
          <div class="av-form-grid">
            <div class="av-form-group">
              <label class="av-form-label">Make *</label>
              <input type="text" class="av-input" id="v-make" placeholder="e.g. Chevrolet" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Model *</label>
              <input type="text" class="av-input" id="v-model" placeholder="e.g. Cruze" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Year *</label>
              <input type="number" class="av-input" id="v-year" placeholder="e.g. 2017" min="1900" max="2030" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Plate Number *</label>
              <input type="text" class="av-input" id="v-plate" placeholder="e.g. KA01AB1234" required>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Color</label>
              <input type="text" class="av-input" id="v-color" placeholder="e.g. Obsidian Black">
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Mileage (km)</label>
              <input type="number" class="av-input" id="v-mileage" placeholder="e.g. 28500" min="0">
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Fuel Type</label>
              <select class="av-select" id="v-fuel">
                <option value="PETROL">Petrol</option>
                <option value="DIESEL">Diesel</option>
                <option value="ELECTRIC">Electric</option>
                <option value="HYBRID">Hybrid</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            <div class="av-form-group">
              <label class="av-form-label">Image URL</label>
              <input type="url" class="av-input" id="v-image" placeholder="https://...">
            </div>
          </div>
          <div class="av-modal-footer">
            <button type="button" class="av-btn av-btn-ghost" id="vehicle-cancel-btn">Cancel</button>
            <button type="submit" class="av-btn av-btn-primary" id="vehicle-save-btn">Save Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  `;

  renderGrid(vehicles);
  setupGarageListeners(container);
}

function renderGrid(list) {
  const grid = document.getElementById('garage-grid');
  if (list.length === 0) {
    grid.innerHTML = `
      <div class="av-empty-state" style="grid-column:1/-1">
        <div class="av-empty-icon"><i class="ph ph-garage"></i></div>
        <div class="av-empty-title">Your garage is empty</div>
        <div class="text-muted" style="font-size:var(--text-sm)">Add your first vehicle to get started.</div>
      </div>`;
    return;
  }
  grid.innerHTML = list.map(v => vehicleCardHTML(v)).join('');

  // Bind edit & delete buttons
  grid.querySelectorAll('[data-edit]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.edit));
  });
  grid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', () => deleteVehicle(btn.dataset.delete));
  });
}

function vehicleCardHTML(v) {
  const img = v.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&auto=format&fit=crop';
  return `
    <div class="av-vehicle-card" data-id="${v._id}">
      <div class="av-vehicle-img">
        <img src="${img}" alt="${v.make} ${v.model}" loading="lazy">
        <span class="year-badge">${v.year}</span>
      </div>
      <div class="av-vehicle-body">
        <div class="av-vehicle-name">${v.make} ${v.model}</div>
        <div class="av-vehicle-meta">${v.plate} · ${v.color || 'No color'}</div>
        <div class="av-vehicle-stats">
          <span style="font-size:var(--text-sm);color:var(--eggshell)">${(v.mileage || 0).toLocaleString()} km</span>
          <span class="av-fuel-badge">${v.fuelType}</span>
        </div>
        <div class="av-vehicle-actions">
          <button class="av-btn av-btn-ghost" style="flex:1" data-edit="${v._id}">
            <i class="ph ph-pencil-simple"></i> Edit
          </button>
          <button class="av-btn av-btn-icon av-btn-danger" data-delete="${v._id}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
      </div>
    </div>`;
}

function setupGarageListeners(container) {
  // Search
  document.getElementById('garage-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = vehicles.filter(v =>
      `${v.make} ${v.model} ${v.plate} ${v.color}`.toLowerCase().includes(q)
    );
    renderGrid(filtered);
  });

  // Open add modal
  document.getElementById('add-vehicle-btn').addEventListener('click', () => openAddModal());

  // Close modal
  const closeModal = () => {
    document.getElementById('vehicle-modal').classList.remove('active');
    document.getElementById('vehicle-form').reset();
    document.getElementById('vehicle-id').value = '';
  };
  document.getElementById('vehicle-modal-close').addEventListener('click', closeModal);
  document.getElementById('vehicle-cancel-btn').addEventListener('click', closeModal);
  document.getElementById('vehicle-modal').addEventListener('click', (e) => {
    if (e.target === document.getElementById('vehicle-modal')) closeModal();
  });

  // Form submit
  document.getElementById('vehicle-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vehicle-id').value;
    const body = {
      name:     `${document.getElementById('v-make').value.trim()} ${document.getElementById('v-model').value.trim()}`,
      make:     document.getElementById('v-make').value.trim(),
      model:    document.getElementById('v-model').value.trim(),
      year:     parseInt(document.getElementById('v-year').value),
      plate:    document.getElementById('v-plate').value.trim(),
      color:    document.getElementById('v-color').value.trim(),
      mileage:  parseInt(document.getElementById('v-mileage').value) || 0,
      fuelType: document.getElementById('v-fuel').value,
      imageUrl: document.getElementById('v-image').value.trim(),
    };
    const saveBtn = document.getElementById('vehicle-save-btn');
    saveBtn.disabled = true;
    try {
      if (id) {
        const updated = await api.updateVehicle(id, body);
        vehicles = vehicles.map(v => v._id === id ? updated : v);
        showToast('Vehicle updated successfully.');
      } else {
        const created = await api.createVehicle(body);
        vehicles.unshift(created);
        showToast('Vehicle added to your garage.');
      }
      renderGrid(vehicles);
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  });
}

function openAddModal() {
  document.getElementById('vehicle-modal-title').textContent = 'Add Vehicle';
  document.getElementById('vehicle-id').value = '';
  document.getElementById('vehicle-form').reset();
  document.getElementById('vehicle-modal').classList.add('active');
}

function openEditModal(id) {
  const v = vehicles.find(v => v._id === id);
  if (!v) return;
  document.getElementById('vehicle-modal-title').textContent = 'Edit Vehicle';
  document.getElementById('vehicle-id').value = v._id;
  document.getElementById('v-make').value    = v.make;
  document.getElementById('v-model').value   = v.model;
  document.getElementById('v-year').value    = v.year;
  document.getElementById('v-plate').value   = v.plate;
  document.getElementById('v-color').value   = v.color || '';
  document.getElementById('v-mileage').value = v.mileage || 0;
  document.getElementById('v-fuel').value    = v.fuelType;
  document.getElementById('v-image').value   = v.imageUrl || '';
  document.getElementById('vehicle-modal').classList.add('active');
}

async function deleteVehicle(id) {
  if (!confirm('Delete this vehicle? This cannot be undone.')) return;
  try {
    await api.deleteVehicle(id);
    vehicles = vehicles.filter(v => v._id !== id);
    renderGrid(vehicles);
    showToast('Vehicle removed from garage.');
  } catch (err) {
    showToast(err.message, 'error');
  }
}
