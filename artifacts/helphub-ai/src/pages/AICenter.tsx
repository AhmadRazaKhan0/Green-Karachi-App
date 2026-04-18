import { Link } from "wouter";
import Layout from "@/components/Layout";
import { getRequests, getUsers } from "@/lib/storage";
import { getAIInsights } from "@/lib/ai-engine";
import { Brain } from "lucide-react";

const aiSummaryMap: Record<string, string> = {
  "Need help": "Web Development request with high urgency. Best suited for members with relevant expertise.",
  "Need help making my portfolio responsive before demo day":
    "Responsive layout issue with a short deadline. Best helpers are frontend mentors comfortable with CSS grids and media queries.",
  "Looking for Figma feedback on a volunteer event poster":
    "A visual design critique request where feedback on hierarchy, spacing, and messaging would create the most value.",
  "Need mock interview support for internship applications":
    "Career coaching request focused on confidence-building, behavioral answers, and entry-level frontend interviews.",
};

export default function AICenter() {
  const requests = getRequests();
  const users = getUsers();
  const insights = getAIInsights(requests.map((r) => ({ category: r.category, urgency: r.urgency })));

  const highRequests = requests.filter((r) => r.urgency === "High");
  const trustedHelpers = users.filter((u) => u.trustScore >= 80);

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Create Request", href: "/create-request" },
      { label: "AI Center", href: "/ai-center" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">AI CENTER</p>
          <h1 className="text-3xl font-black mb-2">See what the platform intelligence is noticing.</h1>
          <p className="text-[#9ab] text-sm">AI-like insights summarize demand trends, helper readiness, urgency signals, and request recommendations.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">TREND PULSE</p>
            <h2 className="text-2xl font-black text-foreground mb-2">{insights.topCategory}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Most common support area based on active community requests.</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">URGENCY WATCH</p>
            <h2 className="text-2xl font-black text-foreground mb-2">{highRequests.length}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Requests currently flagged high priority by the urgency detector.</p>
          </div>
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">MENTOR POOL</p>
            <h2 className="text-2xl font-black text-foreground mb-2">{trustedHelpers.length}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">Trusted helpers with strong response history and contribution signals.</p>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">AI RECOMMENDATIONS</p>
          <h2 className="text-2xl font-black text-foreground mb-6">Requests needing attention</h2>
          <div className="space-y-3">
            {requests.map((req) => {
              const summary = aiSummaryMap[req.title] ||
                `${req.category} request. Best matched with community members experienced in ${req.tags.join(", ") || req.category}.`;
              return (
                <Link key={req.id} href={`/request/${req.id}`} className="block group">
                  <div className="p-5 rounded-xl border border-border hover:bg-secondary/50 transition-all">
                    <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{req.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-3">{summary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{req.category}</span>
                      <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${
                        req.urgency === "High" ? "bg-red-100 text-red-700" : req.urgency === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                      }`}>{req.urgency}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
