// src/lib/api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const api = {
  // 1. GET ALL AGENTS
  getAgents: async () => {
    try {
      const response = await axios.get(`${API_URL}/agents`);
      return response.data;
    } catch (error) {
      console.error("Error fetching agents:", error);
      return [];
    }
  },

  // 2. GET SINGLE AGENT
  getAgentById: async (id: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching agent ${id}:`, error);
      return null;
    }
  },

  // 3. CREATE AGENT
  createAgent: async (agent: any) => {
    try {
      const response = await axios.post(`${API_URL}/agents`, agent);
      return response.data;
    } catch (error) {
      console.error("Error creating agent:", error);
      return null;
    }
  },

  // 3b. DELETE AGENT
  deleteAgent: async (id: string) => {
    try {
      await axios.delete(`${API_URL}/agents/${id}`);
      return true;
    } catch (error) {
      console.error("Error deleting agent:", error);
      return false;
    }
  },

  // 4. CHAT
  chat: async (agentId: string, message: string) => {
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        agent_id: agentId,
        message: message
      });
      return response.data;
    } catch (error) {
      console.error("Error chatting:", error);
      return { response: "Error connecting to agent.", source: "error" };
    }
  },

  // 5. FETCH GAPS
  getKnowledgeGaps: async (agentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/gaps`);
      return response.data;
    } catch (error) {
      console.error("Error fetching gaps:", error);
      return [];
    }
  },

  // 5a. GET TOPICS
  getTopics: async (agentId: string) => {
    try {
      const response = await axios.get(`${API_URL}/agents/${agentId}/topics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching topics:", error);
      return [];
    }
  },

  // 5b. CREATE TOPIC
  createTopic: async (agentId: string, name: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics?name=${encodeURIComponent(name)}`);
      return response.data;
    } catch (error) {
      console.error("Error creating topic:", error);
      return null;
    }
  },

  // 6. ADD KNOWLEDGE
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

  // 7. TEACH AGENT (Mock for now)
  teachAgent: async (gapId: string, answer: string) => {
    console.log(`Trained Gap ${gapId} with: ${answer}`);
    return { success: true };
  },

  // 8. DELETE TOPIC
  deleteTopic: async (agentId: string, topicId: string) => {
    try {
      await axios.delete(`${API_URL}/agents/${agentId}/topics/${topicId}`);
      return true;
    } catch (error) {
      console.error("Error deleting topic:", error);
      return false;
    }
  },

  // 9. APPRENTICE MODE: ANALYZE
  analyzeTrainingText: async (agentId: string, topicId: string, text: string) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics/${topicId}/training/analyze`, {
        text: text
      });
      return response.data; // { questions: [...] }
    } catch (error) {
      console.error("Error analyzing text:", error);
      return null;
    }
  },

  // 10. APPRENTICE MODE: FINALIZE
  finalizeTraining: async (agentId: string, topicId: string, originalText: string, qaPairs: any[]) => {
    try {
      const response = await axios.post(`${API_URL}/agents/${agentId}/topics/${topicId}/training/finalize`, {
        original_text: originalText,
        qa_pairs: qaPairs
      });
      return response.data; // { status: "success", crystallized_text: "..." }
    } catch (error) {
      console.error("Error finalizing training:", error);
      return null;
    }
  }
};