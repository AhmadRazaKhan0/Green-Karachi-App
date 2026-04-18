import { getRequests, getUsers, saveRequest } from '../lib/storage.js';

export function renderAdmin() {
  const requests = getRequests();
  const users = getUsers();
  const getName = id => users.find(u => u.id === id)?.name || 'Unknown';

  const urgencyBadge = u => {
    const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return `<span class="badge ${map[u] || 'badge-low'}">${u}</span>`;
  };
  const statusBadge = s => `<span class="badge ${s === 'Solved' ? 'badge-solved' : 'badge-open'}">${s}</span>`;

  const reqRows = requests.map(r => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:12px 16px;font-size:14px;font-weight:600;color:#1a1a1a;max-width:280px">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</div>
      </td>
      <td style="padding:12px 16px;font-size:13px;color:#64748b">${r.category}</td>
      <td style="padding:12px 8px">${urgencyBadge(r.urgency)}</td>
      <td style="padding:12px 8px">${statusBadge(r.status)}</td>
      <td style="padding:12px 16px;font-size:13px;color:#64748b">${getName(r.authorId)}</td>
      <td style="padding:12px 16px">
        <div style="display:flex;gap:8px">
          <button onclick="navigate('/request/${r.id}')" style="font-size:12px;color:#0d9488;background:none;border:none;cursor:pointer;font-weight:600;padding:4px 8px;border-radius:6px;border:1.5px solid rgba(13,148,136,0.3);transition:background 0.15s" onmouseover="this.style.background='rgba(13,148,136,0.06)'" onmouseout="this.style.background='none'">View</button>
          ${r.status === 'Open' ? `<button onclick="adminSolve('${r.id}')" style="font-size:12px;color:#059669;background:none;border:none;cursor:pointer;font-weight:600;padding:4px 8px;border-radius:6px;border:1.5px solid rgba(5,150,105,0.3);transition:background 0.15s" onmouseover="this.style.background='rgba(5,150,105,0.06)'" onmouseout="this.style.background='none'">Solve</button>` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  const userRows = users.map(u => `
    <tr style="border-bottom:1px solid #f1f5f9">
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;background:${u.avatarColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0">${u.initials}</div>
          <span style="font-size:14px;font-weight:600;color:#1a1a1a">${u.name}</span>
        </div>
      </td>
      <td style="padding:12px 16px;font-size:13px;color:#64748b">${u.role}</td>
      <td style="padding:12px 16px;font-size:13px;color:#64748b">${u.location}</td>
      <td style="padding:12px 16px;font-size:14px;font-weight:700;color:#0d9488">${u.trustScore}%</td>
      <td style="padding:12px 16px;font-size:13px;color:#64748b">${u.contributions}</td>
    </tr>
  `).join('');

  const solved = requests.filter(r => r.status === 'Solved').length;
  const open = requests.filter(r => r.status === 'Open').length;
  const high = requests.filter(r => r.urgency === 'High').length;

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Admin Panel</p>
      <h1 class="hero-h1">Platform management and overview.</h1>
      <p class="hero-sub">Manage requests, view users, and monitor community analytics.</p>
    </div>

    <!-- Analytics row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px">
      ${[
        { label: 'Total Requests', value: requests.length, color: '#2563eb' },
        { label: 'Solved', value: solved, color: '#059669' },
        { label: 'Open', value: open, color: '#d97706' },
        { label: 'High Urgency', value: high, color: '#dc2626' },
      ].map(s => `
        <div class="card" style="padding:20px;text-align:center">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">${s.label}</p>
          <p style="font-size:32px;font-weight:900;color:${s.color}">${s.value}</p>
        </div>
      `).join('')}
    </div>

    <!-- Requests table -->
    <div class="card" style="margin-bottom:24px;overflow:hidden">
      <div style="padding:24px 24px 16px">
        <p class="section-label" style="margin-bottom:4px">Request Management</p>
        <h2 style="font-size:20px;font-weight:900;color:#1a1a1a">All requests</h2>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid #f1f5f9">
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Title</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Category</th>
              <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Urgency</th>
              <th style="padding:10px 8px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Status</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Author</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Actions</th>
            </tr>
          </thead>
          <tbody id="admin-req-tbody">${reqRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Users table -->
    <div class="card" style="overflow:hidden">
      <div style="padding:24px 24px 16px">
        <p class="section-label" style="margin-bottom:4px">User Management</p>
        <h2 style="font-size:20px;font-weight:900;color:#1a1a1a">All members</h2>
      </div>
      <div style="overflow-x:auto">
        <table style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid #f1f5f9">
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Name</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Role</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Location</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Trust</th>
              <th style="padding:10px 16px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#94a3b8;text-align:left">Contributions</th>
            </tr>
          </thead>
          <tbody>${userRows}</tbody>
        </table>
      </div>
    </div>
  `;

  const init = () => {
    window.adminSolve = (reqId) => {
      const req = getRequests().find(r => r.id === reqId);
      if (req) {
        saveRequest({ ...req, status: 'Solved' });
        window.navigate('/admin');
      }
    };
  };

  return { html, init };
}
