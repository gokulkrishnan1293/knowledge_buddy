"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, Sparkles, GraduationCap, CheckCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { api } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  rating?: number; // 1 = Like, -1 = Dislike, 0 or undefined = None
}

interface ChatWindowProps {
  agentId: string;
  agentName: string;
  agentColor?: string;
  mode?: 'chat' | 'training';
  topicId?: string;
  topicName?: string;
  conversationId?: string;
  agents?: any[];
  onAgentChange?: (agent: any) => void;
  onMessageSent?: () => void;
}

export function ChatWindow({
  agentId,
  agentName,
  agentColor = "bg-blue-500",
  mode = 'chat',
  topicId,
  topicName,
  conversationId,
  agents,
  onAgentChange,
  onMessageSent
}: ChatWindowProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Training State
  const [confidence, setConfidence] = useState(0);
  const [accumulatedContext, setAccumulatedContext] = useState("");
  const [currentQuestions, setCurrentQuestions] = useState<string[]>([]);
  const [qaPairs, setQaPairs] = useState<{ q: string, a: string }[]>([]);
  const [trainingStep, setTrainingStep] = useState<'initial' | 'answering'>('initial');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    const loadInitialMessage = async () => {
      if (mode === 'chat') {
        if (conversationId) {
          const history = await api.getConversationMessages(conversationId);

          if (history && history.length > 0) {
            const historyMessages = history.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              content: msg.content,
              timestamp: new Date(msg.timestamp),
              rating: msg.rating // Load existing rating from DB
            }));
            setMessages(historyMessages);
          } else {
            setMessages([{
              id: "welcome",
              role: "agent",
              content: `Hello! I'm ${agentName}. How can I help you today?`,
              timestamp: new Date(),
            }]);
          }
        } else {
          setMessages([{
            id: "welcome",
            role: "agent",
            content: `Hello! I'm ${agentName}. How can I help you today?`,
            timestamp: new Date(),
          }]);
        }
      } else {
        // Training mode
        if (topicId) {
          setLoadingSummary(true);
          const summary = await api.getTopicSummary(agentId, topicId);
          setLoadingSummary(false);
          setMessages([{
            id: "welcome-training",
            role: "agent",
            content: `I'm ready to learn about **${topicName}**.\n\n**What I already know:**\n${summary}\n\nWhat else should I know?`,
            timestamp: new Date(),
          }]);
        } else {
          setMessages([{
            id: "welcome-training",
            role: "agent",
            content: `I'm ready to learn about **${topicName}**. What should I know?`,
            timestamp: new Date(),
          }]);
        }
      }
    };
    loadInitialMessage();
  }, [mode, topicName, topicId, conversationId]); // agentId removed to prevent full reload on switch

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (mode === 'chat') {
        const response = conversationId
          ? await api.chatWithConversation(agentId, userMsg.content, conversationId)
          : await api.chat(agentId, userMsg.content);

        const agentMsg: Message = {
          id: (Date.now() + 1).toString(), // Temporary ID, normally backend returns this
          role: "agent",
          content: response.response,
          timestamp: new Date(),
        };

        // If the backend returns the message ID in response, use it here.
        // For now, if we want to rate immediately, we might need to reload or update the ID.
        // Assuming api.chat returns just text. If we want to rate "just sent" messages, 
        // we'd ideally need the ID. For history messages, ID is correct.

        setMessages((prev) => [...prev, agentMsg]);

        if (onMessageSent) {
          onMessageSent();
        }
      } else {
        await handleTrainingFlow(userMsg.content);
      }
    } catch (error: any) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: "agent",
        content: `⚠️ Error: ${error.message || "Unknown error occurred"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (messageId: string, rating: number) => {
    // 1. Optimistic UI Update
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, rating } : msg
    ));

    // 2. API Call
    // Note: If messageId is generated on frontend (Date.now), this will fail 
    // until the message is reloaded from backend with real ID.
    // In a real app, the chat response should return the real Message ID.
    await api.submitFeedback(messageId, rating);
  };

  const handleTrainingFlow = async (userInput: string) => {
    let newContext = accumulatedContext;
    let newQaPairs = [...qaPairs];

    if (trainingStep === 'initial') {
      newContext = userInput;
      setAccumulatedContext(newContext);
      setTrainingStep('answering');
      if (topicId) {
        api.addKnowledge(agentId, topicId, userInput).catch(err => console.error("Auto-save initial failed", err));
      }
    } else {
      const lastQuestion = currentQuestions.length > 0 ? currentQuestions[0] : "General Clarification";
      const qaEntry = { q: lastQuestion, a: userInput };
      newQaPairs.push(qaEntry);
      setQaPairs(newQaPairs);

      newContext += `\n\nQ: ${lastQuestion}\nA: ${userInput}`;
      setAccumulatedContext(newContext);

      if (topicId) {
        const knowledgeText = `Q: ${lastQuestion}\nA: ${userInput}`;
        api.addKnowledge(agentId, topicId, knowledgeText).catch(err => console.error("Auto-save failed", err));
      }
    }

    if (topicId) {
      const analysis = await api.analyzeTrainingText(agentId, topicId, newContext);

      if (analysis) {
        setConfidence(analysis.confidence_score || 0);
        setCurrentQuestions(analysis.questions || []);

        let responseText = "";
        if (analysis.confidence_score >= 90) {
          responseText = "I think I have a great understanding now! You can finalize this knowledge or continue teaching me.";
        } else {
          responseText = "Thanks! I have a few more questions to make sure I understand correctly:\n\n";
          analysis.questions.forEach((q: string) => {
            responseText += `• ${q}\n`;
          });
        }

        const agentMsg: Message = {
          id: Date.now().toString(),
          role: "agent",
          content: responseText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, agentMsg]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-opacity-10", agentColor)}>
            {mode === 'training' ? <GraduationCap size={18} className={cn("text-opacity-100", agentColor.replace("bg-", "text-"))} /> : <Bot size={18} className={cn("text-opacity-100", agentColor.replace("bg-", "text-"))} />}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{mode === 'training' ? `Training: ${topicName}` : agentName}</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs text-slate-500">Online</span>
            </div>
          </div>
        </div>

        {mode === 'training' && (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-xs font-medium text-slate-500 mb-1">Confidence Score</span>
              <div className="flex items-center gap-2 w-32">
                <Progress value={confidence} className="h-2" />
                <span className="text-xs font-bold text-slate-700">{confidence}%</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-green-600 text-xs font-medium animate-pulse">
              <CheckCircle size={12} /> Auto-saving
            </div>
          </div>
        )}

        {mode === 'chat' && (
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Sparkles size={16} className="text-slate-400" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {loadingSummary && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="ml-3 text-slate-500 text-sm">Loading knowledge summary...</span>
          </div>
        )}

        {!loadingSummary && (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  msg.role === "user" ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  msg.role === "user" ? "bg-slate-900 text-white" : cn("bg-opacity-10", agentColor)
                )}>
                  {msg.role === "user" ? <User size={14} /> : (mode === 'training' ? <GraduationCap size={14} className={agentColor.replace("bg-", "text-")} /> : <Bot size={14} className={agentColor.replace("bg-", "text-")} />)}
                </div>

                <div className="group relative">
                  <div className={cn(
                    "p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-slate-900 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-tl-none"
                  )}>
                    {msg.content}
                  </div>

                  {/* Rating Buttons - Only for Agents in Chat Mode with a real Conversation */}
                  {msg.role === 'agent' && mode === 'chat' && conversationId && (
                    <div className="absolute -bottom-7 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                      <button
                        onClick={() => handleRate(msg.id, 1)}
                        className={cn(
                          "p-1.5 rounded-full hover:bg-green-50 transition-colors",
                          msg.rating === 1 ? "text-green-600 bg-green-50" : "text-slate-400"
                        )}
                        title="Helpful"
                      >
                        <ThumbsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleRate(msg.id, -1)}
                        className={cn(
                          "p-1.5 rounded-full hover:bg-red-50 transition-colors",
                          msg.rating === -1 ? "text-red-600 bg-red-50" : "text-slate-400"
                        )}
                        title="Not Helpful"
                      >
                        <ThumbsDown size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 max-w-[85%]"
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-opacity-10", agentColor)}>
              {mode === 'training' ? <GraduationCap size={14} className={agentColor.replace("bg-", "text-")} /> : <Bot size={14} className={agentColor.replace("bg-", "text-")} />}
            </div>
            <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="relative flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={mode === 'training' ? "Explain the topic or answer questions..." : "Type a message..."}
            className="min-h-[50px] max-h-[150px] resize-none pr-12 py-3 rounded-xl border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </Button>
        </div>
        <div className="text-center mt-2">
          <p className="text-[10px] text-slate-400">AI can make mistakes. Check important info.</p>
        </div>
      </div>
    </div>
  );
}