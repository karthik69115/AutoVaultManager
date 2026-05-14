export async function renderProfile(container, user) {
  container.innerHTML = `
    <div class="av-page-header">
      <div>
        <div class="av-page-overline">AutoVault</div>
        <h1 class="av-page-title">Profile</h1>
        <p class="av-page-subtitle">Your AutoVault account.</p>
      </div>
    </div>

    <div style="max-width: 800px;">
      <!-- Account Card -->
      <div class="av-card">
        <div style="display:flex;align-items:center;gap:var(--sp-4);margin-bottom:var(--sp-6)">
          <div class="av-user-avatar" style="width:56px;height:56px;font-size:var(--text-xl)">
            ${user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div class="av-overline">Driver</div>
            <div style="font-family:var(--font-heading);font-size:var(--text-2xl);font-weight:var(--weight-bold)">
              ${user.name}
            </div>
            <div style="font-size:var(--text-sm);color:var(--color-text-muted)">${user.email}</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--sp-4)">
          <div class="av-card" style="padding:var(--sp-4)">
            <div class="av-label" style="margin-bottom:var(--sp-2)">Name</div>
            <div style="font-size:var(--text-sm)">${user.name}</div>
          </div>
          <div class="av-card" style="padding:var(--sp-4)">
            <div class="av-label" style="margin-bottom:var(--sp-2)">Email</div>
            <div style="font-size:var(--text-sm)">${user.email}</div>
          </div>
          <div class="av-card" style="padding:var(--sp-4)">
            <div class="av-label" style="margin-bottom:var(--sp-2)">Role</div>
            <div style="font-size:var(--text-sm)">${user.role}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}
