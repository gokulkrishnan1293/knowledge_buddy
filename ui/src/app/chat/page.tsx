// src/app/chat/page.tsx
"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { ConversationList } from '@/components/ConversationList';
import { ChatWindow } from '@/components/ChatWindow';
import { Plus, MessageSquare, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ChatPage() {
    const [conversations, setConversations] = useState<any[]>([]);
    const [activeConversation, setActiveConversation] = useState<any>(null);
    const [selectedAgent, setSelectedAgent] = useState<any>(null);
    const [agents, setAgents] = useState<any[]>([]);

    useEffect(() => {
        loadConversations();
        loadAgents();
    }, []);

    const loadConversations = async () => {
        const data = await api.getConversations();
        setConversations(data);
    };

    const loadAgents = async () => {
        const data = await api.getAgents();
        setAgents(data);
        if (data.length > 0) {
            setSelectedAgent(data[0]);
        }
    };

    const handleNewConversation = async () => {
        const newConv = await api.createConversation();
        if (newConv) {
            setConversations([newConv, ...conversations]);
            setActiveConversation(newConv);
        }
    };

    // NEW: Function to refresh the list when title changes
    const handleMessageSent = () => {
        // Refresh conversation list to show new titles/timestamps
        loadConversations();
    };

    return (
        <div className="flex h-screen bg-slate-100 p-3 gap-3 overflow-hidden">
            {/* Left Sidebar - Conversations */}
            <aside className="w-80 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-slate-900">Conversations</h2>
                        <Button
                            onClick={handleNewConversation}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus size={16} className="mr-1" /> New
                        </Button>
                    </div>
                </div>

                <ConversationList
                    conversations={conversations}
                    activeConversation={activeConversation}
                    onSelectConversation={setActiveConversation}
                    onConversationDeleted={() => {
                        loadConversations();
                        setActiveConversation(null);
                    }}
                />
            </aside>

            {/* Main Content - Chat Window */}
            <main className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                {/* Header with Back Button */}
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-800 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="text-sm font-medium">Back to Dashboard</span>
                    </Link>


                    <div className="flex items-center gap-2">
                        {agents && agents.length > 0 && (
                            <select
                                value={selectedAgent?.id || ''}
                                onChange={(e) => {
                                    const agent = agents.find(a => a.id === e.target.value);
                                    if (agent) {
                                        setSelectedAgent(agent);
                                    }
                                }}
                                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {agents.map((agent) => (
                                    <option key={agent.id} value={agent.id}>
                                        {agent.name}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Chat Content */}
                <div className="flex-1 overflow-hidden">
                    {activeConversation ? (
                        <ChatWindow
                            agentId={selectedAgent?.id || ''}
                            agentName={selectedAgent?.name || 'Agent'}
                            agentColor={selectedAgent?.color}
                            mode="chat"
                            conversationId={activeConversation.id}
                            agents={agents}
                            onAgentChange={setSelectedAgent}
                            onMessageSent={handleMessageSent} // Passed down here
                        />
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            <div className="text-center">
                                <MessageSquare size={64} className="mx-auto text-slate-300 mb-4" />
                                <h3 className="text-xl font-semibold text-slate-900 mb-2">No conversation selected</h3>
                                <p className="text-slate-500 mb-4">Start a new conversation to begin chatting</p>
                                <Button onClick={handleNewConversation} className="bg-blue-600 hover:bg-blue-700">
                                    <Plus size={16} className="mr-2" /> New Conversation
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}