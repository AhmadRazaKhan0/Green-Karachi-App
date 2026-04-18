import { getMessages, addMessage, getUsers, getCurrentUser } from '../lib/storage.js';

export function renderMessages() {
  const users = getUsers();
  const msgs = getMessages();

  const msgList = msgs.map(m => {
    const from = users.find(u => u.id === m.fromId);
    const to = users.find(u => u.id === m.toId);
    return `
      <div style="padding:16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
        <div style="flex:1;min-width:0">
          <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px">${from?.name || 'Unknown'} &rarr; ${to?.name || 'Unknown'}</p>
          <p style="font-size:13px;color:#64748b;line-height:1.6">${m.text}</p>
        </div>
        <span style="font-size:12px;color:#94a3b8;white-space:nowrap;flex-shrink:0">${m.timestamp}</span>
      </div>
    `;
  }).join('') || `<p style="color:#94a3b8;font-size:13px;padding:20px">No messages yet.</p>`;

  const userOptions = users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');

  const html = `
    <div class="dark-hero">
      <p class="hero-label">Interaction / Messaging</p>
      <h1 class="hero-h1">Keep support moving through direct communication.</h1>
      <p class="hero-sub">Basic messaging gives helpers and requesters a clear follow-up path once a match happens.</p>
    </div>

    <div class="two-col">
      <!-- Conversation Stream -->
      <div class="card" style="padding:0;overflow:hidden">
        <div style="padding:24px 24px 16px">
          <p class="section-label" style="margin-bottom:4px">Conversation Stream</p>
          <h2 style="font-size:22px;font-weight:900;color:#1a1a1a">Recent messages</h2>
        </div>
        <div id="msg-list">${msgList}</div>
      </div>

      <!-- Send Message -->
      <div class="card" style="padding:28px">
        <p class="section-label" style="margin-bottom:4px">Send Message</p>
        <h2 style="font-size:clamp(22px,2.5vw,30px);font-weight:900;color:#1a1a1a;margin-bottom:24px;line-height:1.2">Start a conversation</h2>

        <form id="msg-form" style="display:flex;flex-direction:column;gap:18px">
          <div>
            <label class="form-label">To</label>
            <select id="msg-to" class="form-input">${userOptions}</select>
          </div>
          <div>
            <label class="form-label">Message</label>
            <textarea id="msg-text" class="form-input" rows="5" placeholder="Share support details, ask for files, or suggest next steps." style="resize:vertical"></textarea>
          </div>
          <button type="submit" class="btn-primary" style="padding:14px;font-size:15px">Send</button>
        </form>
      </div>
    </div>
  `;

  const init = () => {
    document.getElementById('msg-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getCurrentUser();
      const toId = document.getElementById('msg-to').value;
      const text = document.getElementById('msg-text').value.trim();
      if (!text) return;

      const fromId = user?.id || 'user_1';
      addMessage({
        id: 'msg_' + Date.now(),
        fromId,
        toId,
        text,
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      });
      document.getElementById('msg-text').value = '';

      const msgs = getMessages();
      document.getElementById('msg-list').innerHTML = msgs.map(m => {
        const from = users.find(u => u.id === m.fromId);
        const to = users.find(u => u.id === m.toId);
        return `
          <div style="padding:16px;border-bottom:1px solid #f1f5f9;display:flex;align-items:flex-start;justify-content:space-between;gap:16px">
            <div style="flex:1;min-width:0">
              <p style="font-size:14px;font-weight:600;color:#1a1a1a;margin-bottom:4px">${from?.name || 'Unknown'} &rarr; ${to?.name || 'Unknown'}</p>
              <p style="font-size:13px;color:#64748b;line-height:1.6">${m.text}</p>
            </div>
            <span style="font-size:12px;color:#94a3b8;white-space:nowrap;flex-shrink:0">${m.timestamp}</span>
          </div>
        `;
      }).join('');
    });
  };

  return { html, init };
}
