import { getCurrentUser, getRequests, getNotifications, getUsers } from '../lib/storage.js';

export function renderDashboard() {
  const user = getCurrentUser();
  if (!user) {
    return {
      html: `<div style="text-align:center;padding:80px 20px">
        <h2 style="font-size:22px;font-weight:900;margin-bottom:12px">You are not logged in</h2>
        <button class="btn-primary" onclick="navigate('/login')">Log in</button>
      </div>`,
      init: null
    };
  }

  const requests = getRequests();
  const myRequests = requests.filter(r => r.authorId === user.id);
  const helping = requests.filter(r => r.helpers.includes(user.id));
  const solved = myRequests.filter(r => r.status === 'Solved').length;
  const notifs = getNotifications().filter(n => !n.read).length;
  const users = getUsers();

  const urgencyBadge = u => {
    const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return `<span class="badge ${map[u] || 'badge-low'}">${u}</span>`;
  };
  const statusBadge = s => `<span class="badge ${s === 'Solved' ? 'badge-solved' : 'badge-open'}">${s}</span>`;
  const catBadge = c => {
    const map = { 'Web Development': 'badge-category', 'Design': 'badge-design', 'Career': 'badge-career' };
    return `<span class="badge ${map[c] || 'badge-category'}">${c}</span>`;
  };

  const recentReqs = requests.slice(0, 4).map(r => `
    <div style="display:flex;align-items:flex-start;justify-content:space-between;padding:14px 0;border-bottom:1px solid #f1f5f9">
      <div style="flex:1;min-width:0">
        <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px">${catBadge(r.category)} ${urgencyBadge(r.urgency)} ${statusBadge(r.status)}</div>
        <p style="font-size:14px;font-weight:600;color:#1a1a1a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.title}</p>
      </div>
      <button onclick="navigate('/request/${r.id}')" style="margin-left:16px;font-size:13px;font-weight:600;color:#0d9488;background:none;border:none;cursor:pointer;flex-shrink:0">Open</button>
    </div>
  `).join('');

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Dashboard</p>
      <h1 class="hero-h1">Welcome back, ${user.name.split(' ')[0]}.</h1>
      <p class="hero-sub">Track your requests, contributions, and community impact.</p>
    </div>

    <!-- Stats row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px">
      ${[
        { label: 'Trust Score', value: `${user.trustScore}%`, color: '#0d9488' },
        { label: 'Contributions', value: user.contributions, color: '#7c3aed' },
        { label: 'My Requests', value: myRequests.length, color: '#2563eb' },
        { label: 'Unread Notifs', value: notifs, color: '#d97706' },
      ].map(s => `
        <div class="card" style="padding:20px;text-align:center">
          <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">${s.label}</p>
          <p style="font-size:32px;font-weight:900;color:${s.color}">${s.value}</p>
        </div>
      `).join('')}
    </div>

    <div class="two-col">
      <!-- Recent Requests -->
      <div class="card" style="padding:24px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
          <div>
            <p class="section-label" style="margin-bottom:2px">Recent Activity</p>
            <h2 style="font-size:20px;font-weight:900;color:#1a1a1a">Community requests</h2>
          </div>
          <button onclick="navigate('/explore')" style="font-size:13px;font-weight:600;color:#0d9488;background:none;border:none;cursor:pointer;padding:6px 12px;border-radius:8px;border:1.5px solid rgba(13,148,136,0.25);transition:background 0.15s" onmouseover="this.style.background='rgba(13,148,136,0.06)'" onmouseout="this.style.background='none'">View all</button>
        </div>
        ${recentReqs}
      </div>

      <!-- Right column -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- User profile card -->
        <div class="card" style="padding:24px">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
            <div style="width:48px;height:48px;border-radius:50%;background:${user.avatarColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:16px;flex-shrink:0">${user.initials}</div>
            <div>
              <p style="font-weight:700;font-size:16px;color:#1a1a1a">${user.name}</p>
              <p style="font-size:13px;color:#64748b">${user.role} &bull; ${user.location}</p>
            </div>
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${user.skills.map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${user.badges.map(b => `<span style="padding:3px 10px;background:rgba(13,148,136,0.08);color:#0d9488;border-radius:20px;font-size:12px;font-weight:600;border:1px solid rgba(13,148,136,0.2)">${b}</span>`).join('')}
          </div>
          <button onclick="navigate('/profile')" class="btn-outline" style="width:100%;font-size:13px">Edit profile</button>
        </div>

        <!-- Quick Actions -->
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:14px">Quick Actions</p>
          <div style="display:flex;flex-direction:column;gap:10px">
            <button onclick="navigate('/create-request')" class="btn-primary" style="width:100%">Post a new request</button>
            <button onclick="navigate('/explore')" class="btn-outline" style="width:100%">Browse the feed</button>
            <button onclick="navigate('/ai-center')" class="btn-ghost" style="width:100%">View AI insights</button>
          </div>
        </div>

        <!-- AI Insight -->
        <div class="card" style="padding:24px;background:linear-gradient(135deg,#f0fdf9,#ecfdf5)">
          <p class="section-label" style="margin-bottom:8px">AI Insight</p>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:6px">Web Development is trending</p>
          <p style="font-size:13px;color:#64748b;line-height:1.65">Most active category this week with 2 high-urgency open requests waiting for helpers.</p>
        </div>
      </div>
    </div>
  `;

  return { html, init: null };
}
