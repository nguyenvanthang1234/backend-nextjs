@echo off
echo Starting Redis with Docker...
docker run --name api-shop-redis -p 6379:6379 -d redis:latest
echo.
echo Redis started on port 6379
echo Test connection: redis-cli ping
pause
