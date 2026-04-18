import { useState } from "react";
import { useLocation } from "wouter";
import { getCurrentUser, saveUser } from "@/lib/storage";
import { suggestHelperSkills, suggestNeedAreas } from "@/lib/ai-engine";
import { Sparkles } from "lucide-react";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const user = getCurrentUser();
  const [step, setStep] = useState(1);
  const [name, setName] = useState(user?.name || "");
  const [location, setLocation2] = useState(user?.location || "");
  const [skills, setSkills] = useState(user?.skills.join(", ") || "");
  const [interests, setInterests] = useState(user?.interests.join(", ") || "");

  const skillList = skills.split(",").map((s) => s.trim()).filter(Boolean);
  const helperSuggestions = suggestHelperSkills(skillList);
  const needSuggestions = suggestNeedAreas(skillList);

  const handleComplete = () => {
    if (!user) return;
    saveUser({
      ...user,
      name,
      location,
      skills: skills.split(",").map((s) => s.trim()).filter(Boolean),
      interests: interests.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setLocation("/dashboard");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Please <a href="/login" className="text-primary">log in</a> first.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          <span className="font-semibold text-foreground">HelpHub AI</span>
          <span className="ml-4 text-sm text-muted-foreground">Onboarding</span>
          <a href="/dashboard" className="ml-auto text-sm text-muted-foreground hover:text-foreground">Dashboard</a>
          <a href="/profile" className="text-sm text-muted-foreground hover:text-foreground">Profile</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">ONBOARDING</p>
          <h1 className="text-3xl font-black">Set up your community profile.</h1>
          <p className="text-[#9ab] text-sm mt-2">Tell us who you are and what you can do. AI will suggest where you can help and where you might need support.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-8 shadow-sm">
            {/* Step indicators */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-border"}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">Your identity</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Full Name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} data-testid="input-name"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Your name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Location</label>
                  <input value={location} onChange={(e) => setLocation2(e.target.value)} data-testid="input-location"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Karachi, Lahore, Remote..." />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">Your skills</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Skills (comma-separated)</label>
                  <input value={skills} onChange={(e) => setSkills(e.target.value)} data-testid="input-skills"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="React, Figma, Git/GitHub..." />
                </div>
                {skillList.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {skillList.map((s) => <span key={s} className="px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">{s}</span>)}
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-foreground mb-4">Your interests</h2>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Interests (comma-separated)</label>
                  <input value={interests} onChange={(e) => setInterests(e.target.value)} data-testid="input-interests"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary" placeholder="Hackathons, UI/UX, Community Building..." />
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-xl font-bold text-foreground mb-4">Review and complete</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Name</span><span className="font-medium">{name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Location</span><span className="font-medium">{location}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-border">
                    <span className="text-muted-foreground">Skills</span><span className="font-medium">{skills}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-muted-foreground">Interests</span><span className="font-medium">{interests}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button onClick={() => setStep(step - 1)} className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-all">
                  Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={() => setStep(step + 1)} data-testid="btn-next-step"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Continue
                </button>
              ) : (
                <button onClick={handleComplete} data-testid="btn-complete-profile"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Complete Profile
                </button>
              )}
            </div>
          </div>

          {/* AI Suggestions Panel */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles size={16} className="text-primary" />
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI SUGGESTIONS</p>
              </div>
              <h3 className="font-bold text-foreground mb-4">Based on your skills</h3>
              {helperSuggestions.length > 0 ? (
                <>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">You can help with</p>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {helperSuggestions.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full border border-emerald-200">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">You might need help with</p>
                  <div className="flex flex-wrap gap-1.5">
                    {needSuggestions.map((s) => (
                      <span key={s} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">{s}</span>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Type your skills in step 2 to see AI-powered suggestions here.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
