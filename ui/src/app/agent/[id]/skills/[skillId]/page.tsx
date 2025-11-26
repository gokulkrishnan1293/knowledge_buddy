"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { SkillEditor } from "@/components/SkillEditor";

export default function SkillEditorPage() {
    const params = useParams();
    const router = useRouter();
    const agentId = params.id as string;
    const skillId = params.skillId as string;
    const isNew = skillId === "new";

    const [skill, setSkill] = useState<any>(null);
    const [loading, setLoading] = useState(!isNew);
    const [agentName, setAgentName] = useState("");

    useEffect(() => {
        const load = async () => {
            try {
                const agentData = await api.getAgentById(agentId);
                setAgentName(agentData?.name || "Agent");

                if (!isNew) {
                    const skillData = await api.getSkill(agentId, skillId);
                    if (skillData) {
                        setSkill(skillData);
                    } else {
                        alert("Skill not found");
                        router.push(`/agent/${agentId}/skills`);
                    }
                }
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [agentId, skillId, isNew, router]);

    const handleSubmit = async (data: any) => {
        try {
            if (isNew) {
                await api.createSkill(agentId, data);
            } else {
                await api.updateSkill(agentId, skillId, data);
            }
            router.push(`/agent/${agentId}/skills`);
        } catch (error) {
            console.error("Failed to save skill", error);
            alert("Failed to save skill. Check console for details.");
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
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push(`/agent/${agentId}/skills`)}
                        className="hover:bg-slate-200 dark:hover:bg-slate-800"
                    >
                        <ArrowLeft size={20} />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                            {isNew ? "Create New Skill" : `Edit ${skill?.name || "Skill"}`}
                        </h1>
                        <p className="text-slate-500">for {agentName}</p>
                    </div>
                </div>

                <SkillEditor
                    initialData={skill}
                    onSubmit={handleSubmit}
                    isEditing={!isNew}
                />
            </div>
        </div>
    );
}
