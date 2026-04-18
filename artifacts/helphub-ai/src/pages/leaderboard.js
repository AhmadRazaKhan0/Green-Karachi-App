import { getUsers } from '../lib/storage.js';

export function renderLeaderboard() {
  const users = getUsers().sort((a, b) => b.trustScore - a.trustScore);

  const rankings = users.map((u, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;${i < users.length - 1 ? 'border-bottom:1px solid #f1f5f9' : ''}">
      <div style="display:flex;align-items:center;gap:14px">
        <span style="font-size:13px;font-weight:700;color:#94a3b8;width:28px">#${i + 1}</span>
        <div style="width:36px;height:36px;border-radius:50%;background:${u.avatarColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0">${u.initials}</div>
        <div>
          <p style="font-size:14px;font-weight:700;color:#1a1a1a">${u.name}</p>
          <p style="font-size:12px;color:#94a3b8">${u.skills.slice(0, 3).join(', ')}</p>
        </div>
      </div>
      <div style="text-align:right">
        <p style="font-size:15px;font-weight:900;color:#1a1a1a">${u.trustScore}%</p>
        <p style="font-size:12px;color:#94a3b8">${u.contributions} contributions</p>
      </div>
    </div>
  `).join('');

  const badgeCards = users.map(u => {
    const pct = u.trustScore;
    const badgeColors = ['#f59e0b', '#10b981'];
    return `
      <div style="padding:20px 0;${u !== users[users.length - 1] ? 'border-bottom:1px solid #f1f5f9' : ''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div>
            <p style="font-size:14px;font-weight:700;color:#1a1a1a">${u.name}</p>
            <p style="font-size:12px;color:#94a3b8">${u.badges.join(' \u2022 ')}</p>
          </div>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" style="width:${pct}%"></div>
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Leaderboard</p>
      <h1 class="hero-h1">Recognize the people who keep the community moving.</h1>
      <p class="hero-sub">Trust score, contribution count, and badges create visible momentum for reliable helpers.</p>
    </div>

    <div class="two-col">
      <!-- Rankings -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:24px 24px 16px">
          <p class="section-label" style="margin-bottom:4px">Top Helpers</p>
          <h2 style="font-size:22px;font-weight:900;color:#1a1a1a">Rankings</h2>
        </div>
        ${rankings}
      </div>

      <!-- Badge System -->
      <div class="card" style="padding:24px">
        <p class="section-label" style="margin-bottom:4px">Badge System</p>
        <h2 style="font-size:22px;font-weight:900;color:#1a1a1a;margin-bottom:20px">Trust and achievement</h2>
        ${badgeCards}
      </div>
    </div>
  `;

  return { html, init: null };
}
