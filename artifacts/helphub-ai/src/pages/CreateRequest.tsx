import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Layout from "@/components/Layout";
import { getCurrentUser, saveRequest, addNotification, getRequests } from "@/lib/storage";
import { detectUrgency, detectCategory, suggestTags, rewriteRequest } from "@/lib/ai-engine";
import { Sparkles } from "lucide-react";

const categories = ["Web Development", "Design", "Career", "Data Science", "DevOps", "Community"];
const urgencyOptions = ["High", "Medium", "Low"];

export default function CreateRequest() {
  const [, setLocation] = useLocation();
  const user = getCurrentUser();

  const [title, setTitle] = useState("Need review on my JavaScript quiz app before submission");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("JavaScript, Debugging, Review");
  const [category, setCategory] = useState("Web Development");
  const [urgency, setUrgency] = useState<"High" | "Medium" | "Low">("High");

  const [aiCategory, setAiCategory] = useState("Community");
  const [aiUrgency, setAiUrgency] = useState("Low");
  const [aiTags, setAiTags] = useState<string[]>([]);
  const [aiRewrite, setAiRewrite] = useState("Start describing the challenge to generate a stronger version.");

  useEffect(() => {
    const text = title + " " + description;
    setAiCategory(detectCategory(text));
    setAiUrgency(detectUrgency(text));
    setAiTags(suggestTags(text));
    setAiRewrite(rewriteRequest(title, description));
  }, [title, description]);

  const handleApplyAI = () => {
    setCategory(aiCategory);
    setUrgency(aiUrgency as "High" | "Medium" | "Low");
    if (aiTags.length > 0) setTags(aiTags.join(", "));
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { setLocation("/login"); return; }
    const newReq = {
      id: `req_${Date.now()}`,
      title,
      description,
      category,
      urgency,
      status: "Open" as const,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      authorId: user.id,
      helpers: [],
      createdAt: new Date().toISOString(),
    };
    saveRequest(newReq);
    addNotification({
      id: `notif_${Date.now()}`,
      title: `Your request "${title}" is now live in the community feed`,
      subtitle: "Request",
      type: "Request",
      read: false,
      timestamp: "Just now",
    });
    setLocation("/explore");
  };

  return (
    <Layout navItems={[
      { label: "Dashboard", href: "/dashboard" },
      { label: "Explore", href: "/explore" },
      { label: "Create Request", href: "/create-request" },
    ]}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-[#1a2332] rounded-2xl p-8 mb-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-2">CREATE REQUEST</p>
          <h1 className="text-3xl font-black mb-2">Turn a rough problem into a clear help request.</h1>
          <p className="text-[#9ab] text-sm">Use built-in AI suggestions for category, urgency, tags, and a stronger description rewrite.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form */}
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <form onSubmit={handlePublish} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Title</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} data-testid="input-request-title" required
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Need review on my JavaScript quiz app before submission" />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} data-testid="input-request-description" rows={4}
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Explain the challenge, your current progress, deadline, and what kind of help would be useful." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
                  <input value={tags} onChange={(e) => setTags(e.target.value)} data-testid="input-request-tags"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="JavaScript, Debugging, Review" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} data-testid="select-request-category"
                    className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white">
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Urgency</label>
                <select value={urgency} onChange={(e) => setUrgency(e.target.value as "High" | "Medium" | "Low")} data-testid="select-request-urgency"
                  className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-white">
                  {urgencyOptions.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={handleApplyAI} data-testid="btn-apply-ai"
                  className="px-5 py-2.5 border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-all">
                  Apply AI suggestions
                </button>
                <button type="submit" data-testid="btn-publish-request"
                  className="px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
                  Publish request
                </button>
              </div>
            </form>
          </div>

          {/* AI Panel */}
          <div className="bg-white rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">AI ASSISTANT</p>
            </div>
            <h2 className="text-2xl font-black text-foreground mb-6">Smart request guidance</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Suggested category</span>
                <span className="text-sm font-semibold text-foreground">{aiCategory}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-border">
                <span className="text-sm text-muted-foreground">Detected urgency</span>
                <span className={`text-sm font-semibold ${aiUrgency === "High" ? "text-red-600" : aiUrgency === "Medium" ? "text-amber-600" : "text-green-600"}`}>
                  {aiUrgency}
                </span>
              </div>
              <div className="py-3 border-b border-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Suggested tags</span>
                </div>
                {aiTags.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {aiTags.map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 bg-secondary text-foreground text-xs rounded-full">{tag}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Add more detail for smarter tags</p>
                )}
              </div>
              <div className="py-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Rewrite suggestion</span>
                  <Sparkles size={14} className="text-primary" />
                </div>
                <p className="text-sm text-foreground leading-relaxed bg-secondary/50 rounded-xl p-3 italic">
                  {aiRewrite}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
