# 📄 PDF Q&A Assistant - MVP

An AI-powered application that lets users upload PDF documents and ask questions about them using natural language. Built with LangChain, Flask, React, and Claude AI.

## 🎯 Core Features

✅ **PDF Upload**: Upload PDF documents up to 100MB
✅ **Text Extraction**: Automatically extract and chunk text from PDFs
✅ **Vector Storage**: Store document embeddings using ChromaDB
✅ **Q&A System**: Ask questions and get accurate answers with source citations
✅ **Chat History**: Maintain conversation history for each PDF
✅ **Document Summary**: Generate comprehensive summaries of entire documents

## 🏗️ Architecture

### Backend (Flask + LangChain)
- **Flask**: Lightweight Python web framework
- **LangChain**: Orchestration framework for LLM applications
- **ChromaDB**: Vector database for semantic search
- **Claude AI**: Anthropic's language model for answering questions
- **HuggingFace Embeddings**: Free sentence-transformers for text embeddings
- **PostgreSQL**: Database for storing user data and metadata

### Frontend (React + TypeScript)
- **React 18**: Modern UI library
- **TypeScript**: Type-safe JavaScript
- **TailwindCSS**: Utility-first CSS framework
- **Vite**: Fast build tool

## 📋 Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 15+**
- **Anthropic API Key** (get one at https://console.anthropic.com/)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd claude_test
```

### 2. Backend Setup

```bash
cd backend-flask

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
```

**Required environment variables in `.env`:**
```env
ANTHROPIC_API_KEY=your-api-key-here
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pdf_qa_db
SECRET_KEY=your-secret-key
CORS_ORIGIN=http://localhost:5173
```

### 3. Database Setup

```bash
# Start PostgreSQL (using Docker Compose)
cd ..
docker-compose up -d

# Run migrations
cd backend-flask
flask db upgrade  # If migrations exist
# Or initialize the database
python
>>> from app import db
>>> db.create_all()
>>> exit()
```

### 4. Start Backend

```bash
cd backend-flask
python app.py
```

Backend will run on `http://localhost:5000`

### 5. Frontend Setup

```bash
# Open new terminal
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000
```

### 6. Start Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 📖 Usage

### 1. Sign Up / Login
- Navigate to `http://localhost:5173`
- Create an account or log in

### 2. Upload a PDF
- Click **+ Upload PDF** button
- Select a PDF file (max 100MB)
- Wait for processing to complete (few seconds to minutes depending on size)

### 3. Ask Questions
- Select your uploaded PDF from the sidebar
- Type a question in the chat input
- Press **Send** or hit Enter
- View the AI-generated answer with source context

### 4. Generate Summary
- Select a PDF
- Click **Generate Summary** button
- Get a comprehensive overview of the document

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### PDF Operations
- `POST /api/pdfs/upload` - Upload and process PDF
- `GET /api/pdfs` - List all user PDFs
- `GET /api/pdfs/:id` - Get PDF details
- `DELETE /api/pdfs/:id` - Delete PDF
- `POST /api/pdfs/:id/ask` - Ask question about PDF
- `GET /api/pdfs/:id/history` - Get chat history
- `POST /api/pdfs/:id/summary` - Generate summary

## 📂 Project Structure

```
claude_test/
├── backend-flask/
│   ├── api/
│   │   ├── auth_routes.py      # Authentication endpoints
│   │   └── pdf_routes.py       # PDF Q&A endpoints
│   ├── services/
│   │   ├── pdf_service.py      # PDF processing logic
│   │   └── qa_service.py       # Q&A with LangChain
│   ├── models/
│   │   └── models.py           # Database models
│   ├── app.py                  # Flask app entry point
│   └── requirements.txt        # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   └── PDFChat.tsx     # Main PDF Q&A interface
│   │   ├── services/
│   │   │   └── pdfService.ts   # API client for PDF operations
│   │   └── App.tsx             # React app router
│   └── package.json            # Node dependencies
│
└── docker-compose.yml          # PostgreSQL setup
```

## 🧪 Testing

### Test the Backend API

```bash
# Health check
curl http://localhost:5000/health

# Upload PDF (requires authentication token)
curl -X POST http://localhost:5000/api/pdfs/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@sample.pdf"

# Ask question
curl -X POST http://localhost:5000/api/pdfs/:pdf_id/ask \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic?"}'
```

## 🎨 Features in Detail

### PDF Processing Pipeline

1. **Upload**: User uploads PDF via frontend
2. **Storage**: File saved to `./uploads` directory
3. **Extraction**: Text extracted using PyPDF
4. **Chunking**: Text split into chunks (1000 chars, 200 overlap)
5. **Embedding**: Chunks converted to vectors using HuggingFace
6. **Storage**: Vectors stored in ChromaDB
7. **Ready**: PDF ready for questions

### Q&A System

1. **Question**: User asks natural language question
2. **Retrieval**: Top 4 relevant chunks retrieved from ChromaDB
3. **Context**: Chunks provided as context to Claude AI
4. **Answer**: Claude generates accurate answer with citations
5. **History**: Q&A saved to database

## 🔐 Security Notes

- All endpoints require JWT authentication
- Users can only access their own PDFs
- File uploads are validated (PDF only, max 100MB)
- Sensitive data should use environment variables

## 🚢 Deployment

### Option 1: Vercel (Serverless)

```bash
# Deploy backend
cd backend-flask
vercel --prod

# Deploy frontend
cd frontend
vercel --prod
```

### Option 2: Docker

```bash
# Build and run with Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Option 3: Traditional Hosting (Railway, Heroku, etc.)

- Set environment variables on platform
- Deploy backend and frontend separately
- Ensure PostgreSQL database is provisioned

## 🛠️ Technologies Used

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend Framework | Flask | Lightweight Python web server |
| AI Orchestration | LangChain | Chains, retrievers, prompts |
| LLM | Claude 3.5 Sonnet | Question answering |
| Embeddings | HuggingFace (all-MiniLM-L6-v2) | Text vectorization |
| Vector DB | ChromaDB | Semantic search |
| PDF Processing | PyPDF | Text extraction |
| Database | PostgreSQL | User data and metadata |
| Frontend | React + TypeScript | Modern UI |
| Styling | TailwindCSS | Utility-first CSS |

## 📊 Success Criteria

✅ User can upload a PDF document
✅ User can ask: "Summarize section 2" → gets accurate answer
✅ System responds in under 5 seconds
✅ Answers include source context from the PDF
✅ Chat history is preserved per document

## 🔄 Future Enhancements (Beyond MVP)

- [ ] Support for multiple file formats (DOCX, TXT, etc.)
- [ ] OCR for scanned PDFs
- [ ] Multi-PDF search across all documents
- [ ] Export chat history to PDF
- [ ] Advanced filters (date, relevance, keywords)
- [ ] Collaborative features (share PDFs with team)
- [ ] Speech-to-text for voice questions
- [ ] Integration with cloud storage (Google Drive, Dropbox)

## 📝 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues or questions:
1. Check the troubleshooting section below
2. Review API documentation
3. Open an issue on GitHub

## 🐛 Troubleshooting

### Issue: "ANTHROPIC_API_KEY not found"
**Solution**: Add your API key to `backend-flask/.env`

### Issue: "Database connection error"
**Solution**: Ensure PostgreSQL is running (`docker-compose up -d`)

### Issue: "PDF processing failed"
**Solution**: Check PDF is not corrupted or encrypted

### Issue: "Slow responses"
**Solution**: Use smaller PDFs or increase chunk retrieval limit

### Issue: "Module not found" errors
**Solution**:
```bash
# Backend
cd backend-flask
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

## 🎓 How It Works

This application implements a **Retrieval-Augmented Generation (RAG)** pattern:

1. **Document Loading**: PDFs are loaded and split into chunks
2. **Embedding**: Chunks are converted to numerical vectors
3. **Vector Storage**: Vectors stored in ChromaDB for fast similarity search
4. **Retrieval**: When a question is asked, relevant chunks are retrieved
5. **Generation**: Claude AI uses the retrieved context to generate answers

This approach ensures:
- ✅ Accurate answers grounded in the document
- ✅ No hallucinations (AI doesn't make up information)
- ✅ Source attribution (you can see where answers come from)
- ✅ Scalability (works with large documents)

## 🌟 Example Questions to Try

- "What is the main topic of this document?"
- "Summarize the key findings in section 3"
- "What are the conclusions?"
- "List all the recommendations mentioned"
- "Explain the methodology used"
- "What are the limitations discussed?"

---

**Built with ❤️ using LangChain, Flask, React, and Claude AI**
