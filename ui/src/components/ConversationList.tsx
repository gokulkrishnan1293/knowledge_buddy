"use client";
import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

interface ConversationListProps {
    conversations: any[];
    activeConversation: any;
    onSelectConversation: (conversation: any) => void;
    onConversationDeleted?: () => void;
}

export function ConversationList({ conversations, activeConversation, onSelectConversation, onConversationDeleted }: ConversationListProps) {
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const handleDelete = async (e: React.MouseEvent, conversationId: string) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this conversation?')) {
            await api.deleteConversation(conversationId);
            if (onConversationDeleted) {
                onConversationDeleted();
            }
        }
    };

    return (
        <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                    <MessageSquare size={48} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations yet</p>
                </div>
            ) : (
                conversations.map((conv) => (
                    <button
                        key={conv.id}
                        onClick={() => onSelectConversation(conv)}
                        className={cn(
                            "w-full p-4 text-left border-b border-slate-100 hover:bg-slate-50 transition-colors relative",
                            activeConversation?.id === conv.id && "bg-blue-50 border-l-4 border-l-blue-600"
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm truncate flex-1">
                                {conv.title}
                            </h3>
                            <div className="flex items-center gap-2 shrink-0">
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatTime(conv.updated_at)}
                                </span>
                                <button
                                    onClick={(e) => handleDelete(e, conv.id)}
                                    className="p-1 hover:bg-red-50 rounded transition-colors"
                                    title="Delete conversation"
                                >
                                    <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    </button>
                ))
            )}
        </div>
    );
}
