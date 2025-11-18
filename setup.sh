#!/bin/bash

echo "🚀 AI Code Review Platform - Setup Script"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${YELLOW}Checking Node.js version...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js >= 18.0.0${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version must be >= 18.0.0. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js version: $(node -v)${NC}"

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm version: $(npm -v)${NC}"

# Check Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}⚠️  Docker is not installed. You'll need to install Docker to run databases.${NC}"
else
    echo -e "${GREEN}✅ Docker is installed${NC}"
fi

echo ""
echo "📦 Installing dependencies..."
echo "=============================="

# Install root dependencies
echo -e "${YELLOW}Installing root dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Root dependencies installed${NC}"

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd frontend && npm install && cd ..
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd backend && npm install && cd ..
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

echo ""
echo "🔧 Setting up environment variables..."
echo "======================================"

# Setup backend .env
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}Creating backend/.env from backend/.env.example...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${GREEN}✅ backend/.env created${NC}"
    echo -e "${YELLOW}⚠️  Please update backend/.env with your actual values:${NC}"
    echo "   - JWT_SECRET"
    echo "   - GITHUB_CLIENT_ID"
    echo "   - GITHUB_CLIENT_SECRET"
    echo "   - ANTHROPIC_API_KEY"
else
    echo -e "${GREEN}✅ backend/.env already exists${NC}"
fi

# Setup frontend .env
if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}Creating frontend/.env from frontend/.env.example...${NC}"
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✅ frontend/.env created${NC}"
else
    echo -e "${GREEN}✅ frontend/.env already exists${NC}"
fi

echo ""
echo "🐳 Starting Docker containers..."
echo "================================"

if command -v docker &> /dev/null; then
    docker-compose up -d
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Docker containers started (PostgreSQL, Redis)${NC}"
    else
        echo -e "${RED}❌ Failed to start Docker containers${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available. Skipping container startup.${NC}"
    echo "   Please start PostgreSQL and Redis manually."
fi

echo ""
echo "🗄️  Setting up database..."
echo "=========================="

# Wait for PostgreSQL to be ready
echo -e "${YELLOW}Waiting for PostgreSQL to be ready...${NC}"
sleep 5

# Generate Prisma Client
echo -e "${YELLOW}Generating Prisma Client...${NC}"
cd backend && npx prisma generate
echo -e "${GREEN}✅ Prisma Client generated${NC}"

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npx prisma migrate dev --name init
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database migrations completed${NC}"
else
    echo -e "${RED}❌ Database migrations failed${NC}"
    echo "   Please check your DATABASE_URL in backend/.env"
fi
cd ..

echo ""
echo "✨ Setup complete!"
echo "=================="
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your API keys:"
echo "   - ANTHROPIC_API_KEY (required for AI features)"
echo "   - GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET (optional for GitHub OAuth)"
echo ""
echo "2. Start the development servers:"
echo "   npm run dev"
echo ""
echo "3. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "For more information, see README.md"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
