import Layout from "@/components/Layout";
import { getRequests, getUsers, saveRequest } from "@/lib/storage";
import { useState } from "react";
import { Trash2, CheckCircle, Users, MessageCircle, BarChart2 } from "lucide-react";

export default function Admin() {
  const [requests, setRequests] = useState(getRequests());
  const users = getUsers();

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name || "Unknown";

  const handleSolve = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req) return;
    saveRequest({ ...req, status: "Solved" });
    setRequests(getRequests());
  };

  const totalSolved = requests.filter((r) => r.status === "Solved").length;
  const solvedRate = requests.length > 0 ? Math.round((totalSolved / requests.length) * 100) : 0;

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Admin", href: "/admin" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">ADMIN PANEL</p>
          <h1 className="text-3xl font-black mb-2">Platform management and analytics.</h1>
          <p className="text-[#9ab] text-sm">Manage requests, moderate content, and view community analytics.</p>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: <Users size={20} className="text-blue-500" />, label: "Total Users", value: users.length },
            { icon: <MessageCircle size={20} className="text-primary" />, label: "Total Requests", value: requests.length },
            { icon: <BarChart2 size={20} className="text-emerald-500" />, label: "Solved Rate", value: `${solvedRate}%` },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-border p-5 shadow-sm">
              {s.icon}
              <p className="text-2xl font-black text-foreground mt-2">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm mb-6 overflow-hidden">
          <div className="p-6 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">CONTENT MODERATION</p>
            <h2 className="text-xl font-black text-foreground">All Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-6 py-3">Title</th>
                  <th className="text-left px-6 py-3">Author</th>
                  <th className="text-left px-6 py-3">Category</th>
                  <th className="text-left px-6 py-3">Urgency</th>
                  <th className="text-left px-6 py-3">Status</th>
                  <th className="text-left px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-foreground max-w-xs truncate">{req.title}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{getUserName(req.authorId)}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{req.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.urgency === "High" ? "bg-red-100 text-red-700" : req.urgency === "Medium" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                        {req.urgency}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${req.status === "Solved" ? "bg-emerald-100 text-emerald-700" : "border border-primary text-primary"}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {req.status !== "Solved" && (
                          <button onClick={() => handleSolve(req.id)} data-testid={`btn-admin-solve-${req.id}`}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all" title="Mark solved">
                            <CheckCircle size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">USER MANAGEMENT</p>
            <h2 className="text-xl font-black text-foreground">Community Members</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="text-left px-6 py-3">Name</th>
                  <th className="text-left px-6 py-3">Role</th>
                  <th className="text-left px-6 py-3">Location</th>
                  <th className="text-left px-6 py-3">Trust Score</th>
                  <th className="text-left px-6 py-3">Contributions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: u.avatarColor }}>
                          {u.initials}
                        </div>
                        <span className="text-sm font-medium text-foreground">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.role}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.location}</td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-primary">{u.trustScore}%</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">{u.contributions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
