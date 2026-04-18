import { getCurrentUser, saveRequest, addNotification } from '../lib/storage.js';
import { detectCategory, detectUrgency, suggestTags, rewriteRequest, getAISummary } from '../lib/ai-engine.js';

export function renderCreateRequest() {
  const html = `
    <div class="dark-hero">
      <p class="hero-label">Create Request</p>
      <h1 class="hero-h1">Turn a rough problem into a clear help request.</h1>
      <p class="hero-sub">Use built-in AI suggestions for category, urgency, tags, and a stronger description rewrite.</p>
    </div>

    <div class="two-third-layout">
      <!-- Form -->
      <div class="card" style="padding:32px">
        <form id="create-form" style="display:flex;flex-direction:column;gap:20px">
          <div>
            <label class="form-label">Title</label>
            <input type="text" id="req-title" class="form-input" placeholder="Need review on my JavaScript quiz app before submission" />
          </div>
          <div>
            <label class="form-label">Description</label>
            <textarea id="req-desc" class="form-input" rows="5" placeholder="Explain the challenge, your current progress, deadline, and what kind of help would be useful." style="resize:vertical"></textarea>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
            <div>
              <label class="form-label">Tags</label>
              <input type="text" id="req-tags" class="form-input" placeholder="JavaScript, Debugging, Review" />
            </div>
            <div>
              <label class="form-label">Category</label>
              <select id="req-category" class="form-input">
                <option>Web Development</option>
                <option>Design</option>
                <option>Career</option>
                <option>Data</option>
                <option>DevOps</option>
                <option>Community</option>
              </select>
            </div>
          </div>
          <div>
            <label class="form-label">Urgency</label>
            <select id="req-urgency" class="form-input">
              <option>High</option>
              <option selected>Medium</option>
              <option>Low</option>
            </select>
          </div>
          <div style="display:flex;gap:12px;flex-wrap:wrap">
            <button type="button" id="btn-ai-suggest" class="btn-outline">Apply AI suggestions</button>
            <button type="submit" class="btn-primary">Publish request</button>
          </div>
        </form>
      </div>

      <!-- AI Panel -->
      <div class="card" style="padding:28px">
        <p class="ai-panel-header">AI Assistant</p>
        <h2 style="font-size:clamp(20px,2.5vw,28px);font-weight:900;color:#1a1a1a;margin-bottom:24px;line-height:1.2">Smart request guidance</h2>

        <div style="display:flex;flex-direction:column;gap:16px">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid #f1f5f9">
            <span style="font-size:13px;color:#64748b;font-weight:500">Suggested category</span>
            <span id="ai-category" style="font-size:13px;font-weight:700;color:#1a1a1a">Community</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:14px;border-bottom:1px solid #f1f5f9">
            <span style="font-size:13px;color:#64748b;font-weight:500">Detected urgency</span>
            <span id="ai-urgency" style="font-size:13px;font-weight:700;color:#1a1a1a">Low</span>
          </div>
          <div style="padding-bottom:14px;border-bottom:1px solid #f1f5f9">
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#64748b;font-weight:500">Suggested tags</span>
            </div>
            <div id="ai-tags" style="font-size:13px;font-weight:600;color:#94a3b8">Add more detail for smarter tags</div>
          </div>
          <div>
            <div style="display:flex;justify-content:space-between;margin-bottom:8px">
              <span style="font-size:13px;color:#64748b;font-weight:500">Rewrite suggestion</span>
            </div>
            <div id="ai-rewrite" style="font-size:13px;font-weight:600;color:#94a3b8;line-height:1.6">Start describing the challenge to generate a stronger version.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  const init = () => {
    const titleEl = document.getElementById('req-title');
    const descEl = document.getElementById('req-desc');
    const categoryEl = document.getElementById('req-category');
    const urgencyEl = document.getElementById('req-urgency');
    const tagsEl = document.getElementById('req-tags');

    const updateAI = () => {
      const title = titleEl.value;
      const desc = descEl.value;
      const cat = detectCategory(title + ' ' + desc);
      const urg = detectUrgency(title + ' ' + desc);
      const tags = suggestTags(title, desc);
      const rewrite = rewriteRequest(title, desc);

      document.getElementById('ai-category').textContent = cat || 'Community';
      document.getElementById('ai-urgency').textContent = urg || 'Low';
      document.getElementById('ai-tags').innerHTML = tags.length
        ? tags.map(t => `<span class="tag" style="margin-right:6px;margin-bottom:4px">${t}</span>`).join('')
        : 'Add more detail for smarter tags';
      document.getElementById('ai-rewrite').textContent = rewrite || 'Start describing the challenge to generate a stronger version.';
    };

    titleEl.addEventListener('input', updateAI);
    descEl.addEventListener('input', updateAI);

    document.getElementById('btn-ai-suggest').addEventListener('click', () => {
      const title = titleEl.value;
      const desc = descEl.value;
      const cat = detectCategory(title + ' ' + desc);
      const urg = detectUrgency(title + ' ' + desc);
      const tags = suggestTags(title, desc);
      const rewrite = rewriteRequest(title, desc);

      categoryEl.value = cat || categoryEl.value;
      urgencyEl.value = urg || urgencyEl.value;
      if (tags.length) tagsEl.value = tags.join(', ');
      if (rewrite) descEl.value = rewrite;
      updateAI();
    });

    document.getElementById('create-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      if (!user) { window.navigate('/login'); return; }

      const id = 'req_' + Date.now();
      saveRequest({
        id,
        title: titleEl.value || 'Untitled Request',
        description: descEl.value,
        category: categoryEl.value,
        urgency: urgencyEl.value,
        status: 'Open',
        tags: tagsEl.value.split(',').map(t => t.trim()).filter(Boolean),
        authorId: user.id,
        helpers: [],
        createdAt: new Date().toISOString(),
      });
      addNotification({
        id: 'n_' + Date.now(),
        title: `Your request "${titleEl.value || 'Untitled Request'}" is now live in the community feed`,
        subtitle: 'Request',
        type: 'Request',
        read: false,
        timestamp: 'Just now',
      });
      window.navigate('/explore');
    });
  };

  return { html, init };
}
