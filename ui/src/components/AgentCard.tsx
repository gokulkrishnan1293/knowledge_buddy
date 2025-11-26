"use client";

import { motion } from "framer-motion";
import { Bot, ArrowRight, Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface AgentCardProps {
    id: string;
    name: string;
    description: string;
    status: "active" | "training" | "idle";
    color?: string;
    stats?: {
        solved: number;
        training: number;
    };
}

export function AgentCard({ id, name, description, status, color = "bg-blue-500", stats }: AgentCardProps) {
    return (
        <Link href={`/agent/${id}`}>
            <motion.div
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group relative h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative h-full glass-panel rounded-2xl p-6 flex flex-col justify-between border-white/20 hover:border-blue-400/50 transition-colors">
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <div className={cn("p-3 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 shadow-inner", color)}>
                                <Bot className="text-white" size={24} />
                            </div>
                            <div className={cn(
                                "px-3 py-1 rounded-full text-xs font-medium border backdrop-blur-sm",
                                status === 'active' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                    status === 'training' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                                        'bg-slate-500/10 text-slate-600 border-slate-500/20'
                            )}>
                                <span className="flex items-center gap-1.5">
                                    <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse",
                                        status === 'active' ? 'bg-green-500' :
                                            status === 'training' ? 'bg-yellow-500' : 'bg-slate-500'
                                    )} />
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </span>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {name}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed line-clamp-2">
                            {description}
                        </p>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex gap-4 text-xs text-slate-400">
                                {stats && (
                                    <>
                                        <span className="flex items-center gap-1">
                                            <Sparkles size={12} /> {stats.solved} Solved
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Activity size={12} /> {stats.training} Training
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center text-sm font-medium text-slate-600 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-all transform translate-x-[-10px] group-hover:translate-x-0">
                                Open Studio <ArrowRight size={16} className="ml-1" />
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}
