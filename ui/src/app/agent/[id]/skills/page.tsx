"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Code, Plus, Trash2 } from "lucide-react";
import { SkillList } from "@/components/SkillList";
import { SkillEditor } from "@/components/SkillEditor";

export default function SkillsPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;

    const [skills, setSkills] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [agentName, setAgentName] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [agentData, skillsData] = await Promise.all([
                api.getAgentById(agentId),
                api.getSkills(agentId)
            ]);
            setAgentName(agentData?.name || "Agent");
            setSkills(skillsData || []);
        } catch (error) {
            console.error("Error loading skills:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (agentId) {
            loadData();
        }
    }, [agentId]);

    const handleCreateSkill = async (skill: any) => {
        try {
            await api.createSkill(agentId, skill);
            await loadData(); // Reload list
        } catch (error) {
            console.error("Failed to create skill", error);
            alert("Failed to create skill. Check console for details.");
        }
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!confirm("Are you sure you want to delete this skill?")) return;
        try {
            await api.deleteSkill(agentId, skillId);
            setSkills(prev => prev.filter(s => s.id !== skillId));
        } catch (error) {
            console.error("Failed to delete skill", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        );
    }

    return (
        <div className="h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/agent/${agentId}`)}
                            className="hover:bg-slate-200 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft size={20} />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Code className="text-blue-500" />
                                Skills Studio
                            </h1>
                            <p className="text-slate-500">Manage Python skills for {agentName}</p>
                        </div>
                    </div>
                    <Button onClick={() => router.push(`/agent/${agentId}/skills/new`)}>
                        <Plus className="mr-2" size={16} />
                        Create New Skill
                    </Button>
                </div>

                {/* Skill Grid */}
                {skills.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                        <Code className="mx-auto mb-3 opacity-50" size={32} />
                        <p>No skills defined yet.</p>
                        <p className="text-sm mt-1">Create a skill to give your agent new capabilities.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {skills.map((skill) => (
                            <div
                                key={skill.id}
                                className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm hover:border-blue-200 dark:hover:border-blue-800 hover:shadow-md transition-all cursor-pointer flex flex-col h-full"
                                onClick={() => router.push(`/agent/${agentId}/skills/${skill.id}`)}
                            >
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 text-lg">
                                            <Code size={18} className="text-blue-500" />
                                            {skill.name}
                                        </h3>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-2">{skill.description}</p>

                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {skill.parameters && Object.keys(skill.parameters).map(param => (
                                            <span key={param} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs rounded-md font-mono">
                                                {param}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 px-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteSkill(skill.id);
                                        }}
                                    >
                                        <Trash2 size={14} className="mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
