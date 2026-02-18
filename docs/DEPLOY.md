# MetaMCP Deployment

**Version:** 3.7.0
**Last Updated:** 2026-02-17

## 🚀 Docker Deployment (Recommended)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local scripts)

### Production Build
```bash
# 1. Build the images
docker compose -f docker-compose.yml build

# 2. Start the services
docker compose -f docker-compose.yml up -d
```

### Environment Variables
Ensure `.env` contains:
- `DATABASE_URL`: PostgreSQL connection string (pgvector required)
- `OPENAI_API_KEY`: For semantic search & agents
- `BETTER_AUTH_SECRET`: For authentication
- `APP_URL`: Public URL of the application

## 🛠️ Local Development

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL (if not using external)
docker compose -f docker-compose.dev.yml up -d postgres

# 3. Start Development Server
pnpm dev
```

## 🔄 Updating
1. `git pull`
2. `pnpm install`
3. `pnpm build`
4. `docker compose up -d --build`
