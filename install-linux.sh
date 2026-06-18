#!/bin/bash
set -e

echo "🎵 Bot-DC v2 - Linux Installation Script"
echo "========================================"

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please don't run this script as root"
   exit 1
fi

# Install NVM and Node.js 22
echo ""
echo "📦 Installing NVM and Node.js 22..."
if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
else
    echo "✅ NVM already installed"
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
fi

nvm install 22
nvm use 22
echo "✅ Node.js $(node --version) installed"

# Install ffmpeg
echo ""
echo "📦 Installing ffmpeg..."
if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg already installed"
else
    sudo apt update
    sudo apt install -y ffmpeg
    echo "✅ ffmpeg installed"
fi

# Install yt-dlp
echo ""
echo "📦 Installing yt-dlp..."
if command -v yt-dlp &> /dev/null; then
    echo "✅ yt-dlp already installed"
else
    sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
    sudo chmod +x /usr/local/bin/yt-dlp
    echo "✅ yt-dlp installed"
fi

# Install Deno (JavaScript runtime for yt-dlp)
echo ""
echo "📦 Installing Deno..."
if command -v deno &> /dev/null; then
    echo "✅ Deno already installed"
else
    curl -fsSL https://deno.land/install.sh | sh
    export DENO_INSTALL="$HOME/.deno"
    export PATH="$DENO_INSTALL/bin:$PATH"
    
    # Add to bashrc if not already there
    if ! grep -q 'DENO_INSTALL' "$HOME/.bashrc"; then
        echo 'export DENO_INSTALL="$HOME/.deno"' >> "$HOME/.bashrc"
        echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> "$HOME/.bashrc"
    fi
    echo "✅ Deno installed"
fi

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
npm install
echo "✅ Dependencies installed"

# Install PM2 globally
echo ""
echo "📦 Installing PM2..."
if command -v pm2 &> /dev/null; then
    echo "✅ PM2 already installed"
else
    npm install -g pm2
    echo "✅ PM2 installed"
fi

# Create .env if not exists
echo ""
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << 'EOF'
DISCORD_TOKEN=your_token_here
DISCORD_PREFIX=?
ALLOWED_USERS=
STEALTH=true
REPLY_DM=true
EOF
    echo "✅ .env created - Please edit it with your Discord token"
else
    echo "✅ .env already exists"
fi

echo ""
echo "✨ Installation completed!"
echo ""
echo "Next steps:"
echo "1. Edit .env file: nano .env"
echo "2. Add your Discord token"
echo "3. Run: npm start (or pm2 start ecosystem.config.js)"
echo ""
echo "Note: Restart your terminal or run 'source ~/.bashrc' to apply PATH changes"
