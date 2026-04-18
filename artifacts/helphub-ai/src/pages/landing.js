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

export function renderLanding() {
  const requests = getRequests().slice(0, 3);
  const users = getUsers();
  const getName = id => users.find(u => u.id === id)?.name || 'Unknown';
  const getLoc = id => users.find(u => u.id === id)?.location || '';

  const requestCards = requests.map(r => `
    <div class="request-card">
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
        ${catBadge(r.category)} ${urgencyBadge(r.urgency)} ${statusBadge(r.status)}
      </div>
      <h3 style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:6px;line-height:1.4">${r.title}</h3>
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${r.description}</p>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <p style="font-size:13px;font-weight:600;color:#1a1a1a">${getName(r.authorId)}</p>
          <p style="font-size:12px;color:#94a3b8">${getLoc(r.authorId)} &bull; ${r.helpers.length} helper interested</p>
        </div>
        <button onclick="navigate('/request/${r.id}')" style="font-size:13px;font-weight:600;color:#0d9488;background:none;border:none;cursor:pointer;padding:4px 8px;border-radius:6px;transition:background 0.15s" onmouseover="this.style.background='rgba(13,148,136,0.08)'" onmouseout="this.style.background='none'">Open details</button>
      </div>
    </div>
  `).join('');

  const html = `
    <!-- Hero -->
    <div class="two-col" style="margin-bottom:32px">
      <div class="dark-hero" style="margin-bottom:0">
        <h1 class="hero-h1">Find help faster.<br>Become help that matters.</h1>
        <p class="hero-sub" style="max-width:380px;margin-bottom:32px">
          Helplytics AI is a community-powered support network for students, mentors, creators, and builders. Ask for help, offer help, track impact, and let AI surface smarter matches across the platform.
        </p>
        <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:36px">
          <button class="btn-primary" onclick="navigate('/login')">Open product demo</button>
          <button onclick="navigate('/create-request')" style="padding:10px 20px;background:rgba(255,255,255,0.1);color:#fff;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;border:1.5px solid rgba(255,255,255,0.2);transition:background 0.15s" onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'">Post a request</button>
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0">
          <div class="stat-box">
            <p class="stat-label">Members</p>
            <p class="stat-value">384+</p>
            <p class="stat-desc">Students, mentors, and helpers</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">Requests</p>
            <p class="stat-value">72+</p>
            <p class="stat-desc">Support posts shared</p>
          </div>
          <div class="stat-box">
            <p class="stat-label">Solved</p>
            <p class="stat-value">69+</p>
            <p class="stat-desc">Problems resolved</p>
          </div>
        </div>
      </div>

      <div class="dark-hero" style="margin-bottom:0">
        <p class="hero-label">Live Product Feel</p>
        <h2 style="font-size:clamp(24px,3vw,36px);font-weight:900;line-height:1.2;margin-bottom:14px">
          More than a form.<br>More like an ecosystem.
        </h2>
        <p class="hero-sub" style="margin-bottom:28px">
          A polished multi-page experience inspired by product platforms, with AI summaries, trust scores, contribution signals, and leaderboard momentum built directly in HTML, CSS, JavaScript, and LocalStorage.
        </p>
        <div style="display:flex;flex-direction:column;gap:16px">
          <div>
            <p style="font-weight:700;color:#fff;margin-bottom:4px;font-size:14px">AI request intelligence</p>
            <p style="font-size:13px;color:#94a3b8;line-height:1.6">Auto-categorization, urgency detection, tags, rewrite suggestions, and trend snapshots.</p>
          </div>
          <div>
            <p style="font-weight:700;color:#fff;margin-bottom:4px;font-size:14px">Community trust graph</p>
            <p style="font-size:13px;color:#94a3b8;line-height:1.6">Badges, helper rankings, trust score boosts, and visible contribution history.</p>
          </div>
          <div>
            <p style="font-weight:700;color:#fff;margin-bottom:4px;font-size:14px">100%</p>
            <p style="font-size:13px;color:#94a3b8;line-height:1.6">Top trust score currently active across the sample mentor network.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Core Flow -->
    <div style="margin-bottom:40px">
      <p class="section-label">Core Flow</p>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
        <h2 class="section-title">From struggling alone to solving together</h2>
        <button onclick="navigate('/onboarding')" style="padding:8px 16px;border:1.5px solid rgba(0,0,0,0.15);border-radius:10px;font-size:13px;font-weight:600;background:none;cursor:pointer;white-space:nowrap;margin-left:16px;transition:background 0.15s" onmouseover="this.style.background='rgba(0,0,0,0.04)'" onmouseout="this.style.background='none'">Try onboarding AI</button>
      </div>
      <div class="three-col">
        ${[
          { icon: '&#128172;', title: 'Ask for help clearly', desc: 'Create structured requests with category, urgency, AI suggestions, and tags that attract the right people.' },
          { icon: '&#128101;', title: 'Discover the right people', desc: 'Use the explore feed, helper lists, notifications, and messaging to move quickly once a match happens.' },
          { icon: '&#9989;', title: 'Track real contribution', desc: 'Trust scores, badges, solved requests, and rankings help the community recognize meaningful support.' },
        ].map(s => `
          <div class="card" style="padding:24px">
            <div style="font-size:24px;margin-bottom:14px">${s.icon}</div>
            <h3 style="font-weight:700;color:#1a1a1a;margin-bottom:8px;font-size:15px">${s.title}</h3>
            <p style="color:#64748b;font-size:13px;line-height:1.7">${s.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Featured Requests -->
    <div>
      <p class="section-label">Featured Requests</p>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px">
        <h2 class="section-title">Community problems currently in motion</h2>
        <button onclick="navigate('/explore')" style="padding:8px 16px;border:1.5px solid rgba(0,0,0,0.15);border-radius:10px;font-size:13px;font-weight:600;background:none;cursor:pointer;white-space:nowrap;margin-left:16px;transition:background 0.15s" onmouseover="this.style.background='rgba(0,0,0,0.04)'" onmouseout="this.style.background='none'">View full feed</button>
      </div>
      <div class="three-col">${requestCards}</div>
    </div>

    <p class="footer-text">Helplytics AI is built as a premium-feel, multi-page community support product using HTML, CSS, JavaScript, and LocalStorage.</p>
  `;

  return { html, init: null };
}
