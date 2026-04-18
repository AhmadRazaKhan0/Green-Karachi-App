import Layout from "@/components/Layout";
import { getUsers } from "@/lib/storage";

export default function Leaderboard() {
  const users = [...getUsers()].sort((a, b) => b.trustScore - a.trustScore);

  const rankColors = ["text-amber-500", "text-slate-400", "text-amber-700"];

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Leaderboard", href: "/leaderboard" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">LEADERBOARD</p>
          <h1 className="text-3xl font-black mb-2">Recognize the people who keep the community moving.</h1>
          <p className="text-[#9ab] text-sm">Trust score, contribution count, and badges create visible momentum for reliable helpers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rankings */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">TOP HELPERS</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Rankings</h2>
            <div className="space-y-3">
              {users.map((user, idx) => (
                <div key={user.id} data-testid={`leaderboard-rank-${idx + 1}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-secondary/50 transition-all">
                  <div className="w-8 text-center">
                    <span className={`text-sm font-black ${rankColors[idx] || "text-muted-foreground"}`}>#{idx + 1}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: user.avatarColor }}>
                    {user.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.skills.join(", ")}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-foreground">{user.trustScore}%</p>
                    <p className="text-xs text-muted-foreground">{user.contributions} contributions</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Badge System */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">BADGE SYSTEM</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Trust and achievement</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-foreground text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.badges.join(" · ")}</p>
                    </div>
                    <span className="text-sm font-bold text-foreground">{user.trustScore}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${user.trustScore}%`,
                        background: user.trustScore >= 90 ? "#10b981" : user.trustScore >= 70 ? "#f59e0b" : "#f97316",
                      }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {user.badges.map((badge) => (
                      <span key={badge} className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">{badge}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
