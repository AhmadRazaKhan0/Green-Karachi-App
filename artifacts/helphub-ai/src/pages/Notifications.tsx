import Layout from "@/components/Layout";
import { getNotifications, markNotificationRead } from "@/lib/storage";
import { useState } from "react";

const typeBadge: Record<string, string> = {
  Status: "bg-blue-50 text-blue-700",
  Match: "bg-emerald-50 text-emerald-700",
  Request: "bg-purple-50 text-purple-700",
  Reputation: "bg-amber-50 text-amber-700",
  Insight: "bg-slate-50 text-slate-700",
};

export default function Notifications() {
  const [notifs, setNotifs] = useState(getNotifications());

  const handleRead = (id: string) => {
    markNotificationRead(id);
    setNotifs(getNotifications());
  };

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Notifications", href: "/notifications" },
    ]}>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">NOTIFICATIONS</p>
          <h1 className="text-3xl font-black mb-2">Stay updated on requests, helpers, and trust signals.</h1>
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">LIVE UPDATES</p>
          <h2 className="text-2xl font-black text-foreground mb-6">Notification feed</h2>

          <div className="divide-y divide-border">
            {notifs.map((notif) => (
              <div key={notif.id} data-testid={`notif-${notif.id}`}
                className="py-4 flex items-start justify-between gap-4 hover:bg-secondary/30 px-2 rounded-xl transition-all -mx-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-0.5 leading-relaxed">{notif.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full ${typeBadge[notif.type]}`}>
                      {notif.type}
                    </span>
                    <span className="text-xs text-muted-foreground">{notif.timestamp}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRead(notif.id)}
                  data-testid={`btn-notif-read-${notif.id}`}
                  className={`text-xs font-semibold px-3 py-1 rounded-full shrink-0 transition-all ${
                    notif.read
                      ? "text-muted-foreground"
                      : "text-primary bg-primary/10 hover:bg-primary/20"
                  }`}
                >
                  {notif.read ? "Read" : "Unread"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
