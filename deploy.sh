#!/bin/bash
set -e

echo "🦆 QuackWash Deploy"
echo "==================="

# Activate Node.js environment
echo "→ Activating Node.js..."
source $HOME/nodevenv/quackWash-repo/20/bin/activate

# Navigate to repo
cd $HOME/quackWash-repo

# Pull latest code
echo "→ Resetting workspace and pulling latest from GitHub..."
git reset --hard
git pull origin main

# Install dependencies
echo "→ Installing dependencies..."
npm install --production=false

# Clean and build
echo "→ Building..."
rm -rf dist
npm run build

# Restart Passenger
echo "→ Restarting app..."
mkdir -p tmp
touch tmp/restart.txt

echo "==================="
echo "✅ Deploy complete!"
