@echo off
echo =========================================
echo    AI Health Planner - Startup Script
echo =========================================

echo.
echo [1/3] Starting Postgres Container...
:: Try to start the existing container first. If it doesn't exist, run a new one.
docker start health-planner-db 2>nul || docker run --name health-planner-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

:: Wait a few seconds for Postgres to fully boot up
timeout /t 3 /nobreak >nul

echo.
echo [2/3] Checking Database Tables...
call npx prisma migrate deploy

echo.
echo [3/3] Starting Next.js Server (Frontend & Backend)...
echo Server will be available at http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

call npm run dev
