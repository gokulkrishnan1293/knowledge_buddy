"use client";
import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { ChatWindow } from "@/components/ChatWindow";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";

export default function PlaygroundPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;

    const mode = searchParams.get('mode') as 'chat' | 'training' || 'chat';
    const topicIdParam = searchParams.get('topicId') || undefined;
    const topicNameParam = searchParams.get('topicName') || undefined;
    const gapId = searchParams.get('gapId') || undefined;

    const [agent, setAgent] = useState<any>(null);
    const [topicId, setTopicId] = useState<string | undefined>(topicIdParam);
    const [topicName, setTopicName] = useState<string | undefined>(topicNameParam);
    const [loading, setLoading] = useState(true);
    const [resolvingGap, setResolvingGap] = useState(false);

    useEffect(() => {
        const load = async () => {
            if (id) {
                const data = await api.getAgentById(id);
                setAgent(data);

                if (gapId) {
                    setResolvingGap(true);
                    // Fetch gap details first to get text (assuming we have an endpoint or pass text, 
                    // but for now let's fetch gaps and find it, or just use a new endpoint to get gap details.
                    // Actually, let's just fetch all gaps and find it for simplicity as we don't have getGapById
                    const gaps = await api.getKnowledgeGaps(id);
                    const gap = gaps.find((g: any) => g.id === gapId);

                    if (gap) {
                        const resolution = await api.resolveGap(id, gap.question_text);
                        if (resolution) {
                            setTopicId(resolution.topic_id);
                            setTopicName(resolution.topic_name);
                        }
                    }
                    setResolvingGap(false);
                }

                setLoading(false);
            }
        };
        load();
    }, [id, gapId]);

    if (loading || resolvingGap) {
        return (
            <div className="h-full flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-slate-400" size={32} />
                {resolvingGap && <p className="text-slate-500 text-sm">Finding the right topic...</p>}
            </div>
        );
    }

    if (!agent) return <div>Agent not found</div>;

    return (
        <div className="h-full flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">
                        {mode === 'training' ? 'Training Session' : 'Playground'}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {mode === 'training'
                            ? `Teaching agent about: ${topicName || 'Topic'}`
                            : "Test your agent's responses in real-time."}
                    </p>
                </div>
            </div>
            <div className="flex-1 p-6 bg-slate-50/50 min-h-0 flex flex-col">
                <div className="flex-1 min-h-0 relative">
                    <ChatWindow
                        agentId={agent.id}
                        agentName={agent.name}
                        agentColor={agent.color}
                        mode={mode}
                        topicId={topicId}
                        topicName={topicName}
                    />
                </div>
            </div>
        </div>
    );
}
