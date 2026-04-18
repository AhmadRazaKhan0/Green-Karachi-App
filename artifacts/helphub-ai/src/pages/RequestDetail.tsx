import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { getRequestById, getUsers, getCurrentUser, saveRequest, addNotification } from "@/lib/storage";

const urgencyColor: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Solved: "bg-emerald-100 text-emerald-700",
  Open: "border border-primary text-primary bg-transparent",
};

interface Props {
  id: string;
}

export default function RequestDetail({ id }: Props) {
  const [, setLocation] = useLocation();
  const req = getRequestById(id);
  const users = getUsers();
  const currentUser = getCurrentUser();

  if (!req) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-foreground font-bold text-xl">Request not found</p>
          <a href="/explore" className="text-primary text-sm mt-2 block">Back to explore</a>
        </div>
      </Layout>
    );
  }

  const author = users.find((u) => u.id === req.authorId);
  const helpers = users.filter((u) => req.helpers.includes(u.id));
  const alreadyHelping = currentUser && req.helpers.includes(currentUser.id);

  const handleICanHelp = () => {
    if (!currentUser) { setLocation("/login"); return; }
    if (alreadyHelping) return;
    const updated = { ...req, helpers: [...req.helpers, currentUser.id] };
    saveRequest(updated);
    addNotification({
      id: `notif_${Date.now()}`,
      title: `${currentUser.name} offered help on "${req.title}"`,
      subtitle: "Match",
      type: "Match",
      read: false,
      timestamp: "Just now",
    });
    setLocation("/explore");
  };

  const handleMarkSolved = () => {
    if (!currentUser) { setLocation("/login"); return; }
    const updated = { ...req, status: "Solved" as const };
    saveRequest(updated);
    addNotification({
      id: `notif_${Date.now()}`,
      title: `"${req.title}" was marked as solved`,
      subtitle: "Status",
      type: "Status",
      read: false,
      timestamp: "Just now",
    });
    setLocation("/explore");
  };

  const aiSummary = req.category === "Web Development"
    ? `This is a Web Development request with ${req.urgency.toLowerCase()} urgency. Best suited for members with relevant expertise in responsive layouts, CSS, and frontend frameworks.`
    : req.category === "Design"
    ? `A visual design critique request where feedback on hierarchy, spacing, and messaging would create the most value.`
    : req.category === "Career"
    ? `Career coaching request focused on confidence-building, behavioral answers, and entry-level ${req.tags.includes("Frontend") ? "frontend" : ""} interviews.`
    : `Community support request. Best matched with members who have contributed to similar areas before.`;

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Messages", href: "/messages" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-4">REQUEST DETAIL</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-medium rounded-full border border-blue-500/20">{req.category}</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${urgencyColor[req.urgency]}`}>{req.urgency}</span>
            <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor[req.status]}`}>{req.status}</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black leading-tight mb-3">{req.title}</h1>
          <p className="text-[#9ab] text-sm">{req.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column */}
          <div className="lg:col-span-2 space-y-5">
            {/* AI Summary */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">AI SUMMARY</p>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">HelpHub AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed mt-1">{aiSummary}</p>
                </div>
              </div>
              {req.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {req.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 bg-secondary text-foreground text-xs rounded-full">{tag}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">ACTIONS</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={handleICanHelp} data-testid="btn-i-can-help" disabled={!!alreadyHelping}
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {alreadyHelping ? "Already helping" : "I can help"}
                </button>
                <button onClick={handleMarkSolved} data-testid="btn-mark-solved"
                  className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                  Mark as solved
                </button>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-5">
            {/* Requester */}
            {author && (
              <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">REQUESTER</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: author.avatarColor }}>
                    {author.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{author.name}</p>
                    <p className="text-xs text-muted-foreground">{author.location} · Trust {author.trustScore}%</p>
                  </div>
                </div>
              </div>
            )}

            {/* Helpers */}
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">HELPERS</p>
              <h3 className="font-bold text-foreground mb-4">People ready to support</h3>
              {helpers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No helpers yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {helpers.map((helper) => (
                    <div key={helper.id} className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ backgroundColor: helper.avatarColor }}>
                        {helper.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{helper.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{helper.skills.join(", ")}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 shrink-0">
                        Trust {helper.trustScore}%
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
