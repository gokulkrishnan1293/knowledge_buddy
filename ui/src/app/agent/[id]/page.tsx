"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  ArrowUpRight,
  MoreHorizontal,
  Loader2,
  BrainCircuit,
  CheckCircle2,
  Trash2,
  ArrowLeft, Bot, Brain, MessageSquare, GraduationCap, Play, Code
} from "lucide-react";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function AgentOverview() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [agent, setAgent] = useState<any>(null);
  const [topics, setTopics] = useState<any[]>([]);
  const [gaps, setGaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const [agentData, topicsData, gapsData] = await Promise.all([
          api.getAgentById(id),
          api.getTopics(id),
          api.getKnowledgeGaps(id)
        ]);
        setAgent(agentData);
        setTopics(topicsData);
        setGaps(gapsData);
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDeleteAgent = async () => {
    if (!confirm("Are you sure you want to delete this agent? This action cannot be undone.")) return;
    const success = await api.deleteAgent(id);
    if (success) {
      router.push('/');
    } else {
      alert("Failed to delete agent.");
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">Agent Not Found</h2>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  // Calculate stats for display
  const successRate = agent.success_rate || 0;
  const totalRatings = agent.total_ratings || 0;

  // Determine status label and color
  let statusLabel = "No Data";
  let statusColor = "bg-slate-100 text-slate-700";

  if (totalRatings > 0) {
    if (successRate >= 80) {
      statusLabel = "Excellent";
      statusColor = "bg-green-100 text-green-700";
    } else if (successRate >= 50) {
      statusLabel = "Average";
      statusColor = "bg-yellow-100 text-yellow-700";
    } else {
      statusLabel = "Needs Work";
      statusColor = "bg-red-100 text-red-700";
    }
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">

      {/* Title / Action Bar */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{agent.name}</h1>
          <p className="text-slate-500 text-sm">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          {/* Export and Quick Test buttons removed as requested */}
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/agent/${agent.id}/skills`)}
          >
            <Code size={16} />
            Skills Studio
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <MoreHorizontal size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={handleDeleteAgent}>
                <Trash2 size={14} className="mr-2" /> Delete Agent
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* The Split Layout - Forced to fill remaining height */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT PANE: Mind Map (Takes 2/3 width) */}
        <Card className="lg:col-span-2 flex flex-col border-slate-200 shadow-none overflow-hidden h-full">

          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">
              <BrainCircuit className="text-blue-500" size={18} />
              Knowledge Graph
            </h2>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-slate-50/50 relative overflow-hidden group">
            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03]"
              style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            </div>

            {/* Nodes - Centered and static for now to ensure they fit */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] max-h-[400px]">
              {/* Center */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white border-2 border-slate-900 text-slate-900 px-5 py-2 rounded-full font-bold shadow-md z-10 text-sm">
                {agent.name}
              </div>

              {/* Dynamic Topic Nodes */}
              {topics.map((topic, index) => {
                // Simple circular layout logic
                const angle = (index / topics.length) * 2 * Math.PI;
                const radius = 150; // Distance from center
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                // Convert to percentage for CSS positioning
                const left = 50 + (x / 300) * 100;
                const top = 50 + (y / 200) * 100;

                return (
                  <div
                    key={topic.id}
                    className="absolute bg-white border border-blue-500 text-blue-700 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm flex items-center gap-2 transition-all hover:scale-110 cursor-default"
                    style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <CheckCircle2 size={12} className="text-blue-500" /> {topic.name}
                  </div>
                );
              })}

              {topics.length === 0 && (
                <div className="absolute top-[70%] left-1/2 -translate-x-1/2 text-slate-400 text-xs text-center">
                  No topics yet.<br />Go to Knowledge to add some.
                </div>
              )}

              {/* Lines (SVG) - Simplified connections from center to nodes */}
              <svg className="absolute inset-0 pointer-events-none opacity-20 w-full h-full">
                {topics.map((_, index) => {
                  const angle = (index / topics.length) * 2 * Math.PI;
                  const radius = 150;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  const x2 = 50 + (x / 300) * 100;
                  const y2 = 50 + (y / 200) * 100;

                  return (
                    <line
                      key={index}
                      x1="50%" y1="50%"
                      x2={`${x2}%`} y2={`${y2}%`}
                      stroke="black" strokeWidth="1"
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </Card>

        {/* RIGHT PANE: Stats (Takes 1/3 width) - Flex Column to fill height */}
        <div className="flex flex-col gap-4 h-full min-h-0">

          {/* Top Half: Metrics */}
          <Card className="p-5 border-slate-200 shadow-none bg-white flex flex-col justify-center gap-4 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase">Performance</span>
              <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColor)}>
                {statusLabel}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{successRate}%</div>
                <div className="text-xs text-slate-500">Success Rate</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{topics.length}</div>
                <div className="text-xs text-slate-500">Topics</div>
              </div>
            </div>
          </Card>

          {/* Bottom Half: Alerts (Fills remaining space) */}
          <Card className="flex-1 min-h-0 p-0 border-slate-200 shadow-none bg-white flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 shrink-0 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase">Attention Needed</h3>
              <Badge variant="destructive" className="h-5 px-1.5 text-[10px]">{gaps.length}</Badge>
            </div>

            {/* Scrollable list inside the card */}
            <div className="overflow-y-auto p-3 space-y-2 flex-1">
              {gaps.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-4">
                  No critical issues found.
                </div>
              ) : (
                gaps.map((gap) => (
                  <Link key={gap.id} href={`/agent/${id}/playground?mode=training&gapId=${gap.id}`} className="block group">
                    <div className="p-3 rounded-lg bg-red-50 border border-red-100 hover:border-red-200 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-red-800 line-clamp-1">{gap.question_text}</span>
                        <ArrowUpRight size={14} className="text-red-400" />
                      </div>
                      <p className="text-[11px] text-red-600/80">
                        {gap.frequency > 1 ? `Asked ${gap.frequency} times.` : "User asked recently."} Missing answer.
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </Card>

        </div>
      </div>
    </div>
  );
}