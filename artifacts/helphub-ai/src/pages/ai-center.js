import { getRequests, getUsers } from '../lib/storage.js';
import { getAISummary, detectCategory } from '../lib/ai-engine.js';

export function renderAICenter() {
  const requests = getRequests();
  const users = getUsers();

  const highUrgency = requests.filter(r => r.urgency === 'High' && r.status === 'Open').length;
  const trustedHelpers = users.filter(u => u.trustScore >= 80).length;

  const categoryCount = {};
  requests.forEach(r => { categoryCount[r.category] = (categoryCount[r.category] || 0) + 1; });
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Community';

  const catBadge = c => {
    const map = { 'Web Development': 'badge-category', 'Design': 'badge-design', 'Career': 'badge-career', 'Community': 'badge-community' };
    return `<span class="badge ${map[c] || 'badge-category'}">${c}</span>`;
  };
  const urgencyBadge = u => {
    const map = { High: 'badge-high', Medium: 'badge-medium', Low: 'badge-low' };
    return `<span class="badge ${map[u] || 'badge-low'}">${u}</span>`;
  };

  const recCards = requests.map(r => `
    <div style="padding:18px;border-bottom:1px solid #f1f5f9">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
        <p style="font-size:14px;font-weight:700;color:#1a1a1a;flex:1;min-width:0;padding-right:16px">${r.title}</p>
      </div>
      <p style="font-size:13px;color:#64748b;line-height:1.65;margin-bottom:10px">${getAISummary(r)}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap">${catBadge(r.category)} ${urgencyBadge(r.urgency)}</div>
    </div>
  `).join('');

  const html = `
    <div class="dark-hero">
      <p class="hero-label">AI Center</p>
      <h1 class="hero-h1">See what the platform intelligence is noticing.</h1>
      <p class="hero-sub">AI-like insights summarize demand trends, helper readiness, urgency signals, and request recommendations.</p>
    </div>

    <!-- Stat boxes -->
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:28px">
      <div class="card" style="padding:24px">
        <p class="section-label" style="margin-bottom:8px">Trend Pulse</p>
        <h2 style="font-size:28px;font-weight:900;color:#1a1a1a;margin-bottom:8px;line-height:1.1">${topCategory}</h2>
        <p style="font-size:13px;color:#64748b;line-height:1.65">Most common support area based on active community requests.</p>
      </div>
      <div class="card" style="padding:24px">
        <p class="section-label" style="margin-bottom:8px">Urgency Watch</p>
        <h2 style="font-size:48px;font-weight:900;color:#dc2626;margin-bottom:8px;line-height:1">${highUrgency || requests.filter(r => r.urgency === 'High').length}</h2>
        <p style="font-size:13px;color:#64748b;line-height:1.65">Requests currently flagged high priority by the urgency detector.</p>
      </div>
      <div class="card" style="padding:24px">
        <p class="section-label" style="margin-bottom:8px">Mentor Pool</p>
        <h2 style="font-size:48px;font-weight:900;color:#0d9488;margin-bottom:8px;line-height:1">${trustedHelpers}</h2>
        <p style="font-size:13px;color:#64748b;line-height:1.65">Trusted helpers with strong response history and contribution signals.</p>
      </div>
    </div>

    <!-- AI Recommendations -->
    <div class="card" style="overflow:hidden">
      <div style="padding:24px 24px 16px">
        <p class="section-label" style="margin-bottom:4px">AI Recommendations</p>
        <h2 style="font-size:24px;font-weight:900;color:#1a1a1a">Requests needing attention</h2>
      </div>
      ${recCards}
    </div>
  `;

  return { html, init: null };
}
