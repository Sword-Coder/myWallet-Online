#!/bin/bash

# Safer Cleanup Script for myWallet Droplet
# This script cleans up disk space WITHOUT deleting Docker containers/volumes

echo "=========================================="
echo "🧹 Safer Cleanup Script for myWallet"
echo "=========================================="
echo ""

# 1. Show current disk usage
echo "📊 Current Disk Usage:"
df -h /
echo ""

# 2. Show Docker disk usage (safe to analyze, NOT delete)
echo "🐳 Docker Disk Usage (analysis only):"
docker system df
echo ""

# 3. Clean apt cache (safe)
echo "🧹 Cleaning apt cache..."
sudo apt-get clean
sudo apt-get autoremove -y
echo "✅ Done"
echo ""

# 4. Clear system logs older than 7 days (safe)
echo "🧹 Clearing old logs (keeping last 7 days)..."
sudo journalctl --vacuum-time=7d 2>/dev/null || echo "Skipping journal (may need sudo)"
echo "✅ Done"
echo ""

# 5. Show largest directories
echo "📁 Top 10 Largest Directories:"
du -h / --max-depth=1 2>/dev/null | sort -hr | head -10
echo ""

# 6. Show what can be safely removed
echo "🗑️ Safe to remove (won't affect database):"
echo "   - Old log files: sudo find /var/log -type f -name '*.gz' -delete"
echo "   - Temp files: sudo rm -rf /tmp/*"
echo "   - Build artifacts: sudo rm -rf /var/cache/apt/archives/*.deb"
echo ""

# 7. Show how to safely clean Docker (without deleting volumes)
echo "🐳 Safe Docker Cleanup Commands:"
echo "   # Remove unused containers (not running) - SAFE"
echo "   docker container prune -f"
echo ""
echo "   # Remove unused images - SAFE"
echo "   docker image prune -a -f"
echo ""
echo "   # Remove unused networks - SAFE"
echo "   docker network prune -f"
echo ""
echo "   # Remove build cache - SAFE"
echo "   docker builder prune -f"
echo ""
echo "   ⚠️  DO NOT RUN: docker system prune -a --volumes"
echo "      (This deletes ALL containers AND their data volumes!)"
echo ""

# 8. Summary
echo "=========================================="
echo "✅ Cleanup complete!"
echo "=========================================="
echo ""
echo "To free more space safely:"
echo "1. Delete orphaned CouchDB documents using the cleanup tool"
echo "2. Or run individual Docker prune commands above"
echo ""
