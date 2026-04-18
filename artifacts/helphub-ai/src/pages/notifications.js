import { getNotifications, markAllRead } from '../lib/storage.js';

export function renderNotifications() {
  const notifs = getNotifications();

  function renderList(ns) {
    if (!ns.length) return `<p style="color:#94a3b8;font-size:13px;padding:20px">No notifications yet.</p>`;
    return ns.map(n => `
      <div class="notif-row">
        <div style="flex:1;min-width:0">
          <p style="font-size:14px;font-weight:${n.read ? '500' : '600'};color:${n.read ? '#64748b' : '#1a1a1a'};margin-bottom:4px;line-height:1.4">${n.title}</p>
          <p style="font-size:12px;color:#94a3b8">${n.subtitle} &bull; ${n.timestamp}</p>
        </div>
        <span style="flex-shrink:0;margin-left:20px;font-size:12px;font-weight:700;color:${n.read ? '#94a3b8' : '#0d9488'};padding:4px 10px;border-radius:20px;background:${n.read ? 'transparent' : 'rgba(13,148,136,0.08)'}">
          ${n.read ? 'Read' : 'Unread'}
        </span>
      </div>
    `).join('');
  }

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Notifications</p>
      <h1 class="hero-h1">Stay updated on requests, helpers, and trust signals.</h1>
      <p class="hero-sub">Live updates from your activity across the Helplytics AI community.</p>
    </div>

    <div class="card" style="overflow:hidden">
      <div style="padding:24px 24px 16px;display:flex;align-items:center;justify-content:space-between">
        <div>
          <p class="section-label" style="margin-bottom:4px">Live Updates</p>
          <h2 style="font-size:22px;font-weight:900;color:#1a1a1a">Notification feed</h2>
        </div>
        <button id="btn-mark-all" class="btn-outline" style="font-size:13px">Mark all read</button>
      </div>
      <div id="notif-list" style="padding:0 24px 24px">${renderList(notifs)}</div>
    </div>
  `;

  const init = () => {
    document.getElementById('btn-mark-all').addEventListener('click', () => {
      markAllRead();
      document.getElementById('notif-list').innerHTML = renderList(getNotifications());
    });
  };

  return { html, init };
}
