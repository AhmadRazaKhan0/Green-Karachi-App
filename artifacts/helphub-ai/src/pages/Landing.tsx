import { Link } from "wouter";
import Layout from "@/components/Layout";
import { getRequests, getUsers } from "@/lib/storage";
import { ArrowRight, Users, MessageCircle, CheckCircle, Zap, Shield, TrendingUp } from "lucide-react";

const urgencyColor: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Solved: "bg-emerald-100 text-emerald-700",
  Open: "border border-primary text-primary bg-transparent",
};

export default function Landing() {
  const requests = getRequests().slice(0, 3);
  const users = getUsers();

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown";
  const getUserLocation = (id: string) => users.find((u) => u.id === id)?.location || "";

  return (
    <Layout navItems={[
      { label: "Home", href: "/" },
      { label: "Explore", href: "/explore" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "AI Center", href: "/ai-center" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-16">

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#1a2332] rounded-2xl p-10 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-6">SMIT Grand Coding Night 2026</p>
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
              Find help faster.<br />Become help that matters.
            </h1>
            <p className="text-[#9ab] text-sm leading-relaxed mb-8 max-w-md">
              HelpHub AI is a community-powered support network for students, mentors, creators, and builders. Ask for help, offer help, track impact, and let AI surface smarter matches across the platform.
            </p>
            <div className="flex gap-3 flex-wrap mb-10">
              <Link href="/login" data-testid="btn-open-demo" className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                Open product demo
              </Link>
              <Link href="/create-request" data-testid="btn-post-request" className="px-5 py-2.5 border border-white/20 text-white text-sm font-semibold rounded-xl hover:bg-white/10 transition-all">
                Post a request
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "MEMBERS", value: "384+", desc: "Students, mentors, and helpers" },
                { label: "REQUESTS", value: "72+", desc: "Support posts shared" },
                { label: "SOLVED", value: "69+", desc: "Problems resolved" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9ab] mb-1">{stat.label}</p>
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="text-[11px] text-[#7a9] mt-1 leading-tight">{stat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#1a2332] rounded-2xl p-10 text-white">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">LIVE PRODUCT FEEL</p>
            <h2 className="text-3xl font-black leading-tight mb-4">
              More than a form.<br />More like an ecosystem.
            </h2>
            <p className="text-[#9ab] text-sm leading-relaxed mb-8">
              A polished multi-page experience inspired by product platforms, with AI summaries, trust scores, contribution signals, and leaderboard momentum built directly in.
            </p>
            <div className="space-y-3">
              {[
                {
                  icon: <Zap size={16} />,
                  title: "AI request intelligence",
                  desc: "Auto-categorization, urgency detection, tags, rewrite suggestions, and trend snapshots.",
                },
                {
                  icon: <Shield size={16} />,
                  title: "Community trust graph",
                  desc: "Badges, helper rankings, trust score boosts, and visible contribution history.",
                },
                {
                  icon: <TrendingUp size={16} />,
                  title: "100%",
                  desc: "Top trust score currently active across the sample mentor network.",
                },
              ].map((item) => (
                <div key={item.title} className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-1 text-emerald-400">
                    {item.icon}
                    <span className="font-semibold text-sm text-white">{item.title}</span>
                  </div>
                  <p className="text-[#9ab] text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Core Flow */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">CORE FLOW</p>
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-3xl font-black text-foreground">From struggling alone to solving together</h2>
            <Link href="/onboarding" className="px-4 py-2 border border-border text-sm font-medium rounded-xl text-foreground hover:bg-secondary transition-all whitespace-nowrap">
              Try onboarding AI
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                icon: <MessageCircle size={20} className="text-primary" />,
                title: "Ask for help clearly",
                desc: "Create structured requests with category, urgency, AI suggestions, and tags that attract the right people.",
              },
              {
                icon: <Users size={20} className="text-primary" />,
                title: "Discover the right people",
                desc: "Use the explore feed, helper lists, notifications, and messaging to move quickly once a match happens.",
              },
              {
                icon: <CheckCircle size={20} className="text-primary" />,
                title: "Track real contribution",
                desc: "Trust scores, badges, solved requests, and rankings help the community recognize meaningful support.",
              },
            ].map((step) => (
              <div key={step.title} className="bg-white rounded-2xl border border-border p-6 shadow-sm">
                <div className="mb-3">{step.icon}</div>
                <h3 className="font-bold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Requests */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">FEATURED REQUESTS</p>
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-3xl font-black text-foreground">Community problems currently in motion</h2>
            <Link href="/explore" className="px-4 py-2 border border-border text-sm font-medium rounded-xl text-foreground hover:bg-secondary transition-all whitespace-nowrap">
              View full feed
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {requests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{req.category}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${urgencyColor[req.urgency]}`}>{req.urgency}</span>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColor[req.status]}`}>{req.status}</span>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-2 line-clamp-2">{req.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed mb-4 line-clamp-2">{req.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{getUserName(req.authorId)}</p>
                    <p className="text-xs text-muted-foreground">{getUserLocation(req.authorId)} · {req.helpers.length} helper interested</p>
                  </div>
                  <Link href={`/request/${req.id}`} className="text-xs font-semibold text-primary hover:underline">
                    Open details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-8 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            HelpHub AI is built as a premium-feel, multi-page community support product using HTML, CSS, JavaScript, and LocalStorage.
          </p>
        </footer>
      </div>
    </Layout>
  );
}
