# TASK EXECUTION TEMPLATE

**Copy this template for EVERY task. Fill in ALL sections.**

---

## 🎯 TASK: [Short descriptive name]

**Priority:** [CRITICAL | HIGH | MEDIUM | LOW]
**Estimated Time:** [X minutes]
**Dependencies:** [What must work first]

---

### 📋 OBJECTIVE

**What needs to happen:**
[Single, clear, measurable goal]

**Success looks like:**
[Exact description of working state]

---

### 🔍 CURRENT STATE (VERIFY FIRST)

**Check before starting:**
```bash
# 1. Relevant files
ls -la [path/to/files]

# 2. Running processes
netstat -ano | findstr :[port]

# 3. Git status
git status

# 4. Recent changes
git log --oneline -3
```

**Current state is:**
- [ ] Files exist
- [ ] Server running
- [ ] Dependencies installed
- [ ] Environment configured

---

### ⚡ EXECUTION STEPS

**Step 1:** [Action]
```bash
[Exact commands]
```
**Expected output:** [what you should see]

**Step 2:** [Action]
```bash
[Exact commands]
```
**Expected output:** [what you should see]

**Step 3:** [Action]
```bash
[Exact commands]
```
**Expected output:** [what you should see]

---

### ✅ VERIFICATION (MUST DO)

**After execution, verify:**
```bash
# 1. File changes applied
git diff [filename]
# Expected: [specific changes visible]

# 2. No syntax errors
npm run build
# Expected: ✓ Compiled successfully

# 3. Server status
ps aux | grep node  # or: netstat -ano | findstr :3000
# Expected: Process running on correct port

# 4. Browser check
# Open http://localhost:[port]
# Open DevTools (F12)
# Check Console for errors
# Expected: No errors, feature visible
```

**Verification checklist:**
- [ ] Code changes confirmed in files
- [ ] No compilation errors
- [ ] Server starts without errors
- [ ] Browser loads page
- [ ] No console errors
- [ ] Expected feature visible/working

---

### 📊 RESULTS

**Status:** [COMPLETE | INCOMPLETE | FAILED]

**What changed:**
- File: [path] - Lines X-Y modified
- File: [path] - New file created
- Config: [name] - Value updated

**Verification output:**
```
[Paste actual terminal output]
```

**Browser state:**
- Console errors: [YES/NO - if yes, list them]
- Feature visible: [YES/NO]
- Feature working: [YES/NO]

---

### 🚨 IF FAILED

**Error encountered:**
```
[Exact error message]
```

**Root cause:**
[Specific reason, not "might be" or "could be"]

**Rollback steps:**
```bash
git checkout [filename]
# or
git reset --hard HEAD
```

**Alternative approach:**
[Different method to achieve same goal]

---

### 🎯 FINAL STATE

**Working:**
- [What works now that didn't before]

**Still broken:**
- [What still needs fixing]

**Next task:**
- [What to do next, or DONE if complete]

---

**SAVE THIS TEMPLATE AND USE IT FOR EVERY TASK**
