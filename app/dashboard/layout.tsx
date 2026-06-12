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
    <div className="min-h-screen bg-black text-white">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-zinc-900 p-2 rounded-lg"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className={`
        fixed md:static w-64 bg-zinc-900 border-r border-zinc-800 h-screen 
        z-40 transition-transform md:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">ClaimPilot</span>
          </div>
        </div>

        {/* Menu */}
        <nav className="p-4">
          <Link href="/dashboard/claims/new" className="block bg-blue-600 hover:bg-blue-700 w-full font-semibold mb-6 py-3 rounded-lg transition-colors text-center">
            New Claim
          </Link>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors"
              >
                {item.icon}
                <span>{item.name}</span>
                <ChevronRight className="w-4 h-4 ml-auto" />
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main content */}
      <main className="md:ml-64">
        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}