import { getCurrentUser, saveUser } from '../lib/storage.js';

export function renderProfile() {
  const user = getCurrentUser();

  if (!user) {
    return {
      html: `<div style="text-align:center;padding:80px 20px">
        <h2 style="font-size:22px;font-weight:900;margin-bottom:12px">Not logged in</h2>
        <button class="btn-primary" onclick="navigate('/login')">Log in</button>
      </div>`,
      init: null
    };
  }

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Profile</p>
      <h1 class="hero-h1">${user.name}</h1>
      <p class="hero-sub">${user.role} &bull; ${user.location}</p>
    </div>

    <div class="two-col">
      <!-- Public Profile -->
      <div class="card" style="padding:28px">
        <p class="section-label" style="margin-bottom:4px">Public Profile</p>
        <h2 style="font-size:24px;font-weight:900;color:#1a1a1a;margin-bottom:24px">Skills and reputation</h2>

        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9">
          <span style="font-size:14px;color:#64748b">Trust score</span>
          <span style="font-size:14px;font-weight:700;color:#0d9488">${user.trustScore}%</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f5f9">
          <span style="font-size:14px;color:#64748b">Contributions</span>
          <span style="font-size:14px;font-weight:700;color:#1a1a1a">${user.contributions}</span>
        </div>

        <div style="padding:16px 0;border-bottom:1px solid #f1f5f9">
          <p style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:10px">Skills</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${user.skills.map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
        </div>

        <div style="padding:16px 0">
          <p style="font-size:13px;font-weight:600;color:#1a1a1a;margin-bottom:10px">Badges</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            ${user.badges.map(b => `<span style="padding:4px 12px;background:rgba(13,148,136,0.08);color:#0d9488;border-radius:20px;font-size:12px;font-weight:600;border:1px solid rgba(13,148,136,0.2)">${b}</span>`).join('')}
          </div>
        </div>
      </div>

      <!-- Edit Profile -->
      <div class="card" style="padding:28px">
        <p class="section-label" style="margin-bottom:4px">Edit Profile</p>
        <h2 style="font-size:clamp(22px,2.5vw,30px);font-weight:900;color:#1a1a1a;margin-bottom:24px;line-height:1.2">Update your identity</h2>

        <form id="profile-form" style="display:flex;flex-direction:column;gap:18px">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
            <div>
              <label class="form-label">Name</label>
              <input type="text" id="p-name" class="form-input" value="${user.name}" />
            </div>
            <div>
              <label class="form-label">Location</label>
              <input type="text" id="p-location" class="form-input" value="${user.location}" />
            </div>
          </div>
          <div>
            <label class="form-label">Skills</label>
            <input type="text" id="p-skills" class="form-input" value="${user.skills.join(', ')}" />
          </div>
          <div>
            <label class="form-label">Interests</label>
            <input type="text" id="p-interests" class="form-input" value="${user.interests.join(', ')}" />
          </div>
          <button type="submit" class="btn-primary" style="padding:13px;font-size:15px">Save profile</button>
        </form>

        <div id="save-success" style="display:none;margin-top:12px;padding:10px 16px;background:#ecfdf5;color:#059669;border-radius:8px;font-size:13px;font-weight:600">
          Profile saved successfully.
        </div>
      </div>
    </div>
  `;

  const init = () => {
    document.getElementById('profile-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const updated = {
        ...user,
        name: document.getElementById('p-name').value,
        location: document.getElementById('p-location').value,
        skills: document.getElementById('p-skills').value.split(',').map(s => s.trim()).filter(Boolean),
        interests: document.getElementById('p-interests').value.split(',').map(s => s.trim()).filter(Boolean),
      };
      saveUser(updated);
      const msg = document.getElementById('save-success');
      msg.style.display = 'block';
      setTimeout(() => { msg.style.display = 'none'; }, 2500);
    });
  };

  return { html, init };
}
