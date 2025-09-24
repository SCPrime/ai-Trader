# Auto-commit script with prompts
# Usage: .\auto-commit.ps1

Write-Host "🔍 Checking for changes..." -ForegroundColor Yellow

# Check if there are any changes
$status = git status --porcelain
if (-not $status) {
    Write-Host "✅ No changes to commit. Working tree is clean." -ForegroundColor Green
    exit 0
}

# Show current status
Write-Host "`n📋 Current changes:" -ForegroundColor Cyan
git status --short

Write-Host "`n📝 Detailed changes:" -ForegroundColor Cyan
git diff --stat

# Prompt for commit
$commit = Read-Host "`n❓ Do you want to commit these changes? (y/N)"
if ($commit -ne "y" -and $commit -ne "Y") {
    Write-Host "❌ Commit cancelled." -ForegroundColor Red
    exit 0
}

# Prompt for commit message
$message = Read-Host "`n💬 Enter commit message (or press Enter for auto-generated)"
if (-not $message) {
    # Generate automatic commit message based on changes
    $files = git diff --name-only HEAD
    if ($files -match "\.py$") {
        $message = "Update Python backend functionality"
    } elseif ($files -match "api/") {
        $message = "Update API endpoints"
    } elseif ($files -match "\.md$") {
        $message = "Update documentation"
    } else {
        $message = "Update project files"
    }
}

# Add all changes
Write-Host "`n📦 Adding changes..." -ForegroundColor Yellow
git add .

# Commit with enhanced message
Write-Host "💾 Committing changes..." -ForegroundColor Yellow
$fullMessage = @"
$message

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
"@

git commit -m $fullMessage

# Prompt for push
$push = Read-Host "`n🚀 Push to remote repository? (Y/n)"
if ($push -ne "n" -and $push -ne "N") {
    Write-Host "⬆️ Pushing to remote..." -ForegroundColor Yellow
    git push
    Write-Host "✅ Successfully pushed to remote!" -ForegroundColor Green
} else {
    Write-Host "📝 Changes committed locally only." -ForegroundColor Yellow
}

Write-Host "`n🎉 Auto-commit complete!" -ForegroundColor Green