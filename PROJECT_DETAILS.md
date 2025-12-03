# Project Details: Knowledge Buddy

## 1. Problem Statement
In many organizations, knowledge is siloed, scattered across various documents, or locked in the heads of a few experts. This leads to:
- **Repetitive Support Queries**: Experts spend valuable time answering the same questions repeatedly.
- **Slow Onboarding**: New employees struggle to find the information they need to get up to speed.
- **Information Loss**: Critical knowledge is lost when employees leave.
- **Inefficiency**: Time is wasted searching for documents or waiting for email responses.

## 2. Objective
The objective of **Knowledge Buddy** is to create an intelligent, always-available AI agent that can:
- Centralize and democratize access to organizational knowledge.
- Provide instant, accurate answers to user queries based on internal data.
- Learn and adapt over time through an "Apprentice Mode" and feedback loops.
- Execute tasks via "Skills" to go beyond just answering questions.

## 3. Solution
**Knowledge Buddy** bridges the gap between **Generative AI** and **Agentic AI** to create a truly autonomous knowledge assistant.

### 3.1 Generative AI Layer (Knowledge & Reasoning)
The foundation is a Retrieval-Augmented Generation (RAG) system that:
- **Knowledge Ingestion**: Users can upload PDFs, text files, or paste content directly. The system chunks and embeds this data into a vector store.
- **Context-Aware Chat**: When a user asks a question, the system retrieves relevant context from the vector store and feeds it to the LLM to generate an accurate answer.
- **Knowledge Gap Loop**: If the system cannot find the answer, it explicitly states so and logs a "Knowledge Gap" ticket. This alerts administrators to add the missing information, ensuring continuous improvement.

### 3.2 Agentic AI Layer (Action & Execution)
This is where Knowledge Buddy transcends traditional chatbots:

#### **Skills System**
Agents can execute Python-based skills to perform real-world tasks:
- **Custom Actions**: Write Python code that the agent can invoke (e.g., "Check server status", "Calculate ROI", "Send notifications").
- **Tool Calling**: The LLM intelligently decides when to use a skill based on user intent.
- **Sandboxed Execution**: Skills run in a controlled environment with parameter validation.

#### **MCP Server Integration** (Model Context Protocol)
Knowledge Buddy supports **MCP servers**, enabling agents to:
- **Connect to External Systems**: Integrate with databases, APIs, file systems, and third-party services.
- **Perform Complex Workflows**: Chain multiple actions together (e.g., "Fetch data from CRM → Analyze → Generate report → Email stakeholders").
- **Eliminate Repetitive Tasks**: Automate time-wasting activities that don't require human judgment.

**Examples of Agentic Capabilities:**
- "Check the status of all production servers and alert me if any are down."
- "Pull last quarter's sales data, calculate growth rate, and create a summary report."
- "Monitor this Slack channel and summarize key decisions every Friday."

> **Key Distinction**: Generative AI *answers questions*. Agentic AI *takes action*.

## 4. Tech Stack

| Component | Technology | Description |
|-----------|------------|-------------|
| **Backend API** | FastAPI | High-performance Python web framework. |
| **LLM Provider** | Google Gemini | Generative AI model for reasoning and embedding. |
| **Vector Store** | ChromaDB | Local vector database for semantic search. |
| **Database** | SQLite | Relational DB for storing agents, conversations, and metadata. |
| **ORM** | SQLAlchemy | Python SQL toolkit and Object Relational Mapper. |
| **Frontend** | Next.js 15 | React framework for building the user interface. |
| **Styling** | Tailwind CSS | Utility-first CSS framework. |
| **UI Components** | Radix UI | Unstyled, accessible components for building high-quality design systems. |

## 5. Architecture Diagram

```mermaid
graph TD
    User[User] -->|Interacts| UI[Next.js Frontend]
    UI -->|HTTP Requests| API[FastAPI Backend]
    
    subgraph "Backend Services"
        API -->|CRUD| DB[(SQLite Database)]
        API -->|Embed/Query| VectorDB[(ChromaDB)]
        API -->|Generate/Embed| LLM[Google Gemini API]
        API -->|Execute| Skills[Skill Runner (Python Exec)]
    end
    
    subgraph "Data Flow"
        Docs[Documents/Text] -->|Upload| API
        API -->|Chunk & Embed| VectorDB
        Query[User Query] -->|Search| VectorDB
        VectorDB -->|Context| API
        API -->|Context + Query| LLM
        LLM -->|Response| API
    end
```

## 6. Generative AI vs Agentic AI: A Clear Distinction

| Aspect | Generative AI (Traditional) | Agentic AI (Knowledge Buddy) |
|--------|----------------------------|------------------------------|
| **Primary Function** | Answer questions, generate text | Execute tasks, take actions |
| **User Interaction** | "What is X?" | "Do X for me" |
| **Example Use Case** | "Explain our refund policy" | "Process this refund and notify the customer" |
| **Technology** | RAG + LLM (Gemini) | Skills + MCP Servers + Tool Calling |
| **Value Proposition** | Information retrieval | Task automation |
| **Implementation** | Vector DB + Prompt Engineering | Python execution + API integrations |

### Why This Matters:
- **Generative AI** reduces the time to *find* information.
- **Agentic AI** eliminates the time to *act* on that information.

Knowledge Buddy combines both, creating a system that doesn't just know—it *does*.

## 7. Potential Savings and Benefits

Implementing Knowledge Buddy can lead to significant operational improvements:

### 💰 Cost Savings
- **Reduced Support Costs**: By automating responses to common queries, support ticket volume can be reduced by **30-50%**.
- **Task Automation Savings**: Agentic AI can handle repetitive tasks (data entry, report generation, status checks), saving **5-10 hours per employee per week**.
- **Time Saved**: Employees save hours per week previously spent searching for information.

### 🚀 Operational Efficiency
- **Faster Onboarding**: New hires can get instant answers to process/policy questions, reducing ramp-up time.
- **24/7 Availability**: Knowledge is accessible anytime, anywhere, without waiting for human experts.
- **Autonomous Workflows**: MCP-enabled agents can execute multi-step processes without human intervention.

### 📈 Quality & Consistency
- **Standardized Answers**: Ensures everyone gets the same correct information, reducing compliance risks.
- **Continuous Improvement**: The "Knowledge Gap" feature ensures the knowledge base grows and stays relevant based on actual user needs.
- **Error Reduction**: Automated task execution reduces human error in repetitive processes.
