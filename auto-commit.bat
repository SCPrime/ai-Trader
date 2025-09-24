@echo off
REM Auto-commit batch script for Windows
REM Usage: auto-commit.bat

echo 🔍 Checking for changes...

REM Check if there are any changes
git status --porcelain > temp_status.txt
set /p status=<temp_status.txt
del temp_status.txt

if "%status%"=="" (
    echo ✅ No changes to commit. Working tree is clean.
    pause
    exit /b 0
)

REM Show current status
echo.
echo 📋 Current changes:
git status --short

echo.
echo 📝 Detailed changes:
git diff --stat

REM Prompt for commit
echo.
set /p commit="❓ Do you want to commit these changes? (y/N): "
if /i not "%commit%"=="y" (
    echo ❌ Commit cancelled.
    pause
    exit /b 0
)

REM Prompt for commit message
echo.
set /p message="💬 Enter commit message (or press Enter for auto-generated): "
if "%message%"=="" (
    set message=Update project files
)

REM Add all changes
echo.
echo 📦 Adding changes...
git add .

REM Commit
echo 💾 Committing changes...
git commit -m "%message%" -m "" -m "🤖 Generated with [Claude Code](https://claude.ai/code)" -m "" -m "Co-Authored-By: Claude <noreply@anthropic.com>"

REM Prompt for push
echo.
set /p push="🚀 Push to remote repository? (Y/n): "
if /i not "%push%"=="n" (
    echo ⬆️ Pushing to remote...
    git push
    echo ✅ Successfully pushed to remote!
) else (
    echo 📝 Changes committed locally only.
)

echo.
echo 🎉 Auto-commit complete!
pause