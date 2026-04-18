import { initStorage, getCurrentUser, logout } from './lib/storage.js';

import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderOnboarding } from './pages/onboarding.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderExplore } from './pages/explore.js';
import { renderCreateRequest } from './pages/create-request.js';
import { renderRequestDetail } from './pages/request-detail.js';
import { renderMessages } from './pages/messages.js';
import { renderLeaderboard } from './pages/leaderboard.js';
import { renderAICenter } from './pages/ai-center.js';
import { renderNotifications } from './pages/notifications.js';
import { renderProfile } from './pages/profile.js';
import { renderAdmin } from './pages/admin.js';

initStorage();

export function navigate(path) {
  window.location.hash = '#' + path;
}

window.navigate = navigate;

function getPath() {
  const hash = window.location.hash.slice(1);
  return hash || '/';
}

function renderNav(path) {
  const user = getCurrentUser();
  const navEl = document.getElementById('navbar');

  const publicLinks = [
    { label: 'Home', path: '/' },
    { label: 'Explore', path: '/explore' },
    { label: 'Leaderboard', path: '/leaderboard' },
    { label: 'AI Center', path: '/ai-center' },
  ];

  const authLinks = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Explore', path: '/explore' },
    { label: 'Messages', path: '/messages' },
  ];

  const links = user ? authLinks : publicLinks;

  const linksHtml = links.map(l => `
    <button class="nav-link ${path === l.path ? 'active' : ''}" onclick="navigate('${l.path}')">
      ${l.label}
    </button>
  `).join('');

  const rightHtml = user
    ? `
      <button class="nav-bell" onclick="navigate('/notifications')" title="Notifications">&#128276;</button>
      <button class="nav-user" onclick="navigate('/profile')">
        <div class="nav-avatar" style="background:${user.avatarColor}">${user.initials}</div>
        <span class="nav-user-name">${user.name.split(' ')[0]}</span>
      </button>
    `
    : `
      <span class="nav-badge-live">Live community signals</span>
      <button class="nav-join" onclick="navigate('/login')">Join the platform</button>
    `;

  navEl.innerHTML = `
    <div class="nav-inner">
      <button class="nav-logo" onclick="navigate('/')">
        <div class="nav-logo-icon">L</div>
        <span class="nav-logo-text">Helplytics AI</span>
      </button>
      <div class="nav-links">
        ${linksHtml}
        ${rightHtml}
      </div>
    </div>
  `;
}

function renderPage(path) {
  const app = document.getElementById('app');

  if (path === '/') {
    const { html, init } = renderLanding();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/login') {
    const { html, init } = renderLogin();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/onboarding') {
    const { html, init } = renderOnboarding();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/dashboard') {
    const { html, init } = renderDashboard();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/explore') {
    const { html, init } = renderExplore();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/create-request') {
    const { html, init } = renderCreateRequest();
    app.innerHTML = html;
    if (init) init();
  } else if (path.startsWith('/request/')) {
    const id = path.split('/')[2];
    const { html, init } = renderRequestDetail(id);
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/messages') {
    const { html, init } = renderMessages();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/leaderboard') {
    const { html, init } = renderLeaderboard();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/ai-center') {
    const { html, init } = renderAICenter();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/notifications') {
    const { html, init } = renderNotifications();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/profile') {
    const { html, init } = renderProfile();
    app.innerHTML = html;
    if (init) init();
  } else if (path === '/admin') {
    const { html, init } = renderAdmin();
    app.innerHTML = html;
    if (init) init();
  } else {
    app.innerHTML = `<div style="text-align:center;padding:80px 20px">
      <h2 style="font-size:24px;font-weight:900;margin-bottom:12px">Page not found</h2>
      <button class="btn-primary" onclick="navigate('/')">Go home</button>
    </div>`;
  }
  window.scrollTo(0, 0);
}

function router() {
  const path = getPath();
  renderNav(path);
  renderPage(path);
}

window.addEventListener('hashchange', router);
router();
