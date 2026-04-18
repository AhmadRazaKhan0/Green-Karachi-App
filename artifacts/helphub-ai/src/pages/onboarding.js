import { getCurrentUser, saveUser } from '../lib/storage.js';
import { suggestHelperSkills, suggestNeedAreas } from '../lib/ai-engine.js';

export function renderOnboarding() {
  const user = getCurrentUser();

  if (!user) {
    return {
      html: `<div style="text-align:center;padding:80px 20px">
        <h2 style="font-size:22px;font-weight:900;margin-bottom:12px">Please log in first</h2>
        <button class="btn-primary" onclick="navigate('/login')">Log in</button>
      </div>`,
      init: null
    };
  }

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Onboarding</p>
      <h1 class="hero-h1">Set up your community profile.</h1>
      <p class="hero-sub">Tell us who you are and what you can do. AI will suggest where you can help and where you might need support.</p>
    </div>

    <div class="two-third-layout">
      <!-- Steps -->
      <div class="card" style="padding:32px">
        <!-- Progress bar -->
        <div style="display:flex;gap:6px;margin-bottom:32px" id="step-bars">
          ${[1,2,3,4].map(s => `<div id="bar-${s}" style="height:4px;flex:1;border-radius:99px;background:${s === 1 ? '#0d9488' : '#e2e8f0'};transition:background 0.3s"></div>`).join('')}
        </div>

        <!-- Step 1 -->
        <div id="step-1">
          <h2 style="font-size:20px;font-weight:900;color:#1a1a1a;margin-bottom:20px">Your identity</h2>
          <div style="display:flex;flex-direction:column;gap:16px">
            <div>
              <label class="form-label">Full Name</label>
              <input type="text" id="o-name" class="form-input" value="${user.name}" placeholder="Your name" />
            </div>
            <div>
              <label class="form-label">Location</label>
              <input type="text" id="o-location" class="form-input" value="${user.location}" placeholder="Karachi, Lahore, Remote..." />
            </div>
          </div>
        </div>

        <!-- Step 2 -->
        <div id="step-2" style="display:none">
          <h2 style="font-size:20px;font-weight:900;color:#1a1a1a;margin-bottom:20px">Your skills</h2>
          <div>
            <label class="form-label">Skills (comma-separated)</label>
            <input type="text" id="o-skills" class="form-input" value="${user.skills.join(', ')}" placeholder="React, Figma, Git/GitHub..." />
          </div>
          <div id="skill-tags" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:12px">
            ${user.skills.map(s => `<span class="tag">${s}</span>`).join('')}
          </div>
        </div>

        <!-- Step 3 -->
        <div id="step-3" style="display:none">
          <h2 style="font-size:20px;font-weight:900;color:#1a1a1a;margin-bottom:20px">Your interests</h2>
          <div>
            <label class="form-label">Interests (comma-separated)</label>
            <input type="text" id="o-interests" class="form-input" value="${user.interests.join(', ')}" placeholder="Hackathons, UI/UX, Community Building..." />
          </div>
        </div>

        <!-- Step 4 -->
        <div id="step-4" style="display:none">
          <h2 style="font-size:20px;font-weight:900;color:#1a1a1a;margin-bottom:20px">Review and complete</h2>
          <div style="display:flex;flex-direction:column;gap:0">
            ${[
              ['Name', 'o-name'],
              ['Location', 'o-location'],
              ['Skills', 'o-skills'],
              ['Interests', 'o-interests'],
            ].map(([label, id]) => `
              <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #f1f5f9">
                <span style="font-size:13px;color:#94a3b8">${label}</span>
                <span id="review-${id}" style="font-size:13px;font-weight:600;color:#1a1a1a;text-align:right;max-width:60%"></span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Nav buttons -->
        <div style="display:flex;gap:12px;margin-top:28px">
          <button id="btn-prev" class="btn-outline" style="display:none">Back</button>
          <button id="btn-next" class="btn-primary">Continue</button>
        </div>
      </div>

      <!-- AI Suggestions Panel -->
      <div style="display:flex;flex-direction:column;gap:20px">
        <div class="card" style="padding:24px">
          <p class="ai-panel-header">AI Suggestions</p>
          <h3 style="font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:16px">Based on your skills</h3>
          <div id="ai-suggestions">
            <p style="font-size:13px;color:#94a3b8">Type your skills in step 2 to see AI-powered suggestions here.</p>
          </div>
        </div>
      </div>
    </div>
  `;

  const init = () => {
    let step = 1;

    const updateBars = () => {
      [1,2,3,4].forEach(s => {
        document.getElementById('bar-' + s).style.background = s <= step ? '#0d9488' : '#e2e8f0';
      });
    };

    const showStep = () => {
      [1,2,3,4].forEach(s => {
        const el = document.getElementById('step-' + s);
        if (el) el.style.display = s === step ? 'block' : 'none';
      });
      const prevBtn = document.getElementById('btn-prev');
      const nextBtn = document.getElementById('btn-next');
      prevBtn.style.display = step > 1 ? 'block' : 'none';
      nextBtn.textContent = step < 4 ? 'Continue' : 'Complete Profile';
      updateBars();

      if (step === 2) {
        updateAI();
        const skillInput = document.getElementById('o-skills');
        skillInput.addEventListener('input', () => {
          const tags = skillInput.value.split(',').map(s => s.trim()).filter(Boolean);
          document.getElementById('skill-tags').innerHTML = tags.map(t => `<span class="tag">${t}</span>`).join('');
          updateAI(tags);
        });
      }

      if (step === 4) {
        document.getElementById('review-o-name').textContent = document.getElementById('o-name').value;
        document.getElementById('review-o-location').textContent = document.getElementById('o-location').value;
        document.getElementById('review-o-skills').textContent = document.getElementById('o-skills').value;
        document.getElementById('review-o-interests').textContent = document.getElementById('o-interests').value;
      }
    };

    const updateAI = (skills) => {
      const skillArr = skills || (document.getElementById('o-skills')?.value || '').split(',').map(s => s.trim()).filter(Boolean);
      const canHelp = suggestHelperSkills(skillArr);
      const needHelp = suggestNeedAreas(skillArr);

      document.getElementById('ai-suggestions').innerHTML = skillArr.length
        ? `
          <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">You can help with</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px">
            ${canHelp.map(s => `<span style="padding:4px 10px;background:#ecfdf5;color:#059669;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #bbf7d0">${s}</span>`).join('')}
          </div>
          <p style="font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#94a3b8;margin-bottom:8px">You might need help with</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            ${needHelp.map(s => `<span style="padding:4px 10px;background:#eff6ff;color:#2563eb;border-radius:20px;font-size:12px;font-weight:600;border:1px solid #bfdbfe">${s}</span>`).join('')}
          </div>
        `
        : `<p style="font-size:13px;color:#94a3b8">Type your skills in step 2 to see AI-powered suggestions here.</p>`;
    };

    document.getElementById('btn-next').addEventListener('click', () => {
      if (step < 4) {
        step++;
        showStep();
      } else {
        const updated = {
          ...user,
          name: document.getElementById('o-name').value,
          location: document.getElementById('o-location').value,
          skills: document.getElementById('o-skills').value.split(',').map(s => s.trim()).filter(Boolean),
          interests: document.getElementById('o-interests').value.split(',').map(s => s.trim()).filter(Boolean),
        };
        saveUser(updated);
        window.navigate('/dashboard');
      }
    });

    document.getElementById('btn-prev').addEventListener('click', () => {
      if (step > 1) { step--; showStep(); }
    });

    showStep();
  };

  return { html, init };
}
