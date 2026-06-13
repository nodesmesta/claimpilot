"use client";

import { useEffect, useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Menu, 
  X,
  ChevronRight,
  LogOut,
  Shield,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase-browser";
import type { UserProfile, SubscriptionStatus } from "@/app/lib/types";
import AIChatPanel from "@/app/components/AIChatPanel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [user, setUser] = useState<{ email?: string; avatar_url?: string; full_name?: string; subscription_status?: SubscriptionStatus } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser({
          email: u.email,
          avatar_url: u.user_metadata?.avatar_url || u.user_metadata?.picture,
          full_name: u.user_metadata?.full_name || u.user_metadata?.name,
        });
        // Fetch subscription from profiles
        supabase.from("profiles").select("subscription_status").eq("id", u.id).single()
          .then(({ data }) => {
            if (data) setUser(prev => prev ? { ...prev, subscription_status: data.subscription_status } : prev);
          });
      }
    });
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const badgeColor = (s?: SubscriptionStatus) => {
    if (s === "pro") return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === "enterprise") return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-zinc-100 text-zinc-600 border-zinc-200";
  };

  const menuItems = [
    {
      name: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      href: "/dashboard",
    },
    {
      name: "Claims",
      icon: <FileText className="w-5 h-5" />,
      href: "/dashboard/claims",
    },
    {
      name: "Agents",
      icon: <Bot className="w-5 h-5" />,
      href: "/dashboard/agents",
    },
  ];

  return (
    <div className="min-h-screen bg-white text-zinc-900">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white/80 backdrop-blur-sm border border-zinc-200 p-2 rounded-lg shadow-sm"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 w-64 bg-white/80 backdrop-blur-xl border-r border-zinc-200 h-screen overflow-y-auto
        z-40 transition-transform md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-zinc-200">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ClaimPilot</span>
          </Link>
        </div>

        {/* Menu */}
        <nav className="p-4">
          <Link href="/dashboard/claims/new" className="block bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 w-full font-semibold mb-6 py-3 rounded-xl transition text-center text-white shadow-lg shadow-blue-500/20">
            New Claim
          </Link>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto text-zinc-400" />
              </Link>
            ))}
          </div>
        </nav>

        {/* User info */}
        {user && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-white/80 backdrop-blur-xl">
            <Link href="/dashboard/assets" className="flex items-center gap-2 px-3 py-2 mb-3 rounded-lg hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors text-sm">
              <Shield className="w-4 h-4" />
              <span>My Assets</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto text-zinc-400" />
            </Link>
            <div className="flex items-center gap-3">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-9 h-9 rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600">
                  {(user.full_name || user.email || "?")[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900 truncate">{user.full_name || user.email}</p>
                <span className={`inline-block text-xs px-2 py-0.5 rounded-full border ${badgeColor(user.subscription_status)}`}>
                  {user.subscription_status || "free"}
                </span>
              </div>
              <button onClick={handleSignOut} className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="md:ml-64 min-h-screen bg-gradient-to-br from-white via-white to-blue-50/30">
        {/* Navbar */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-4 md:px-8 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900">ClaimPilot</h1>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${chatOpen ? "bg-zinc-200 text-zinc-700" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20 hover:opacity-90"}`}
          >
            <MessageCircle className="w-4 h-4" />
            {chatOpen ? "Close Chat" : "Chat with AI"}
          </button>
        </div>
        <div className="flex h-[calc(100vh-57px)]">
          <div className={`flex-1 overflow-y-auto p-4 md:p-8 ${chatOpen ? "" : ""}`}>
            {children}
          </div>
          {chatOpen && (
            <div className="w-96 border-l border-zinc-200 flex-shrink-0">
              <AIChatPanel />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
