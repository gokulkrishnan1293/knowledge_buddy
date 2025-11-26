"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Bot, Search, Sparkles, MessageSquare } from 'lucide-react';
import { AgentCard } from '@/components/AgentCard';
import { CreateAgentDialog } from '@/components/CreateAgentDialog';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 1. Add Search State
  const [searchQuery, setSearchQuery] = useState("");

  const loadAgents = async () => {
    const data = await api.getAgents();
    setAgents(data);
    setLoading(false);
  };

  useEffect(() => {
    // Simulate network delay for effect
    const init = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      loadAgents();
    };
    init();
  }, []);

  // 2. Filter Agents based on Search Query (Client-Side)
  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.description && agent.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white p-2 rounded-xl shadow-lg shadow-blue-500/20">
              <Bot size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Knowledge Buddy
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              {/* 3. Bind Input to State */}
              <input
                type="text"
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-full bg-slate-100 dark:bg-white/5 border-none text-sm focus:ring-2 focus:ring-blue-500/50 transition-all w-64"
              />
            </div>
            <div className="h-9 w-9 bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600 rounded-full ring-2 ring-white dark:ring-slate-800 shadow-sm"></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6"
        >
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">
              Your Agent Workforce
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
              Manage, train, and deploy your AI experts from a single control center.
            </p>
          </div>

          <div className="flex gap-3">
            {/* LOGIC: Only show Chat link if agents exist (checked against original list) */}
            {agents.length > 0 ? (
              <Link href="/chat">
                <Button className="bg-slate-600 hover:bg-slate-700 text-white">
                  <MessageSquare size={18} className="mr-2" />
                  Chat
                </Button>
              </Link>
            ) : (
              <Button disabled className="opacity-50 cursor-not-allowed bg-slate-400 text-white" title="Create an agent first">
                <MessageSquare size={18} className="mr-2" />
                Chat
              </Button>
            )}

            <CreateAgentDialog onAgentCreated={loadAgents} />
          </div>
        </motion.div>

        {/* Grid of Agents */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loading ? (
            /* Loading Skeletons */
            [1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse border border-slate-200 dark:border-white/5"></div>
            ))
          ) : (
            <>
              {/* 4. Map over filteredAgents instead of agents */}
              {filteredAgents.map((agent) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  key={agent.id}
                >
                  <AgentCard
                    id={agent.id}
                    name={agent.name}
                    description={agent.description}
                    status={agent.status}
                    color={agent.color}
                    stats={{ solved: 0, training: 0 }}
                  />
                </motion.div>
              ))}

              {/* Show "No Results" if search yields nothing but agents exist */}
              {agents.length > 0 && filteredAgents.length === 0 && (
                <div className="col-span-full text-center py-12 text-slate-500">
                  No agents found matching "{searchQuery}"
                </div>
              )}

              {/* Add New Agent Card (Always visible at end, or conditionally based on preference) */}
              {/* I'll keep it visible so users can create even while searching */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <CreateAgentDialog
                  onAgentCreated={loadAgents}
                  trigger={
                    <button className="w-full h-full min-h-[250px] rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-blue-400 dark:hover:border-blue-500/50 hover:bg-blue-50 dark:hover:bg-blue-500/5 transition-all group flex flex-col items-center justify-center gap-4">
                      <div className="p-4 rounded-full bg-slate-100 dark:bg-white/5 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors">
                        <Sparkles className="text-slate-400 group-hover:text-blue-500 transition-colors" size={24} />
                      </div>
                      <div className="text-center">
                        <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Create New Agent</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Start from scratch or use a template</p>
                      </div>
                    </button>
                  }
                />
              </motion.div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}