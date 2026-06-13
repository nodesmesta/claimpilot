"use client";

import { useState } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  Bot, 
  Menu, 
  X,
  ChevronRight
} from "lucide-react";

import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <main className="md:ml-64 min-h-screen bg-gradient-to-br from-white via-white to-blue-50/30">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
