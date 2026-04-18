import { Link, useLocation } from "wouter";
import { getCurrentUser } from "@/lib/storage";
import { Bell, MessageSquare, LayoutDashboard, Compass, Trophy, Brain, Settings, LogOut } from "lucide-react";
import { useState, useEffect } from "react";

interface NavItem {
  label: string;
  href: string;
}

interface LayoutProps {
  children: React.ReactNode;
  navItems?: NavItem[];
  showAuthNav?: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Explore", href: "/explore" },
  { label: "Messages", href: "/messages" },
];

const publicNavItems: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Explore", href: "/explore" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "AI Center", href: "/ai-center" },
];

export default function Layout({ children, navItems, showAuthNav = false }: LayoutProps) {
  const [location] = useLocation();
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    setUser(getCurrentUser());
  }, [location]);

  const items = navItems || (user ? defaultNavItems : publicNavItems);

  return (
    <div className="min-h-screen bg-background font-sans">
      <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">L</span>
            </div>
            <span className="font-semibold text-foreground text-base">Helplytics AI</span>
          </Link>

          <div className="flex items-center gap-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-testid={`nav-link-${item.label.toLowerCase().replace(/\s/g, "-")}`}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  location === item.href
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {!user && !showAuthNav && (
              <Link
                href="/login"
                data-testid="nav-join"
                className="ml-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity"
              >
                Join the platform
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-2 ml-2">
                <Link href="/notifications" data-testid="nav-notifications" className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                  <Bell size={16} />
                </Link>
                <Link href="/profile" data-testid="nav-profile" className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-all">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-semibold"
                    style={{ backgroundColor: user.avatarColor }}
                  >
                    {user.initials}
                  </div>
                  <span className="text-sm text-foreground font-medium">{user.name.split(" ")[0]}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
