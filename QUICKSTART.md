# 🚀 Quick Start - PDF Q&A Assistant

Get up and running in 5 minutes!

## Prerequisites

- Python 3.10+
- Node.js 18+
- Docker (for PostgreSQL)
- Anthropic API Key ([get one here](https://console.anthropic.com/))

## Setup (Automated)

```bash
# Run the setup script
./setup-pdf-qa.sh
```

## Setup (Manual)

### 1. Start Database

```bash
docker-compose up -d
```

### 2. Setup Backend

```bash
cd backend-flask

# Create virtual environment and install dependencies
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

# Initialize database
python -c "from app import db; db.create_all()"

# Start backend
python app.py
```

Backend runs on **http://localhost:5000**

### 3. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install and start
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

## Usage

1. **Sign up** at http://localhost:5173
2. **Upload a PDF** using the "+ Upload PDF" button
3. **Ask questions** about your PDF in natural language
4. **View answers** with source citations

## Example Questions

- "What is this document about?"
- "Summarize the main findings"
- "What are the key recommendations?"

## Troubleshooting

### Backend won't start
- Check `.env` has valid `ANTHROPIC_API_KEY`
- Ensure PostgreSQL is running: `docker-compose ps`

### Frontend can't connect
- Verify backend is running on port 5000
- Check `frontend/.env` has `VITE_API_URL=http://localhost:5000`

### PDF processing fails
- Ensure PDF is not encrypted or corrupted
- Check file size is under 100MB

## What's Next?

Read the full documentation: [PDF_QA_ASSISTANT_README.md](./PDF_QA_ASSISTANT_README.md)

---

**Need help?** Check the [troubleshooting section](./PDF_QA_ASSISTANT_README.md#-troubleshooting) in the full README.
