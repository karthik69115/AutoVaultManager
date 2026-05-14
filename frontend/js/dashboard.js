import { api } from './api.js';
import { formatCurrency, formatDate, daysUntil } from './utils.js';

export async function renderDashboard(container, currentUser) {
  const stats = await api.getStats();

  const upcoming = stats.upcomingServices[0];
  const dueIn = upcoming ? daysUntil(upcoming.nextDue) : null;

  container.innerHTML = `
    <div class="av-page-header">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">Welcome back, ${currentUser.name.toUpperCase()}.</h1>
        <p class="av-page-subtitle">A quiet command center for every vehicle in your garage.</p>
      </div>
      <a href="#garage" onclick="navigate('garage')" class="av-btn av-btn-primary">
        <i class="ph ph-plus"></i> Add Vehicle
      </a>
    </div>

    <!-- Stat Cards -->
    <div class="av-stats-grid">
      <div class="av-stat-card">
        <div class="av-stat-header">
          <span class="av-label">Vehicles</span>
          <div class="av-stat-icon"><i class="ph ph-car"></i></div>
        </div>
        <div class="av-stat-value">${stats.vehicleCount}</div>
      </div>
      <div class="av-stat-card">
        <div class="av-stat-header">
          <span class="av-label">Lifetime Spend</span>
          <div class="av-stat-icon"><i class="ph ph-currency-dollar"></i></div>
        </div>
        <div class="av-stat-value">${formatCurrency(stats.lifetimeSpend)}</div>
      </div>
      <div class="av-stat-card">
        <div class="av-stat-header">
          <span class="av-label">Fuel Cost</span>
          <div class="av-stat-icon"><i class="ph ph-gas-pump"></i></div>
        </div>
        <div class="av-stat-value">${formatCurrency(stats.fuelCost)}</div>
      </div>
      <div class="av-stat-card">
        <div class="av-stat-header">
          <span class="av-label">Liters Pumped</span>
          <div class="av-stat-icon"><i class="ph ph-drop"></i></div>
        </div>
        <div class="av-stat-value">${stats.totalLiters.toFixed(0)} <span style="font-size:var(--text-xl);font-weight:500">L</span></div>
      </div>
    </div>

    <!-- Middle Row -->
    <div class="av-two-col">
      <!-- Upcoming Services -->
      <div class="av-card">
        <div class="av-section-header">
          <div>
            <div class="av-overline">Upcoming Services</div>
            <h2 class="av-section-title">Next on the workshop calendar</h2>
          </div>
          <i class="ph ph-bell" style="color:var(--steel);font-size:1.25rem"></i>
        </div>
        <div id="upcoming-list">
          ${upcoming ? `
            <div class="av-activity-item" style="border:1px solid var(--color-border);border-radius:var(--radius-md);margin-top:var(--sp-2)">
              <div class="av-activity-icon"><i class="ph ph-wrench"></i></div>
              <div>
                <div class="av-activity-label">${upcoming.serviceType}</div>
                <div class="av-activity-sub">${upcoming.vehicleId?.make} ${upcoming.vehicleId?.model} · ${upcoming.vehicleId?.plate}</div>
              </div>
              <div class="av-activity-amount text-muted" style="font-size:var(--text-sm)">in ${dueIn}d</div>
            </div>
          ` : `<div class="av-empty-state" style="padding:var(--sp-8)">
            <div class="av-empty-icon"><i class="ph ph-calendar-blank"></i></div>
            <div class="av-empty-title">No upcoming services</div>
          </div>`}
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="av-card" style="padding:0;overflow:hidden">
        <div style="padding:var(--sp-5) var(--sp-5) 0">
          <div class="av-overline">Recent Activity</div>
          <h2 class="av-section-title">Latest entries</h2>
        </div>
        <div id="activity-list" style="margin-top:var(--sp-4)">
          ${stats.recentActivity.length === 0
            ? `<div class="av-empty-state" style="padding:var(--sp-8)"><div class="av-empty-title">No activity yet</div></div>`
            : stats.recentActivity.map(a => `
              <div class="av-activity-item">
                <div class="av-activity-icon">
                  <i class="ph ${a.type === 'fuel' ? 'ph-gas-pump' : a.type === 'maintenance' ? 'ph-wrench' : 'ph-currency-dollar'}"></i>
                </div>
                <div>
                  <div class="av-activity-label">${a.label}</div>
                  <div class="av-activity-sub">${a.vehicle} · ${formatDate(a.date)}</div>
                </div>
                <div class="av-activity-amount">${formatCurrency(a.amount)}</div>
              </div>
            `).join('')
          }
        </div>
      </div>
    </div>

    <!-- Pinned Vehicles -->
    ${stats.pinnedVehicles.length > 0 ? `
      <div style="margin-top:var(--sp-8)">
        <div class="av-section-header">
          <div>
            <div class="av-overline">Your Garage</div>
            <h2 class="av-section-title">Pinned vehicles</h2>
          </div>
          <a href="#garage" onclick="navigate('garage')" class="av-btn av-btn-ghost" style="font-size:var(--text-sm)">View all</a>
        </div>
        <div class="av-garage-grid">
          ${stats.pinnedVehicles.map(v => vehicleCardHTML(v)).join('')}
        </div>
      </div>
    ` : ''}
  `;
}

function vehicleCardHTML(v) {
  const img = v.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&auto=format&fit=crop';
  return `
    <div class="av-vehicle-card">
      <div class="av-vehicle-img">
        <img src="${img}" alt="${v.make} ${v.model}" loading="lazy">
        <span class="year-badge">${v.year}</span>
      </div>
      <div class="av-vehicle-body">
        <div class="av-vehicle-name">${v.make} ${v.model}</div>
        <div class="av-vehicle-meta">${v.plate} · ${v.color || 'No color specified'}</div>
        <div class="av-vehicle-stats">
          <span style="font-size:var(--text-sm);color:var(--eggshell)">${v.mileage?.toLocaleString()} km</span>
          <span class="av-fuel-badge">${v.fuelType}</span>
        </div>
      </div>
    </div>
  `;
}
