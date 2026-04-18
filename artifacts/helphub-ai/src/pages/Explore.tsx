import { useState } from "react";
import { Link } from "wouter";
import Layout from "@/components/Layout";
import { getRequests, getUsers } from "@/lib/storage";
import { Search } from "lucide-react";

const urgencyColor: Record<string, string> = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const statusColor: Record<string, string> = {
  Solved: "bg-emerald-100 text-emerald-700",
  Open: "border border-primary text-primary bg-transparent",
};

const categories = ["All categories", "Web Development", "Design", "Career", "Data Science", "DevOps", "Community"];
const urgencyLevels = ["All urgency levels", "High", "Medium", "Low"];

export default function Explore() {
  const allRequests = getRequests();
  const users = getUsers();
  const [category, setCategory] = useState("All categories");
  const [urgency, setUrgency] = useState("All urgency levels");
  const [skills, setSkills] = useState("");
  const [location, setLocation] = useState("");

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown";
  const getUserLocation = (id: string) => users.find((u) => u.id === id)?.location || "";

  const filtered = allRequests.filter((r) => {
    if (category !== "All categories" && r.category !== category) return false;
    if (urgency !== "All urgency levels" && r.urgency !== urgency) return false;
    if (skills) {
      const kw = skills.toLowerCase();
      const match = r.tags.some((t) => t.toLowerCase().includes(kw)) || r.title.toLowerCase().includes(kw) || r.category.toLowerCase().includes(kw);
      if (!match) return false;
    }
    if (location) {
      const loc = getUserLocation(r.authorId).toLowerCase();
      if (!loc.includes(location.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Messages", href: "/messages" },
      { label: "Notifications", href: "/notifications" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">EXPLORE / FEED</p>
          <h1 className="text-4xl font-black leading-tight mb-2">Browse help requests with filterable community context.</h1>
          <p className="text-[#9ab] text-sm">Filter by category, urgency, skills, and location to surface the best matches.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm h-fit">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">FILTERS</p>
            <h2 className="text-xl font-black text-foreground mb-6">Refine the feed</h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="filter-category"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value)} data-testid="filter-urgency"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white">
                  {urgencyLevels.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Skills</label>
                <input value={skills} onChange={(e) => setSkills(e.target.value)} data-testid="filter-skills"
                  placeholder="React, Figma, Git/GitHub"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                <input value={location} onChange={(e) => setLocation(e.target.value)} data-testid="filter-location"
                  placeholder="Karachi, Lahore, Remote"
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          {/* Feed */}
          <div className="lg:col-span-3 space-y-4">
            {filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-border p-12 text-center">
                <Search size={32} className="text-muted-foreground mx-auto mb-3" />
                <p className="text-foreground font-semibold">No requests match your filters</p>
                <p className="text-muted-foreground text-sm mt-1">Try broadening your search criteria</p>
              </div>
            ) : (
              filtered.map((req) => (
                <div key={req.id} className="bg-white rounded-2xl border border-border p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">{req.category}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${urgencyColor[req.urgency]}`}>{req.urgency}</span>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${statusColor[req.status]}`}>{req.status}</span>
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-2">{req.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">{req.description}</p>
                  {req.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {req.tags.map((tag) => (
                        <span key={tag} className="px-2.5 py-0.5 bg-secondary text-foreground text-xs rounded-full">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getUserName(req.authorId)}</p>
                      <p className="text-xs text-muted-foreground">{getUserLocation(req.authorId)} · {req.helpers.length} helper{req.helpers.length !== 1 ? "s" : ""} interested</p>
                    </div>
                    <Link href={`/request/${req.id}`} data-testid={`btn-open-details-${req.id}`}
                      className="px-4 py-2 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                      Open details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
