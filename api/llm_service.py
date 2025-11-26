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

    def generate_response(self, prompt: str):
        """
        Generates a response using gemini-1.5-flash.
        """
        if not self.api_key:
            return "I'm sorry, I can't answer that right now because my brain (API Key) is missing."

        url = f"{self.base_url}/gemini-flash-latest:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }]
        }

        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            print(f"Error generating response: {e}")
            return "I encountered an error while thinking."

    def analyze_text(self, text: str):
        """
        Analyzes text for gaps and generates clarifying questions (Critic + Interviewer).
        """
        prompt = f"""You are a smart junior employee who just read some training material. Your job is to understand what you read, then ask your manager (the user) smart clarifying questions about things that are unclear or missing.

First, read and understand this training material:
"{text}"

Now, think like a junior employee:
- What specific details are missing that you'd need to actually do this job?
- What edge cases or exceptions aren't covered?
- What would happen in real scenarios that aren't mentioned?

Ask 3 natural, conversational questions that show you understood the material but need clarification on specific gaps. Make them sound like a real person asking, not a robot.

Also, estimate your current "Confidence Score" (0-100) on how well you understand the full picture based ONLY on this text.
- 100 = I know everything needed to execute perfectly.
- 0 = I have no idea what's going on.

Return ONLY a JSON object with:
- "questions": a list of 3 strings.
- "confidence_score": an integer (0-100).

Example: {{"questions": ["Question 1?", "Question 2?", "Question 3?"], "confidence_score": 45}}
"""
        response = self.generate_response(prompt)
        try:
            # Clean up potential markdown code blocks
            cleaned = response.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except:
            print(f"Error parsing analysis response: {response}")
            return {
                "questions": ["Could you provide more details?", "Are there any exceptions?", "What is the specific scope?"],
                "confidence_score": 10
            }

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
