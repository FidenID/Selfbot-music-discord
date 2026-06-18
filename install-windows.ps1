# Bot-DC v2 - Windows Installation Script
# Run this script in PowerShell as Administrator

Write-Host "🎵 Selfbot Music Discord - Windows Installation Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠️  Please run this script as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Install Chocolatey if not installed
Write-Host "📦 Checking Chocolatey..." -ForegroundColor Yellow
if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
    Set-ExecutionPolicy Bypass -Scope Process -Force
    [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
    Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installed" -ForegroundColor Green
} else {
    Write-Host "✅ Chocolatey already installed" -ForegroundColor Green
}

# Install NVM for Windows
Write-Host ""
Write-Host "📦 Installing NVM for Windows..." -ForegroundColor Yellow
if (-not (Get-Command nvm -ErrorAction SilentlyContinue)) {
    choco install nvm -y
    refreshenv
    Write-Host "✅ NVM installed" -ForegroundColor Green
} else {
    Write-Host "✅ NVM already installed" -ForegroundColor Green
}

# Install Node.js 22 via NVM
Write-Host ""
Write-Host "📦 Installing Node.js 22..." -ForegroundColor Yellow
nvm install 22
nvm use 22
Write-Host "✅ Node.js installed" -ForegroundColor Green

# Install ffmpeg
Write-Host ""
Write-Host "📦 Installing ffmpeg..." -ForegroundColor Yellow
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
    choco install ffmpeg -y
    Write-Host "✅ ffmpeg installed" -ForegroundColor Green
} else {
    Write-Host "✅ ffmpeg already installed" -ForegroundColor Green
}

# Install yt-dlp
Write-Host ""
Write-Host "📦 Installing yt-dlp..." -ForegroundColor Yellow
if (-not (Get-Command yt-dlp -ErrorAction SilentlyContinue)) {
    choco install yt-dlp -y
    Write-Host "✅ yt-dlp installed" -ForegroundColor Green
} else {
    Write-Host "✅ yt-dlp already installed" -ForegroundColor Green
}

# Install Deno
Write-Host ""
Write-Host "📦 Installing Deno..." -ForegroundColor Yellow
if (-not (Get-Command deno -ErrorAction SilentlyContinue)) {
    choco install deno -y
    Write-Host "✅ Deno installed" -ForegroundColor Green
} else {
    Write-Host "✅ Deno already installed" -ForegroundColor Green
}

# Refresh environment variables
refreshenv

# Install Node.js dependencies
Write-Host ""
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
npm install
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Install PM2 globally
Write-Host ""
Write-Host "📦 Installing PM2..." -ForegroundColor Yellow
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    npm install -g pm2
    npm install -g pm2-windows-startup
    pm2-startup install
    Write-Host "✅ PM2 installed" -ForegroundColor Green
} else {
    Write-Host "✅ PM2 already installed" -ForegroundColor Green
}

# Create .env if not exists
Write-Host ""
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    @"
DISCORD_TOKEN=your_token_here
DISCORD_PREFIX=?
ALLOWED_USERS=
STEALTH=true
REPLY_DM=true
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ .env created - Please edit it with your Discord token" -ForegroundColor Green
} else {
    Write-Host "✅ .env already exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit .env file: notepad .env" -ForegroundColor White
Write-Host "2. Add your Discord token" -ForegroundColor White
Write-Host "3. Run: npm start (or pm2 start ecosystem.config.js)" -ForegroundColor White
Write-Host ""
Write-Host "Note: Restart your PowerShell to apply PATH changes" -ForegroundColor Yellow
