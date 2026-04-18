import { getUsers, setCurrentUser } from '../lib/storage.js';

export function renderLogin() {
  const users = getUsers();

  const userOptions = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

  const html = `
    <div style="min-height:calc(100vh - 56px);margin:-32px -24px;display:flex">
      <!-- Left dark panel -->
      <div style="display:none;flex-direction:column;justify-content:center;background:#1c2b3a;color:#fff;width:50%;padding:64px;flex-shrink:0" id="login-left">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:40px">
          <div style="width:32px;height:32px;background:#0d9488;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:14px">L</div>
          <span style="font-weight:600;font-size:15px">Helplytics AI</span>
        </div>
        <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#34d399;margin-bottom:12px">Community Access</p>
        <h1 style="font-size:clamp(28px,3.5vw,42px);font-weight:900;line-height:1.15;margin-bottom:20px">Enter the support network.</h1>
        <p style="font-size:14px;color:#94a3b8;line-height:1.7;margin-bottom:28px">
          Choose a demo identity, set your role, and jump into a multi-page product flow designed for asking, offering, and tracking help with a premium interface.
        </p>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:12px">
          ${[
            'Role-based entry for Need Help, Can Help, or Both',
            'Direct path into dashboard, requests, AI Center, and community feed',
            'Persistent demo session powered by LocalStorage',
          ].map(item => `
            <li style="display:flex;align-items:flex-start;gap:10px;font-size:14px;color:#94a3b8">
              <span style="color:#34d399;margin-top:1px;flex-shrink:0">&bull;</span>
              ${item}
            </li>
          `).join('')}
        </ul>
      </div>

      <!-- Right form panel -->
      <div style="display:flex;flex-direction:column;justify-content:center;width:100%;padding:48px 32px;max-width:560px;margin:0 auto" id="login-right">
        <p style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">Login / Signup</p>
        <h2 style="font-size:clamp(26px,3.5vw,38px);font-weight:900;color:#1a1a1a;margin-bottom:32px;line-height:1.2">Authenticate your community profile</h2>

        <form id="login-form" style="display:flex;flex-direction:column;gap:20px">
          <div>
            <label class="form-label">Select demo user</label>
            <select id="select-user" class="form-input">${userOptions}</select>
          </div>
          <div>
            <label class="form-label">Role selection</label>
            <select id="select-role" class="form-input">
              <option>Both</option>
              <option>Need Help</option>
              <option>Can Help</option>
            </select>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <label class="form-label">Email</label>
              <input type="email" class="form-input" value="community@helplytics.ai" />
            </div>
            <div>
              <label class="form-label">Password</label>
              <input type="password" class="form-input" value="password123" />
            </div>
          </div>
          <button type="submit" class="btn-primary" style="padding:14px;font-size:15px">Continue to dashboard</button>
        </form>

        <p style="margin-top:20px;font-size:12px;text-align:center;color:#94a3b8">
          By continuing, you agree to our demo terms. No real account is created.
        </p>
      </div>
    </div>
  `;

  const init = () => {
    // Show left panel on larger screens
    const leftPanel = document.getElementById('login-left');
    if (window.innerWidth >= 1024) leftPanel.style.display = 'flex';
    window.addEventListener('resize', () => {
      if (leftPanel) leftPanel.style.display = window.innerWidth >= 1024 ? 'flex' : 'none';
    });

    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const userId = document.getElementById('select-user').value;
      setCurrentUser(userId);
      window.navigate('/dashboard');
    });
  };

  return { html, init };
}
