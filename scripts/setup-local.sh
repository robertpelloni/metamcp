#!/bin/bash
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== MetaMCP Local Setup ===${NC}"

# Check for pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed.${NC}"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi

# Check for Postgres
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}Warning: psql command not found.${NC}"
    echo "Ensure you have PostgreSQL installed and running locally."
    echo "Or use the Docker setup if you don't want to install Postgres."
fi

echo -e "${GREEN}Installing dependencies...${NC}"
pnpm install

echo -e "${GREEN}Building project...${NC}"
pnpm build

# Check for .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${YELLOW}Please edit .env to set your DATABASE_URL and OPENAI_API_KEY.${NC}"
    else
        echo -e "${RED}Error: .env.example not found.${NC}"
    fi
else
    echo -e "${GREEN}.env file found.${NC}"
fi

echo -e "${BLUE}=== Setup Complete ===${NC}"
echo "To run the database (with Docker) if you don't have local Postgres:"
echo "  docker-compose up -d db"
echo ""
echo "To run migrations:"
echo "  pnpm db:migrate"
echo ""
echo "To start the development server:"
echo "  pnpm dev"
echo ""
