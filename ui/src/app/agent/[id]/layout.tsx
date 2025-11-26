"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import {
  LayoutGrid,
  GraduationCap,
  Zap,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ArrowLeft,
  MessageSquare
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const id = params.id as string;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [agent, setAgent] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await api.getAgentById(id);
        setAgent(data);
      }
    };
    load();
  }, [id]);

  const navItems = [
    { name: 'Overview', icon: LayoutGrid, href: `/agent/${id}` },
    { name: 'Playground', icon: MessageSquare, href: `/agent/${id}/playground` },
    { name: 'Knowledge', icon: GraduationCap, href: `/agent/${id}/training` },
  ];

  return (
    <div className="flex h-screen bg-slate-100 p-3 gap-3 font-sans text-slate-900 overflow-hidden">

      {/* 1. FLOATING SIDEBAR */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col transition-all duration-300 ease-in-out z-20`}
      >
        {/* Top: Back Navigation & Collapse */}
        <div className="p-4 flex flex-col gap-4">

          {/* Back Button Row */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <Link href="/" className="text-slate-400 hover:text-slate-800 transition-colors" title="Back to Dashboard">
              <ArrowLeft size={20} />
            </Link>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-slate-300 hover:text-slate-600 h-6 w-6"
            >
              {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </Button>
          </div>

          {/* Agent Identity (Only visible when open) */}
          {!isCollapsed && (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className={`h-10 w-10 ${agent?.color || 'bg-blue-600'} rounded-xl flex items-center justify-center text-white font-bold shadow-md`}>
                {agent?.name?.charAt(0) || 'A'}
              </div>
              <div className="overflow-hidden">
                <h2 className="font-bold text-slate-800 leading-tight truncate">{agent?.name || 'Loading...'}</h2>
                <p className="text-xs text-slate-400 truncate">Online • v2.0</p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative
                  ${isActive
                    ? 'bg-slate-50 text-blue-600 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <item.icon size={20} className={isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-900"} />

                {!isCollapsed && <span>{item.name}</span>}

                {isCollapsed && (
                  <div className="absolute left-14 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER (The Big Card) */}
      <main className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        {/* We removed the header as requested. Content fills this space directly. */}
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>

    </div>
  );
}