# Knowledge Buddy 🧠

**Knowledge Buddy** is an intelligent, AI-powered knowledge management agent designed to democratize access to organizational knowledge. It allows users to create custom agents, train them with documents, and interact with them to get accurate, context-aware answers.

## 🚀 Key Features

- **Custom AI Agents**: Create specialized agents with unique personalities and roles.
- **RAG-Based Q&A**: Uses Retrieval-Augmented Generation to answer questions based on your uploaded documents.
- **Apprentice Mode**: Train your agents by uploading files (PDF, TXT, MD) or providing raw text.
- **Skill Execution**: Agents can execute Python-based skills to perform actions (e.g., fetch data, run calculations).
- **Knowledge Gap Detection**: Automatically detects when the agent doesn't know an answer and creates a "ticket" for human review.
- **Interactive Chat UI**: A modern, responsive chat interface with history and feedback mechanisms.

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (Metadata), ChromaDB (Vector Store)
- **LLM**: Google Gemini (via `google-generativeai`)
- **Libraries**: SQLAlchemy, Pydantic, pdfplumber, pytesseract

### Frontend
- **Framework**: Next.js 15 (React 19)
- **Styling**: Tailwind CSS, Framer Motion
- **Components**: Radix UI, Lucide React

## 📦 Installation & Setup

### Prerequisites
- Python 3.9+
- Node.js 18+
- Google API Key (for Gemini models)

### 1. Backend Setup

Navigate to the `api` directory:
```bash
cd api
```

Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

Install dependencies:
```bash
pip install -r requirements.txt
```

Create a `.env` file in the `api` directory and add your Google API Key:
```env
GOOGLE_API_KEY=your_api_key_here
```

Run the server:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

Navigate to the `ui` directory:
```bash
cd ui
```

Install dependencies:
```bash
npm install
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📖 Usage

1.  **Create an Agent**: Go to the dashboard and click "Create New Agent".
2.  **Train the Agent**: Click on the agent card, go to "Knowledge Base", and upload documents or add text.
3.  **Chat**: Start a conversation with your agent. Ask questions based on the training data.
4.  **Teach Skills**: Add Python scripts as "Skills" to give your agent new capabilities.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
