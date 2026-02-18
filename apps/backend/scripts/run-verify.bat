@echo off
set DATABASE_URL=postgres://metamcp:metamcp@localhost:5432/metamcp
call npx tsx apps/backend/scripts/verify-migration.ts
