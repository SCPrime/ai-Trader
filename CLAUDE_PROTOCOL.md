# CLAUDE EXECUTION PROTOCOL

**READ THIS BEFORE EVERY TASK. NO EXCEPTIONS.**

---

## 🎯 CORE PRINCIPLES

### 1. **COMPLETE OR DON'T START**
- Don't suggest "try this" unless you've verified it works
- Don't say "this should work" - MAKE it work
- Don't leave tasks 80% done
- No "let me know if this helps" - PROVE it helped

### 2. **VERIFY EVERYTHING**
After EVERY change:
```bash
# Did the file actually change?
git diff [filename]

# Does the code compile?
npm run build

# Does the server start?
# Check for errors in terminal output

# Does it render in browser?
# Open DevTools, check for errors
```

### 3. **ONE COMPLETE SOLUTION**
- Don't give "Step 1" and wait for user to report back
- Execute ALL steps in sequence
- Verify each step before moving to next
- Report final state: "WORKING" or "FAILED: [specific error]"

### 4. **NO ASSUMPTIONS**
- Check the current state FIRST
- Don't assume files exist
- Don't assume servers are running
- Don't assume previous fixes worked

---

## 🚨 FAILURE MODES TO AVOID

### ❌ "Try clearing your cache"
**❌ BAD:** "Clear your browser cache and refresh"

**✅ GOOD:** Run these commands:
```bash
# Kill all Node processes
taskkill /F /IM node.exe

# Clear Next.js cache
rm -rf frontend/.next

# Restart server
cd frontend && npm run dev

# Verify server started on port 3000
netstat -ano | findstr :3000

# Tell user: "Server running on port 3000. Hard refresh browser (Ctrl+Shift+R)"
```

### ❌ "This should work"
**❌ BAD:** "I've updated the file, this should fix it"

**✅ GOOD:**
```bash
# 1. Verify file changed
git diff frontend/components/RadialMenu.tsx

# 2. Search for old code
grep -n "#A855F7" frontend/components/RadialMenu.tsx
# Result: No matches found ✓

# 3. Search for new code
grep -n "#45f0c0" frontend/components/RadialMenu.tsx
# Result: Line 558, Line 639 ✓

# 4. Restart server and verify compile
npm run dev
# Result: ✓ Compiled successfully

# STATUS: File updated and compiled. User must hard refresh browser.
```

### ❌ "Check if the color changed"
**❌ BAD:** "Let me know if you see cyan now"

**✅ GOOD:** "I've verified the code has cyan (#45f0c0) at lines 558 and 639. The server compiled successfully. If you still see purple after Ctrl+Shift+R, we have a different problem - likely middleware or proxy cache."

---

## ✅ TASK COMPLETION CHECKLIST

Every task MUST have:

```markdown
## TASK: [Name]

### OBJECTIVE
[Specific, measurable goal]

### CURRENT STATE
[What exists now - VERIFIED]

### EXECUTION
[Commands run, files changed]

### VERIFICATION
[Proof it worked]
- [ ] Files contain expected code
- [ ] No compile errors
- [ ] Server starts successfully
- [ ] Browser shows expected result

### STATUS
- COMPLETE: [description]
- INCOMPLETE: [what's missing]
- FAILED: [specific error + rollback steps]
```

---

## 🔧 DEBUGGING PROTOCOL

When something doesn't work:

1. **DON'T GUESS - CHECK THE LOGS**
   ```bash
   # Terminal output
   # Browser console (F12)
   # Network tab (check 404s, 500s)
   ```

2. **ISOLATE THE PROBLEM**
   - Is it compilation? Check terminal
   - Is it runtime? Check browser console
   - Is it data? Check network tab
   - Is it cache? Clear everything

3. **FIX THE ROOT CAUSE**
   - Not the symptom
   - Not a workaround
   - The actual problem

---

## 📊 REPORTING FORMAT

Use this EXACT format for every response:

```markdown
## TASK STATUS: [COMPLETE | IN PROGRESS | FAILED]

### What I Did
[Actual commands executed]

### Verification Results
[Output from verification commands]

### Current State
[What works now]

### Next Action Required
[From user OR from me]
```

---

## 🚫 BANNED PHRASES

**NEVER use these vague phrases:**

❌ "This should work"
❌ "Try this"
❌ "Let me know if..."
❌ "Might be a cache issue"
❌ "Could be..."
❌ "Possibly..."

**ALWAYS use definitive language:**

✅ "Verified working"
✅ "Confirmed at line X"
✅ "Server compiled successfully"
✅ "Browser shows expected result"
✅ "FAILED: [specific error]"

---

## 💪 POWER MOVES

### Before Starting Any Task:
```bash
# 1. Check git status
git status

# 2. Check running processes
netstat -ano | findstr :3000
netstat -ano | findstr :8000

# 3. Check latest changes
git log --oneline -5

# 4. Check current file state
cat [filename] | head -50
```

### After Every Change:
```bash
# 1. Verify change applied
git diff [filename]

# 2. Check for syntax errors
npm run build

# 3. Restart affected services
# (kill and restart server)

# 4. Verify in browser
# Open DevTools, check console
```

---

## 🎯 SUCCESS CRITERIA

A task is ONLY complete when:

✅ Code changes verified in files
✅ No compilation errors
✅ Server starts successfully
✅ Browser renders correctly
✅ No console errors
✅ User confirms it works

**ANYTHING LESS = INCOMPLETE**

---

**REMEMBER: The user has been stuck on simple issues for HOURS because of sloppy execution. Be thorough. Be definitive. Be complete.**
