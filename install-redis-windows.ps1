# Script to install Redis on Windows
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  REDIS INSTALLATION FOR WINDOWS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$redisUrl = "https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip"
$downloadPath = "$env:TEMP\redis.zip"
$installPath = "C:\Redis"

Write-Host "📥 Downloading Redis..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $redisUrl -OutFile $downloadPath
    Write-Host "✅ Downloaded successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Download failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📦 Extracting Redis..." -ForegroundColor Yellow
if (Test-Path $installPath) {
    Write-Host "⚠️  Redis folder already exists at $installPath" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Installation cancelled." -ForegroundColor Red
        exit 0
    }
    Remove-Item -Path $installPath -Recurse -Force
}

Expand-Archive -Path $downloadPath -DestinationPath $installPath -Force
Write-Host "✅ Extracted to $installPath" -ForegroundColor Green

Write-Host ""
Write-Host "🚀 Starting Redis Server..." -ForegroundColor Yellow
Start-Process -FilePath "$installPath\redis-server.exe" -WorkingDirectory $installPath

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ REDIS INSTALLED & STARTED!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Redis Location: $installPath" -ForegroundColor White
Write-Host "🌐 Redis Port: 6379" -ForegroundColor White
Write-Host ""
Write-Host "COMMANDS:" -ForegroundColor Cyan
Write-Host "  Start Redis:  cd $installPath && .\redis-server.exe" -ForegroundColor White
Write-Host "  Test Redis:   cd $installPath && .\redis-cli.exe ping" -ForegroundColor White
Write-Host ""
Write-Host "Now you can run: npm start" -ForegroundColor Green
Write-Host ""

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$installPath*") {
    Write-Host "➕ Adding Redis to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$installPath", "User")
    Write-Host "✅ Added to PATH (restart terminal to use redis-cli globally)" -ForegroundColor Green
}

Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
