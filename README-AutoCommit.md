# Auto-Commit Setup

I've created auto-commit scripts with prompts to help you manage your source control easily.

## Usage Options

### PowerShell (Recommended)
```powershell
.\auto-commit.ps1
```

### Command Prompt
```cmd
auto-commit.bat
```

## What the scripts do:

1. **📋 Check for changes** - Shows what files have been modified
2. **❓ Prompt for commit** - Asks if you want to commit (y/N)
3. **💬 Ask for message** - Lets you enter a custom commit message or auto-generates one
4. **📦 Add & commit** - Adds all changes and commits with proper formatting
5. **🚀 Push prompt** - Asks if you want to push to remote (Y/n)

## Features:

- ✅ **Safe prompts** - Won't commit without your approval
- 🤖 **Auto-generated messages** - Smart commit messages if you don't provide one
- 📝 **Proper formatting** - Includes Claude Code attribution
- 🔍 **Change preview** - Shows exactly what will be committed
- ⬆️ **Optional push** - Choose whether to push to GitHub

## Quick Start:

1. Save any unsaved files in your editor
2. Run `.\auto-commit.ps1` in PowerShell
3. Review the changes shown
4. Type `y` to proceed or `N` to cancel
5. Enter a commit message or press Enter for auto-generated
6. Choose whether to push to remote

This gives you **auto-commit convenience** with **manual control**! 🎉