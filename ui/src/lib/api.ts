// src/lib/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = {
  // ... keep existing getAgents, getAgentById, createAgent, deleteAgent ...

  getAgents: async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching agents:", error);
      return [];
    }
  },

  getAgentById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      return null;
    }
  },

  createAgent: async (agent: any) => {
    try {
      const response = await axios.post(`${API_URL}/agents`, agent);
      return response.data;
    } catch (error) {
      console.error("Error creating agent:", error);
      return null;
    }
  },

  deleteAgent: async (id: string) => {
    try {
      await axios.delete(`${API_URL}/agents/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting agent:", error);
      return false;
    }
  },

  // --- FIXING CHAT TO SHOW REAL ERRORS ---
  chat: async (agentId: string, message: string) => {
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        agent_id: agentId,
        message: message
      });
      return response.data;
    } catch (error: any) {
      console.error("Error chatting:", error.response?.data || error.message);
      // Return the actual error message from backend if available
      const errorMessage = error.response?.data?.detail || "Error connecting to agent.";
      throw new Error(errorMessage);
    }
  },

  chatWithConversation: async (agentId: string, message: string, conversationId?: string) => {
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        agent_id: agentId,
        message: message,
        conversation_id: conversationId
      });
      return response.data;
    } catch (error: any) {
      console.error("Error chatting:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || "Error connecting to agent.";
      throw new Error(errorMessage);
    }
  },
  // --- END FIX ---

  getKnowledgeGaps: async (agentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/gaps`);
      return response.data;
    } catch (error) {
      console.error("Error fetching gaps:", error);
      return [];
    }
  },

  getTopics: async (agentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/topics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching topics:", error);
      return [];
    }
  },

  createTopic: async (agentId: string, name: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics?name=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.error("Error creating topic:", error);
      return null;
    }
  },

  addKnowledge: async (agentId: string, topicId: string, text: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics/${topicId}/knowledge`, {
        text: text
      });
      return response.data;
    } catch (error) {
      console.error("Error adding knowledge:", error);
      return null;
    }
  },

  teachAgent: async (gapId: string, answer: string) => {
    console.log(`Trained Gap ${gapId} with: ${answer}`);
    return { success: true };
  },

  deleteTopic: async (agentId: string, topicId: string) => {
    try {
      await axios.delete(`${API_URL}/agents/${agentId}/topics/${topicId}`);
      return true;
    } catch (error) {
      console.error("Error deleting topic:", error);
      return false;
    }
  },

  analyzeTrainingText: async (agentId: string, topicId: string, text: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics/${topicId}/training/analyze`, {
        text: text
      });
      return response.data;
    } catch (error) {
      console.error("Error analyzing text:", error);
      return null;
    }
  },

  finalizeTraining: async (agentId: string, topicId: string, originalText: string, qaPairs: any[]) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics/${topicId}/training/finalize`, {
        original_text: originalText,
        qa_pairs: qaPairs
      });
      return response.data;
    } catch (error) {
      console.error("Error finalizing training:", error);
      return null;
    }
  },

  resolveGap: async (agentId: string, text: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/gaps/resolve`, {
        text: text
      });
      return response.data;
    } catch (error) {
      console.error("Error resolving gap:", error);
      return null;
    }
  },

  getTopicSummary: async (agentId: string, topicId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/topics/${topicId}/summary`);
      return response.data.summary;
    } catch (error) {
      console.error("Error fetching topic summary:", error);
      return "I don't know anything about this topic yet.";
    }
  },

  getChatHistory: async (agentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/chat/history`);
      return response.data;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  },

  createConversation: async () => {
    try {
      const response = await axios.post(`${API_URL}/conversations`);
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  },

  getConversations: async () => {
    try {
      const response = await axios.get(`${API_URL}/conversations`);
      return response.data;
    } catch (error) {
      console.error("Error fetching conversations:", error);
      return [];
    }
  },

  getConversationMessages: async (conversationId: string) => {
    try {
      const response = await axios.get(`${API_URL}/conversations/${conversationId}/messages`);
      return response.data;
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      return [];
    }
  },

  updateConversation: async (conversationId: string, title: string) => {
    try {
      const response = await axios.patch(`${API_URL}/conversations/${conversationId}?title=${encodeURIComponent(title)}`);
      return response.data;
    } catch (error) {
      console.error("Error updating conversation:", error);
      return null;
    }
  },

  deleteConversation: async (conversationId: string) => {
    try {
      const response = await axios.delete(`${API_URL}/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting conversation:", error);
      return null;
    }
  },

  submitFeedback: async (messageId: string, rating: number) => {
    try {
      await axios.post(`${API_URL}/messages/${messageId}/feedback`, { rating });
      return true;
    } catch (error) {
      console.error("Error submitting feedback:", error);
      return false;
    }
  },
};