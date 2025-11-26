// src/components/TrainingInbox.tsx
"use client";

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { CheckCircle, AlertCircle, RefreshCw, GraduationCap } from 'lucide-react';

export default function TrainingInbox({ agentId }: { agentId: string }) {
  // State to store the list of questions
  const [gaps, setGaps] = useState<any[]>([]);
  // State to store the inputs for each question
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  // Loading state
  const [loading, setLoading] = useState(false);

  // Load gaps when the component mounts
  useEffect(() => {
    loadGaps();
  }, [agentId]);

  const loadGaps = async () => {
    setLoading(true);
    try {
      const data = await api.getKnowledgeGaps(agentId);
      setGaps(data);
    } catch (e) {
      console.error("Failed to fetch gaps");
    } finally {
      setLoading(false);
    }
  };

  const handleTeach = async (gapId: string) => {
    const answer = answers[gapId];
    if (!answer) return;

    try {
      // 1. Send data to backend
      await api.teachAgent(gapId, answer);
      
      // 2. Remove the item from the list visually (Optimistic Update)
      setGaps((prev) => prev.filter(g => g.id !== gapId));
      
      // 3. Clear the input
      const newAnswers = { ...answers };
      delete newAnswers[gapId];
      setAnswers(newAnswers);
      
      alert("Agent trained! Try asking the question again in the chat.");
    } catch (err) {
      alert("Failed to teach agent.");
    }
  };

  return (
    <div className="bg-white border rounded-xl shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-orange-50">
        <h2 className="font-bold flex items-center gap-2 text-orange-900">
          <GraduationCap className="text-orange-600" />
          Training Queue
        </h2>
        <button onClick={loadGaps} className="p-2 hover:bg-orange-100 rounded-full transition-colors">
          <RefreshCw size={18} className={`text-orange-600 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        
        {/* Empty State */}
        {gaps.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
            <CheckCircle className="mb-2 text-green-500 h-10 w-10" />
            <p className="font-medium text-gray-600">All caught up!</p>
            <p className="text-sm">Your agent has no pending questions.</p>
          </div>
        )}

        {/* Loading State */}
        {loading && gaps.length === 0 && (
          <div className="text-center p-10 text-gray-400">Loading inbox...</div>
        )}

        {/* Question Cards */}
        {gaps.map((gap) => (
          <div key={gap.id} className="border border-gray-200 p-4 rounded-lg bg-white hover:border-orange-300 transition-colors shadow-sm">
            <div className="flex justify-between mb-3">
              <h3 className="font-semibold text-gray-900">"{gap.question_text}"</h3>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-medium h-fit">
                Asked {gap.frequency}x
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <textarea
                placeholder="Type the correct answer here..."
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm resize-none"
                rows={2}
                value={answers[gap.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [gap.id]: e.target.value })}
              />
              <button 
                onClick={() => handleTeach(gap.id)}
                disabled={!answers[gap.id]}
                className="self-end bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                Teach & Save
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}