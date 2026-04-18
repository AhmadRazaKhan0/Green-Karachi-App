import { useState } from "react";
import Layout from "@/components/Layout";
import { getCurrentUser, saveUser } from "@/lib/storage";
import { useLocation } from "wouter";

export default function Profile() {
  const [, setLocation] = useLocation();
  const userInit = getCurrentUser();
  const [user, setUser] = useState(userInit);
  const [name, setName] = useState(user?.name || "");
  const [location, setLoc] = useState(user?.location || "");
  const [skills, setSkills] = useState(user?.skills.join(", ") || "");
  const [interests, setInterests] = useState(user?.interests.join(", ") || "");
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-muted-foreground">Please <a href="/login" className="text-primary">log in</a> to view your profile.</p>
        </div>
      </Layout>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...user,
      name,
      location,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
    };
    saveUser(updated);
    setUser(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Onboarding", href: "/onboarding" },
      { label: "Profile", href: "/profile" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">PROFILE</p>
          <h1 className="text-3xl font-black mb-1">{user.name}</h1>
          <p className="text-[#9ab] text-sm">{user.role} · {user.location}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Public Profile */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">PUBLIC PROFILE</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Skills and reputation</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Trust score</span>
                <span className="text-sm font-bold text-primary">{user.trustScore}%</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Contributions</span>
                <span className="text-sm font-bold text-foreground">{user.contributions}</span>
              </div>
              <div className="py-3 border-b border-border">
                <p className="text-sm text-muted-foreground mb-2">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.skills.map((s) => (
                    <span key={s} className="px-2.5 py-0.5 bg-secondary text-foreground text-xs font-medium rounded-full">{s}</span>
                  ))}
                </div>
              </div>
              <div className="py-3">
                <p className="text-sm text-muted-foreground mb-2">Badges</p>
                <div className="flex flex-wrap gap-1.5">
                  {user.badges.map((b) => (
                    <span key={b} className="px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">{b}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Profile */}
          <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">EDIT PROFILE</p>
            <h2 className="text-2xl font-black text-foreground mb-6">Update your identity</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-profile-name"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <input value={location} onChange={(e) => setLoc(e.target.value)} data-testid="input-profile-location"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Skills</label>
                <input value={skills} onChange={(e) => setSkills(e.target.value)} data-testid="input-profile-skills"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Figma, UI/UX, HTML/CSS..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Interests</label>
                <input value={interests} onChange={(e) => setInterests(e.target.value)} data-testid="input-profile-interests"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Hackathons, UI/UX, Community Building..." />
              </div>
              <button type="submit" data-testid="btn-save-profile"
                className={`w-full py-3 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-emerald-500 text-white" : "bg-primary text-white hover:opacity-90"}`}>
                {saved ? "Saved!" : "Save profile"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
