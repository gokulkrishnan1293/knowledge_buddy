"use client";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  BookOpen,
  MessageSquare,
  Loader2,
  Trash2,
  MoreVertical
} from "lucide-react";
import { api } from "@/lib/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function KnowledgeBasePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (id) {
        const data = await api.getTopics(id);
        setTopics(data);
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleCreateTopic = async () => {
    if (!newTopicName.trim()) return;
    const newTopic = await api.createTopic(id, newTopicName);
    if (newTopic) {
      setTopics([...topics, newTopic]);
      setNewTopicName("");
      setIsCreating(false);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!confirm("Are you sure? This will delete all knowledge associated with this topic.")) return;
    const success = await api.deleteTopic(id, topicId);
    if (success) {
      setTopics(topics.filter(t => t.id !== topicId));
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header */}
      <div className="p-8 border-b border-slate-200 bg-white flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Knowledge Base</h1>
          <p className="text-slate-500 mt-1">Manage what your agent knows. Add topics and train it via chat.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search topics..."
              className="pl-9 bg-slate-50 border-slate-200"
            />
          </div>
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus size={16} /> New Topic
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-8 overflow-y-auto">

        {/* Creation Modal */}
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Topic</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <Input
                autoFocus
                placeholder="Topic Name (e.g., Return Policy, Company History)"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTopic()}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                <Button onClick={handleCreateTopic}>Create Topic</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : topics.length === 0 && !isCreating ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No topics yet</h3>
            <p className="text-slate-500 mb-6">Create a topic to start teaching your agent.</p>
            <Button onClick={() => setIsCreating(true)}>Create First Topic</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map(topic => (
              <Card key={topic.id} className="group hover:shadow-md transition-all duration-200 border-slate-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
                      <BookOpen size={20} />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-900">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleDeleteTopic(topic.id)}>
                          <Trash2 size={14} className="mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <h3 className="font-bold text-lg text-slate-900 mb-1">{topic.name}</h3>
                  <p className="text-sm text-slate-500 mb-6">{topic.doc_count} documents</p>

                  <Button
                    className="w-full gap-2 bg-slate-900 hover:bg-slate-800"
                    onClick={() => router.push(`/agent/${id}/playground?mode=training&topicId=${topic.id}&topicName=${encodeURIComponent(topic.name)}`)}
                  >
                    <MessageSquare size={16} /> Interview Mode
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}