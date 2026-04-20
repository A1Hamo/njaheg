@echo off
echo =======================================================
echo    Starting HKUDS DeepTutor Engine (Docker Mode)
echo =======================================================
echo.
echo NOTE: Since native Python 3.13 compilation failed, we are 
echo running DeepTutor natively through Docker to bypass Windows 
echo C++ build tools requirements.
echo.

cd DeepTutor

echo 1. Copying .env.example to .env if it doesn't exist...
if not exist .env copy .env.example .env

echo 2. Building and Starting Docker Containers...
docker-compose up -d --build

echo.
echo =======================================================
echo DeepTutor is now running in the background!
echo Backend API: http://localhost:8001
echo =======================================================
pause
