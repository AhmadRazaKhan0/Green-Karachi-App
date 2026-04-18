import { getRequestById, getUsers, getCurrentUser, saveRequest, addNotification } from '../lib/storage.js';
import { getAISummary } from '../lib/ai-engine.js';

export function renderRequestDetail(id) {
  const req = getRequestById(id);
  const users = getUsers();
  const currentUser = getCurrentUser();

  if (!req) {
    return {
      html: `<div style="text-align:center;padding:80px 20px">
        <p style="font-size:20px;font-weight:900;margin-bottom:12px">Request not found</p>
        <button class="btn-primary" onclick="navigate('/explore')">Back to explore</button>
      </div>`,
      init: null
    };
  }

  const author = users.find(u => u.id === req.authorId);
  const helpers = users.filter(u => req.helpers.includes(u.id));
  const alreadyHelping = currentUser && req.helpers.includes(currentUser.id);
  const aiSummary = getAISummary(req);

  const urgencyBadge = u => {
    const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return `<span class="badge ${map[u] || 'badge-low'}">${u}</span>`;
  };
  const statusBadge = s => `<span class="badge ${s === 'Solved' ? 'badge-solved' : 'badge-open'}">${s}</span>`;
  const catBadge = c => {
    const map = { 'Web Development': 'badge-category', 'Design': 'badge-design', 'Career': 'badge-career' };
    return `<span class="badge ${map[c] || 'badge-category'}">${c}</span>`;
  };

  const helperCards = helpers.map(h => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:36px;height:36px;border-radius:50%;background:${h.avatarColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:13px;flex-shrink:0">${h.initials}</div>
        <div>
          <p style="font-size:14px;font-weight:600;color:#1a1a1a">${h.name}</p>
          <p style="font-size:12px;color:#94a3b8">${h.skills.slice(0, 3).join(', ')}</p>
        </div>
      </div>
      <span style="padding:4px 10px;background:rgba(13,148,136,0.08);color:#0d9488;border-radius:20px;font-size:12px;font-weight:700;border:1px solid rgba(13,148,136,0.2)">Trust ${h.trustScore}%</span>
    </div>
  `).join('') || `<p style="color:#94a3b8;font-size:13px;padding:12px 0">No helpers yet. Be the first to offer help.</p>`;

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Request Detail</p>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">
        ${catBadge(req.category)} ${urgencyBadge(req.urgency)} ${statusBadge(req.status)}
      </div>
      <h1 class="hero-h1">${req.title}</h1>
      <p class="hero-sub">${req.description}</p>
    </div>

    <div class="two-third-layout">
      <!-- Left -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- AI Summary -->
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:14px">AI Summary</p>
          <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:14px">
            <div style="width:36px;height:36px;background:#0d9488;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:14px;flex-shrink:0">L</div>
            <div>
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:6px">Helplytics AI</p>
              <p style="font-size:14px;color:#64748b;line-height:1.7">${aiSummary}</p>
            </div>
          </div>
          ${req.tags.length ? `<div style="display:flex;flex-wrap:wrap;gap:6px;padding-top:12px;border-top:1px solid #f1f5f9">${req.tags.map(t => `<span class="tag">${t}</span>`).join('')}</div>` : ''}
        </div>

        <!-- Actions -->
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:16px">Actions</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button id="btn-can-help" class="btn-primary" ${alreadyHelping ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
              ${alreadyHelping ? 'Already helping' : 'I can help'}
            </button>
            <button id="btn-mark-solved" class="btn-ghost" ${req.status === 'Solved' ? 'disabled style="opacity:0.5;cursor:not-allowed"' : ''}>
              ${req.status === 'Solved' ? 'Already solved' : 'Mark as solved'}
            </button>
          </div>
        </div>
      </div>

      <!-- Right -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <!-- Requester -->
        ${author ? `
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:14px">Requester</p>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;border-radius:50%;background:${author.avatarColor};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;flex-shrink:0">${author.initials}</div>
            <div>
              <p style="font-size:15px;font-weight:700;color:#1a1a1a">${author.name}</p>
              <p style="font-size:12px;color:#94a3b8">${author.role} &bull; ${author.location}</p>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Helpers -->
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:6px">Helpers</p>
          <h3 style="font-size:18px;font-weight:900;color:#1a1a1a;margin-bottom:16px">People ready to support</h3>
          ${helperCards}
        </div>

        <!-- Message -->
        <div class="card" style="padding:24px">
          <p class="section-label" style="margin-bottom:12px">Contact</p>
          <button onclick="navigate('/messages')" class="btn-outline" style="width:100%">Send a message</button>
        </div>
      </div>
    </div>
  `;

  const init = () => {
    const canHelpBtn = document.getElementById('btn-can-help');
    const solvedBtn = document.getElementById('btn-mark-solved');

    if (canHelpBtn && !alreadyHelping) {
      canHelpBtn.addEventListener('click', () => {
        if (!currentUser) { window.navigate('/login'); return; }
        const updated = { ...req, helpers: [...req.helpers, currentUser.id] };
        saveRequest(updated);
        addNotification({
          id: 'n_' + Date.now(),
          title: `${currentUser.name} offered help on "${req.title}"`,
          subtitle: 'Match',
          type: 'Match',
          read: false,
          timestamp: 'Just now',
        });
        window.navigate('/explore');
      });
    }

    if (solvedBtn && req.status !== 'Solved') {
      solvedBtn.addEventListener('click', () => {
        if (!currentUser) { window.navigate('/login'); return; }
        const updated = { ...req, status: 'Solved' };
        saveRequest(updated);
        addNotification({
          id: 'n_' + Date.now(),
          title: `"${req.title}" was marked as solved`,
          subtitle: 'Status',
          type: 'Status',
          read: false,
          timestamp: 'Just now',
        });
        window.navigate('/explore');
      });
    }
  };

  return { html, init };
}
