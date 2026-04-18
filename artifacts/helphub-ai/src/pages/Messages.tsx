import { useState } from "react";
import Layout from "@/components/Layout";
import { getMessages, getUsers, getCurrentUser, addMessage } from "@/lib/storage";
import { Send } from "lucide-react";

export default function Messages() {
  const [messages, setMessages] = useState(getMessages());
  const users = getUsers();
  const currentUser = getCurrentUser();
  const [toId, setToId] = useState(users.filter((u) => u.id !== currentUser?.id)[0]?.id || "");
  const [text, setText] = useState("");

  const getName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown";

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !text.trim()) return;
    const msg = {
      id: `msg_${Date.now()}`,
      fromId: currentUser.id,
      toId,
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
    };
    addMessage(msg);
    setMessages(getMessages());
    setText("");
  };

  const otherUsers = users.filter((u) => u.id !== currentUser?.id);

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Messages", href: "/messages" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">INTERACTION / MESSAGING</p>
          <h1 className="text-3xl font-black mb-2">Keep support moving through direct communication.</h1>
          <p className="text-[#9ab] text-sm">Basic messaging gives helpers and requesters a clear follow-up path once a match happens.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversation Stream */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">CONVERSATION STREAM</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Recent messages</h2>
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-muted-foreground text-sm">No messages yet. Start a conversation!</p>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className="p-4 rounded-xl border border-border hover:bg-secondary/50 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-sm text-foreground">
                        {getName(msg.fromId)} <span className="text-muted-foreground font-normal">to</span> {getName(msg.toId)}
                      </p>
                      <div className="w-9 h-9 bg-muted rounded-full flex items-center justify-center ml-3 shrink-0">
                        <p className="text-[10px] font-semibold text-muted-foreground text-center leading-tight">{msg.timestamp}</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Send Message */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">SEND MESSAGE</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Start a conversation</h2>
            <form onSubmit={handleSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">To</label>
                <select value={toId} onChange={(e) => setToId(e.target.value)} data-testid="select-message-to"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white">
                  {otherUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                <textarea value={text} onChange={(e) => setText(e.target.value)} data-testid="input-message-text" rows={5}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Share support details, ask for files, or suggest next steps." />
              </div>
              <button type="submit" data-testid="btn-send-message"
                className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <Send size={16} />
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
