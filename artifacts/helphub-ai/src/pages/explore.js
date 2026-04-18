import { getRequests, getUsers } from '../lib/storage.js';

function urgencyBadge(u) {
  const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
  return `<span class="badge ${map[u] || 'badge-low'}">${u}</span>`;
}
function statusBadge(s) {
  return `<span class="badge ${s === 'Solved' ? 'badge-solved' : 'badge-open'}">${s}</span>`;
}
function catBadge(c) {
  const map = { 'Web Development': 'badge-category', 'Design': 'badge-design', 'Career': 'badge-career', 'Community': 'badge-community' };
  return `<span class="badge ${map[c] || 'badge-category'}">${c}</span>`;
}

export function renderExplore() {
  const users = getUsers();
  const getName = id => users.find(u => u.id === id)?.name || 'Unknown';
  const getLoc = id => users.find(u => u.id === id)?.location || '';

  function buildCards(reqs) {
    if (!reqs.length) return `<p style="color:#94a3b8;font-size:14px;padding:24px">No requests match your filters.</p>`;
    return reqs.map(r => `
      <div class="request-card" style="margin-bottom:16px">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
          ${catBadge(r.category)} ${urgencyBadge(r.urgency)} ${statusBadge(r.status)}
        </div>
        <h3 style="font-weight:700;font-size:15px;color:#1a1a1a;margin-bottom:6px;line-height:1.4">${r.title}</h3>
        <p style="color:#64748b;font-size:13px;line-height:1.65;margin-bottom:10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${r.description}</p>
        ${r.tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">${r.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        <div style="display:flex;align-items:center;justify-content:space-between;padding-top:12px;border-top:1px solid #f1f5f9">
          <div>
            <p style="font-size:13px;font-weight:600;color:#1a1a1a">${getName(r.authorId)}</p>
            <p style="font-size:12px;color:#94a3b8">${getLoc(r.authorId)} &bull; ${r.helpers.length} helper interested</p>
          </div>
          <button onclick="navigate('/request/${r.id}')" style="font-size:13px;font-weight:600;color:#0d9488;background:none;border:none;cursor:pointer;padding:6px 12px;border-radius:8px;transition:background 0.15s" onmouseover="this.style.background='rgba(13,148,136,0.08)'" onmouseout="this.style.background='none'">Open details</button>
        </div>
      </div>
    `).join('');
  }

  const requests = getRequests();

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Explore / Feed</p>
      <h1 class="hero-h1">Browse help requests with filterable community context.</h1>
      <p class="hero-sub">Filter by category, urgency, skills, and location to surface the best matches.</p>
    </div>

    <div class="sidebar-layout">
      <!-- Filters sidebar -->
      <div>
        <div class="card" style="padding:24px;position:sticky;top:76px">
          <p class="section-label" style="margin-bottom:4px">Filters</p>
          <h2 style="font-size:22px;font-weight:900;color:#1a1a1a;margin-bottom:24px">Refine the feed</h2>

          <div style="margin-bottom:20px">
            <label class="form-label">Category</label>
            <select id="filter-category" class="form-input">
              <option value="">All categories</option>
              <option>Web Development</option>
              <option>Design</option>
              <option>Career</option>
              <option>Community</option>
              <option>Data</option>
            </select>
          </div>
          <div style="margin-bottom:20px">
            <label class="form-label">Urgency</label>
            <select id="filter-urgency" class="form-input">
              <option value="">All urgency levels</option>
              <option>High</option>
              <option>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div style="margin-bottom:20px">
            <label class="form-label">Skills</label>
            <input type="text" id="filter-skills" class="form-input" placeholder="React, Figma, Git/GitHub" />
          </div>
          <div style="margin-bottom:24px">
            <label class="form-label">Location</label>
            <input type="text" id="filter-location" class="form-input" placeholder="Karachi, Lahore, Remote" />
          </div>
          <button id="btn-apply-filter" class="btn-primary" style="width:100%">Apply filters</button>
          <button id="btn-clear-filter" class="btn-ghost" style="width:100%;margin-top:8px">Clear</button>
        </div>
      </div>

      <!-- Request list -->
      <div id="request-list">${buildCards(requests)}</div>
    </div>
  `;

  const init = () => {
    const reqs = getRequests();
    const apply = () => {
      const cat = document.getElementById('filter-category').value;
      const urg = document.getElementById('filter-urgency').value;
      const skills = document.getElementById('filter-skills').value.toLowerCase();
      const loc = document.getElementById('filter-location').value.toLowerCase();

      const filtered = reqs.filter(r => {
        if (cat && r.category !== cat) return false;
        if (urg && r.urgency !== urg) return false;
        if (skills && !r.tags.some(t => t.toLowerCase().includes(skills)) && !r.category.toLowerCase().includes(skills)) return false;
        const uLoc = getUsers().find(u => u.id === r.authorId)?.location || '';
        if (loc && !uLoc.toLowerCase().includes(loc)) return false;
        return true;
      });
      document.getElementById('request-list').innerHTML = buildCards(filtered);
    };

    document.getElementById('btn-apply-filter').addEventListener('click', apply);
    document.getElementById('btn-clear-filter').addEventListener('click', () => {
      document.getElementById('filter-category').value = '';
      document.getElementById('filter-urgency').value = '';
      document.getElementById('filter-skills').value = '';
      document.getElementById('filter-location').value = '';
      document.getElementById('request-list').innerHTML = buildCards(reqs);
    });
  };

  return { html, init };
}
