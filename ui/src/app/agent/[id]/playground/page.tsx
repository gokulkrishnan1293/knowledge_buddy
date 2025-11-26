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
    const topicId = searchParams.get('topicId') || undefined;
    const topicName = searchParams.get('topicName') || undefined;

    const [agent, setAgent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            if (id) {
                const data = await api.getAgentById(id);
                setAgent(data);
                setLoading(false);
            }
        };
        load();
    }, [id]);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400" size={32} />
            </div>
        );
    }

    if (!agent) return <div>Agent not found</div>;

    return (
        <div className="h-full flex flex-col">
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
            <div className="flex-1 p-6 bg-slate-50/50">
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
    );
}
