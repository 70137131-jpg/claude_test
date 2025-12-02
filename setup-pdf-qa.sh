#!/bin/bash

# PDF Q&A Assistant Setup Script
# This script helps set up the PDF Q&A Assistant MVP

set -e  # Exit on error

echo "========================================="
echo "PDF Q&A Assistant - Setup Script"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Python is installed
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${YELLOW}Python 3 is not installed. Please install Python 3.10 or higher.${NC}"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${YELLOW}Node.js is not installed. Please install Node.js 18 or higher.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Python and Node.js found${NC}"
echo ""

# Setup Backend
echo -e "${BLUE}Setting up Flask backend...${NC}"
cd backend-flask

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  IMPORTANT: Edit backend-flask/.env and add your ANTHROPIC_API_KEY${NC}"
fi

# Create upload and vectorstore directories
mkdir -p uploads vectorstores

echo -e "${GREEN}✓ Backend setup complete${NC}"
echo ""

# Setup Frontend
cd ../frontend
echo -e "${BLUE}Setting up React frontend...${NC}"

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    echo "VITE_API_URL=http://localhost:5000" > .env
    echo "VITE_WS_URL=ws://localhost:5000" >> .env
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"
echo ""

# Database setup instructions
cd ..
echo -e "${BLUE}Database Setup${NC}"
echo "To start PostgreSQL using Docker:"
echo "  docker-compose up -d"
echo ""
echo "Then initialize the database:"
echo "  cd backend-flask"
echo "  source venv/bin/activate"
echo "  python"
echo "  >>> from app import db"
echo "  >>> db.create_all()"
echo "  >>> exit()"
echo ""

# Final instructions
echo -e "${GREEN}========================================="
echo "Setup Complete!"
echo "=========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo ""
echo "1. Start PostgreSQL:"
echo "   docker-compose up -d"
echo ""
echo "2. Add your Anthropic API key to backend-flask/.env:"
echo "   ANTHROPIC_API_KEY=your-api-key-here"
echo ""
echo "3. Initialize the database:"
echo "   cd backend-flask"
echo "   source venv/bin/activate"
echo "   python -c 'from app import db; db.create_all()'"
echo ""
echo "4. Start the backend (Terminal 1):"
echo "   cd backend-flask"
echo "   source venv/bin/activate"
echo "   python app.py"
echo ""
echo "5. Start the frontend (Terminal 2):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "6. Open your browser:"
echo "   http://localhost:5173"
echo ""
echo -e "${GREEN}Happy PDF Q&A! 📄✨${NC}"
