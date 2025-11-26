import os
import requests
import json

class GoogleLLMService:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def get_embedding(self, text: str):
        """
        Generates embeddings for the given text using text-embedding-004.
        """
        if not self.api_key:
            print("Warning: GOOGLE_API_KEY not set. Returning mock embedding.")
            return [0.0] * 768

        url = f"{self.base_url}/text-embedding-004:embedContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "model": "models/text-embedding-004",
            "content": {"parts": [{"text": text}]}
        }

        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            data = response.json()
            return data["embedding"]["values"]
        except Exception as e:
            print(f"Error generating embedding: {e}")
            return [0.0] * 768

    def generate_response(self, prompt: str, skills: list = None):
        """
        Generates a response using gemini-1.5-flash.
        Supports tool calling if skills are provided.
        """
        if not self.api_key:
            return "I'm sorry, I can't answer that right now because my brain (API Key) is missing."

        url = f"{self.base_url}/gemini-flash-latest:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        
        # Base payload
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        # Add Tools if skills exist
        if skills:
            tools = []
            for skill in skills:
                # Parse parameters JSON string to dict if needed, or assume it's already dict/str
                try:
                    params = json.loads(skill.parameters) if isinstance(skill.parameters, str) else skill.parameters
                except:
                    params = {}

                tool_decl = {
                    "name": skill.name,
                    "description": skill.description,
                    "parameters": {
                        "type": "OBJECT",
                        "properties": params,
                        "required": list(params.keys()) if params else []
                    }
                }
                tools.append(tool_decl)
            
            if tools:
                payload["tools"] = [{"function_declarations": tools}]

        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            data = response.json()
            
            # Check for Tool Calls
            candidates = data.get("candidates", [])
            if not candidates:
                return "I'm not sure what to say."
                
            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            
            if not parts:
                 return "I'm not sure what to say."

            # Look for function call in parts
            for part in parts:
                if "functionCall" in part:
                    fn_call = part["functionCall"]
                    return {
                        "tool_call": True,
                        "name": fn_call["name"],
                        "args": fn_call.get("args", {})
                    }

            # Normal text response
            return parts[0]["text"]
            
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I encountered an error while thinking."

    def analyze_text(self, text: str):
        """
        Analyzes text for gaps and generates conversational questions.
        """
        prompt = f"""You are a smart, curious employee learning from your manager (the user).
        
        Material: "{text}"
        
        Your goal: Understand this fully so you can do your job.
        
        1. Identify what's missing or unclear.
        2. Ask 1-2 natural, short follow-up questions. Do NOT ask a list of 3 questions. Just ask what matters most right now.
        3. If you understand it well enough to start, just say so and ask for confirmation.
        
        Estimate your "Confidence Score" (0-100).
        
        Return JSON:
        {{
            "questions": ["Your conversational question here"],
            "confidence_score": 50
        }}
        """
        response = self.generate_response(prompt)
        try:
            cleaned = response.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except:
            return {
                "questions": ["Could you explain that in more detail?"],
                "confidence_score": 10
            }

    def suggest_topic_name(self, text: str):
        """
        Suggests a short topic name based on the text.
        """
        prompt = f"""Suggest a short, clear Topic Name (2-4 words) for this text or question:
        "{text}"
        
        Return ONLY the topic name. No quotes, no extra text.
        """
        return self.generate_response(prompt).strip()

    def summarize_text(self, text: str):
        """
        Generates a concise summary of the provided text.
        """
        prompt = f"""Summarize the following knowledge in 2-3 concise sentences. Focus on the key facts and rules.

Text:
{text}

Return ONLY the summary. No extra formatting."""
        return self.generate_response(prompt).strip()

    def enrich_knowledge(self, text: str):
        """
        Enriches raw knowledge text with better explanations and context.
        """
        prompt = f"""You are a knowledge curator. Take the following raw text and enrich it with:
- Clear explanations of concepts
- Helpful context and background
- Examples where appropriate
- Well-structured formatting

Raw text:
{text}

Return ONLY the enriched version. Make it clear, comprehensive, and well-explained."""
        return self.generate_response(prompt).strip()

    def generate_conversation_title(self, first_message: str):
        """
        Generates a short, descriptive title for a conversation based on the first message.
        """
        prompt = f"""Generate a short, descriptive title (3-5 words max) for a conversation that starts with this message:

"{first_message}"

Return ONLY the title, nothing else. Make it concise and informative."""
        return self.generate_response(prompt).strip()

    def crystallize_knowledge(self, original_text: str, qa_pairs: list):
        """
        Combines original text and Q&A into a structured policy block (Scribe).
        """
        qa_text = "\n".join([f"Q: {item['q']}\nA: {item['a']}" for item in qa_pairs])
        
        prompt = f"""
        You are an expert Scribe. Combine the original text and the following Q&A into a structured, formal policy block.
        
        Original Text: "{original_text}"
        
        Clarifications:
        {qa_text}
        
        Rules:
        1. Extract facts and rewrite them as formal rules.
        2. Explicitly state EXCEPTIONS and REQUIREMENTS.
        3. Do not use conversational filler (e.g., "Here is the policy").
        4. Format as a clean text block suitable for a knowledge base.
        """
        return self.generate_response(prompt)
