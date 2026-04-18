import { useState } from "react";
import { useLocation } from "wouter";
import { getUsers, setCurrentUser } from "@/lib/storage";
import { CheckCircle } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const users = getUsers();
  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || "");
  const [role, setRole] = useState("Both");
  const [email] = useState("community@helplytics.ai");
  const [password] = useState("••••••••");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentUser(selectedUserId);
    setLocation("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left dark panel */}
      <div className="hidden lg:flex flex-col justify-center bg-[#1a2332] text-white w-1/2 p-16">
        <div className="flex items-center gap-2 mb-12">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-base">Helplytics AI</span>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400 mb-3">COMMUNITY ACCESS</p>
        <h1 className="text-4xl font-black leading-tight mb-6">
          Enter the support network.
        </h1>
        <p className="text-[#9ab] text-sm leading-relaxed mb-8">
          Choose a demo identity, set your role, and jump into a multi-page product flow designed for asking, offering, and tracking help with a premium interface.
        </p>
        <ul className="space-y-3">
          {[
            "Role-based entry for Need Help, Can Help, or Both",
            "Direct path into dashboard, requests, AI Center, and community feed",
            "Persistent demo session powered by LocalStorage",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-[#9ab]">
              <CheckCircle size={16} className="text-emerald-400 mt-0.5 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 p-8 lg:p-16">
        <div className="max-w-md w-full mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">LOGIN / SIGNUP</p>
          <h2 className="text-3xl font-black text-foreground mb-8">
            Authenticate your community profile
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Select demo user</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                data-testid="select-demo-user"
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Role selection</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                data-testid="select-role"
                className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
              >
                <option>Both</option>
                <option>Need Help</option>
                <option>Can Help</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <input
                  type="email"
                  defaultValue={email}
                  data-testid="input-email"
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                <input
                  type="password"
                  defaultValue="password123"
                  data-testid="input-password"
                  className="w-full px-4 py-3 bg-white border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <button
              type="submit"
              data-testid="btn-continue"
              className="w-full py-3.5 bg-primary text-white font-semibold rounded-xl hover:opacity-90 transition-opacity text-sm"
            >
              Continue to dashboard
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-muted-foreground">
            By continuing, you agree to our demo terms. No real account is created.
          </p>
        </div>
      </div>
    </div>
  );
}
