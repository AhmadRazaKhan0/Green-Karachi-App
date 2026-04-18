import { Link, useLocation } from "wouter";
import Layout from "@/components/Layout";
import { getCurrentUser, getRequests, getUsers } from "@/lib/storage";
import { getAIInsights } from "@/lib/ai-engine";
import { PlusCircle, Compass, CheckCircle, Star, MessageCircle, Users } from "lucide-react";
import { useEffect, useState } from "react";

const urgencyColor: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Solved: "bg-emerald-100 text-emerald-700",
  Open: "border border-primary text-primary bg-transparent",
};

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [user] = useState(getCurrentUser());
  const requests = getRequests();
  const users = getUsers();

  useEffect(() => {
    if (!user) setLocation("/login");
  }, [user, setLocation]);

  if (!user) return null;

  const myRequests = requests.filter((r) => r.authorId === user.id);
  const solvedCount = myRequests.filter((r) => r.status === "Solved").length;
  const helperCount = requests.filter((r) => r.helpers.includes(user.id)).length;
  const insights = getAIInsights(requests.map((r) => ({ category: r.category, urgency: r.urgency })));

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown";

  const recentRequests = requests.slice(0, 4);

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Messages", href: "/messages" },
      { label: "Notifications", href: "/notifications" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="bg-[#1a2332] rounded-2xl p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">DASHBOARD</p>
          <h1 className="text-3xl font-black mb-1">Welcome back, {user.name.split(" ")[0]}.</h1>
          <p className="text-[#9ab] text-sm">{user.role} · {user.location} · Trust score {user.trustScore}%</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <MessageCircle size={20} className="text-primary" />, label: "Total Requests", value: myRequests.length, desc: "requests submitted" },
            { icon: <CheckCircle size={20} className="text-emerald-500" />, label: "Solved", value: solvedCount, desc: "problems resolved" },
            { icon: <Users size={20} className="text-blue-500" />, label: "Helped Others", value: helperCount, desc: "active contributions" },
            { icon: <Star size={20} className="text-amber-500" />, label: "Trust Score", value: `${user.trustScore}%`, desc: "community reputation" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              <div className="mb-3">{stat.icon}</div>
              <p className="text-2xl font-black text-foreground">{stat.value}</p>
              <p className="text-xs font-semibold text-foreground mt-0.5">{stat.label}</p>
              <p className="text-xs text-muted-foreground">{stat.desc}</p>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 flex-wrap">
          <Link href="/create-request" data-testid="btn-create-request"
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
            <PlusCircle size={16} />
            Create Request
          </Link>
          <Link href="/explore" data-testid="btn-explore-feed"
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
            <Compass size={16} />
            Explore Feed
          </Link>
          <Link href="/ai-center" data-testid="btn-ai-center"
            className="flex items-center gap-2 px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
            AI Center
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Requests */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">RECENT REQUESTS</p>
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <Link key={req.id} href={`/request/${req.id}`} className="block group">
                  <div className="p-4 rounded-xl border border-border hover:bg-secondary transition-all">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[11px] font-medium rounded-full">{req.category}</span>
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${urgencyColor[req.urgency]}`}>{req.urgency}</span>
                          <span className={`px-2 py-0.5 text-[11px] font-medium rounded-full ${statusColor[req.status]}`}>{req.status}</span>
                        </div>
                        <p className="font-semibold text-foreground text-sm truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground">{getUserName(req.authorId)} · {req.helpers.length} helper interested</p>
                      </div>
                      <span className="text-xs text-primary font-medium group-hover:underline shrink-0">View</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* AI Insights */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">AI INSIGHTS</p>
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <p className="text-xs text-emerald-600 font-medium">Trending category</p>
                  <p className="text-sm font-bold text-foreground">{insights.topCategory}</p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl border border-red-200">
                  <p className="text-xs text-red-600 font-medium">Urgent requests</p>
                  <p className="text-sm font-bold text-foreground">{insights.highUrgencyCount} need attention</p>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  You are most active in <strong>{user.skills[0]}</strong> support. Consider checking the {insights.topCategory} requests in your area.
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">YOUR BADGES</p>
              <div className="flex flex-wrap gap-2">
                {user.badges.map((badge) => (
                  <span key={badge} className="px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">{badge}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
