# AI Trader Platform - Complete Staged Implementation Plan
## Self-Contained Copy/Paste Blocks for VSCode Claude

---

## 🎯 STAGE 1: Critical CSP Header Fix
**Copy this ENTIRE block to VSCode Claude:**

```
PROJECT CONTEXT:
- Application: AI Trader Platform (Next.js frontend on Vercel + FastAPI backend on Render)
- Current Problem: Frontend shows only static feature cards, components not rendering
- Root Cause: Duplicate CSP headers blocking React hydration
- Backend Status: Fully functional at https://ai-trader-86a1.onrender.com
- Frontend URL: https://ai-trader-snowy.vercel.app
- Goal: Fix CSP headers to allow React/Next.js to properly hydrate

STAGE 1 OF 5: Fix Critical CSP Headers

TASK 1.1: Update CSP in next.config.js
1. Open file: frontend/next.config.js
2. Locate the headers() async function (should be around lines 4-30)
3. Find the Content-Security-Policy header value
4. REPLACE the entire Content-Security-Policy value with this exact string:
   "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; connect-src 'self' https://ai-trader-86a1.onrender.com wss://ai-trader-86a1.onrender.com; img-src 'self' data: blob: https:; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';"
5. Save the file

TASK 1.2: Remove Duplicate Headers from vercel.json
1. Open file: frontend/vercel.json
2. Locate the "headers" array (should be around lines 19-37)
3. DELETE the entire "headers" array section, including:
   - The "headers": [ line
   - All header objects inside
   - The closing ] bracket
4. Keep all other configurations (routes, build settings, etc.)
5. Save the file

TASK 1.3: Verify No Header Conflicts
1. Run command: grep -n "Content-Security-Policy" frontend/next.config.js
   - Expected: Should show ONE occurrence in next.config.js
2. Run command: grep -n "headers" frontend/vercel.json  
   - Expected: Should show NO occurrences (or only in comments)
3. Run command: grep -r "Content-Security-Policy" frontend/ --exclude-dir=node_modules --exclude-dir=.next
   - Expected: Only one occurrence in next.config.js

VALIDATION:
- Confirm only ONE CSP definition exists (in next.config.js)
- Confirm NO headers array in vercel.json
- If any other CSP definitions found, note their locations

OUTPUT REQUIRED:
Please report:
1. ✅/❌ CSP updated in next.config.js
2. ✅/❌ Headers removed from vercel.json  
3. Number of CSP definitions found: [number]
4. Any errors encountered: [describe or "none"]
```

**After VSCode Claude completes, copy its response and paste below:**
```
STAGE 1 RESULT:
[Paste VSCode Claude's response here]
```

---

## 🔧 STAGE 2: Fix Component State Management
**Only proceed after Stage 1 success. Copy this ENTIRE block to VSCode Claude:**

```
PROJECT CONTEXT:
- Application: AI Trader Platform
- Previous Stage: CSP headers fixed, only one definition in next.config.js
- Current Problem: StatusBar component stuck in loading state, PositionsTable not displaying data
- Root Cause: Improper async state management in React components
- Goal: Fix component state handling to properly display backend data

STAGE 2 OF 5: Fix Component State Management

TASK 2.1: Replace StatusBar Component
1. Open file: frontend/components/StatusBar.tsx
2. SELECT ALL content (Ctrl+A or Cmd+A)
3. DELETE all content
4. PASTE this exact code:

import { useState, useEffect, useCallback } from 'react';

export default function StatusBar() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'error'>('checking');
  const [message, setMessage] = useState('Initializing system check...');
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    try {
      setStatus('checking');
      setMessage('Checking backend health...');
      
      const res = await fetch('/api/proxy/api/health', {
        signal: controller.signal,
        headers: { 
          'cache-control': 'no-cache',
          'pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        throw new Error(`Backend returned status ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Health check response:', data);
      
      setStatus('healthy');
      setMessage(`✓ System operational • Backend: Online • Redis: ${data.redis?.status || 'not configured'}`);
      setLastCheck(new Date());
      
    } catch (error: any) {
      console.error('Health check failed:', error);
      clearTimeout(timeoutId);
      setStatus('error');
      
      if (error.name === 'AbortError') {
        setMessage('Health check timeout - backend may be starting up');
      } else {
        setMessage(`Backend error: ${error.message || 'Cannot connect'}`);
      }
    }
  }, []);

  useEffect(() => {
    console.log('StatusBar mounted, starting health checks');
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => {
      console.log('StatusBar unmounting, clearing interval');
      clearInterval(interval);
    };
  }, [fetchHealth]);

  const statusStyles = {
    checking: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    healthy: 'bg-green-100 border-green-300 text-green-800',
    error: 'bg-red-100 border-red-300 text-red-800'
  };

  const pulseColors = {
    checking: 'bg-yellow-500',
    healthy: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${statusStyles[status]}`}>
      <div className={`w-3 h-3 rounded-full ${pulseColors[status]} animate-pulse`} />
      <span className="text-sm font-medium flex-1">{message}</span>
      {status === 'error' && (
        <button 
          onClick={fetchHealth}
          className="text-xs font-medium underline hover:no-underline"
        >
          Retry
        </button>
      )}
      {lastCheck && status === 'healthy' && (
        <span className="text-xs opacity-60">
          Last: {lastCheck.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

5. Save the file

TASK 2.2: Fix PositionsTable Component
1. Open file: frontend/components/PositionsTable.tsx
2. Locate the load() or useEffect function that fetches positions
3. Find where it sets the rows/positions state
4. Add console.log statements before and after state updates:
   console.log('API response data:', data);
   console.log('Setting rows to:', processedArray);
5. Ensure the state update always runs in finally block
6. Save the file

TASK 2.3: Test Local Build
1. Run command: cd frontend
2. Run command: npm run build
3. Note any TypeScript errors
4. If build succeeds, run: npm run dev
5. Open browser: http://localhost:3000
6. Open browser DevTools Console (F12)
7. Check for any red errors
8. Look for the console.log outputs from StatusBar

VALIDATION CHECKLIST:
- [ ] StatusBar.tsx replaced successfully
- [ ] No TypeScript errors in build
- [ ] npm run dev starts without errors
- [ ] Browser console shows "StatusBar mounted" message
- [ ] StatusBar displays something other than "Checking..."

OUTPUT REQUIRED:
1. Build result: ✅ success / ❌ failed with: [errors]
2. StatusBar display: [what text is shown]
3. Console errors: [any red errors or "none"]
4. Console logs seen: [list which console.log messages appeared]
```

**After VSCode Claude completes, copy its response and paste below:**
```
STAGE 2 RESULT:
[Paste VSCode Claude's response here]
```

---

## 🎨 STAGE 3: Integrate Radial Menu Navigation
**Only proceed after Stage 2 success. Copy this ENTIRE block to VSCode Claude:**

```
PROJECT CONTEXT:
- Application: AI Trader Platform
- Previous Stages: CSP fixed, StatusBar working
- Current Goal: Add radial menu as navigation layer over existing components
- Approach: Use radial menu to show/hide existing working components
- Note: We're NOT rebuilding components, just adding navigation

STAGE 3 OF 5: Integrate Radial Menu Navigation

TASK 3.1: Create Radial Menu Wrapper Component
1. Create new file: frontend/components/RadialMenuNav.tsx
2. PASTE this exact code:

'use client';

import { useEffect, useRef } from 'react';

interface RadialMenuNavProps {
  onWorkflowSelect: (workflowId: string) => void;
}

export default function RadialMenuNav({ onWorkflowSelect }: RadialMenuNavProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from our iframe
      if (event.source === iframeRef.current?.contentWindow) {
        if (event.data?.type === 'workflow-selected' && event.data?.workflowId) {
          console.log('Radial menu selected:', event.data.workflowId);
          onWorkflowSelect(event.data.workflowId);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onWorkflowSelect]);

  return (
    <div className="radial-menu-wrapper">
      <iframe
        ref={iframeRef}
        src="/radial-ui.html"
        className="w-[600px] h-[700px] border-0 bg-transparent"
        title="Trading Workflow Navigation"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}

3. Save the file

TASK 3.2: Add Radial HTML to Public Directory
1. Create new file: frontend/public/radial-ui.html
2. PASTE the complete radial UI HTML below, but MODIFY the handleWorkflowClick function:

[First, paste all the HTML from before, then find the handleWorkflowClick function and REPLACE it with:]

function handleWorkflowClick(workflow) {
    // Update visual feedback
    const infoDiv = document.getElementById('workflow-info');
    infoDiv.innerHTML = `
        <h4>${workflow.icon} ${workflow.name.replace('\n', ' ')} - Activated</h4>
        <p>${workflow.description}</p>
        <p style="margin-top: 12px; color: #00C851; font-weight: 600;">
            ✓ Loading workflow components...
        </p>
    `;
    infoDiv.style.borderColor = workflow.color;
    
    // Send message to parent window (Next.js app)
    window.parent.postMessage({
        type: 'workflow-selected',
        workflowId: workflow.id,
        workflowName: workflow.name
    }, '*');
    
    console.log('Sent workflow selection to parent:', workflow.id);
}

3. Save the file

TASK 3.3: Create Main Dashboard with Radial Navigation
1. Open file: frontend/app/page.tsx (or frontend/pages/index.tsx if using Pages Router)
2. REPLACE entire content with:

'use client';

import { useState, useEffect } from 'react';
import StatusBar from '@/components/StatusBar';
import PositionsTable from '@/components/PositionsTable';
import ExecuteTradeForm from '@/components/ExecuteTradeForm';
import MorningRoutine from '@/components/MorningRoutine';
import RadialMenuNav from '@/components/RadialMenuNav';

export default function Dashboard() {
  const [activeWorkflow, setActiveWorkflow] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const handleWorkflowSelect = (workflowId: string) => {
    console.log('Dashboard: Workflow selected:', workflowId);
    setIsLoading(true);
    setActiveWorkflow(workflowId);
    // Simulate component loading
    setTimeout(() => setIsLoading(false), 300);
  };

  const renderWorkflowContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-400">Loading workflow...</div>
        </div>
      );
    }

    switch(activeWorkflow) {
      case 'morning-routine':
        return <MorningRoutine />;
      
      case 'active-positions':
        return <PositionsTable />;
      
      case 'execute':
        return <ExecuteTradeForm />;
      
      case 'pnl-dashboard':
        return (
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-4">P&L Dashboard</h3>
            <p className="text-gray-400">P&L tracking coming soon...</p>
          </div>
        );
      
      case 'news-review':
        return (
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-4">News Review</h3>
            <p className="text-gray-400">Market news integration coming soon...</p>
          </div>
        );
      
      default:
        return (
          <div className="p-6 bg-gray-800 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Welcome to AI Trader</h3>
            <p className="text-gray-400 mb-4">
              Select a workflow from the radial menu to begin trading operations.
            </p>
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-gray-700 rounded">
                <h4 className="font-semibold mb-2">Quick Start:</h4>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Click "Morning Routine" for system check</li>
                  <li>• Click "Positions" to view portfolio</li>
                  <li>• Click "Execute" to place orders</li>
                </ul>
              </div>
              <div className="p-4 bg-gray-700 rounded">
                <h4 className="font-semibold mb-2">System Status:</h4>
                <StatusBar />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">
              🎯 AI Trading Platform
            </h1>
            <StatusBar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[600px,1fr] gap-8">
          {/* Left: Radial Menu */}
          <div className="flex justify-center lg:justify-start">
            <RadialMenuNav onWorkflowSelect={handleWorkflowSelect} />
          </div>

          {/* Right: Dynamic Content */}
          <div className="flex-1">
            {renderWorkflowContent()}
          </div>
        </div>
      </div>
    </div>
  );
}

3. Save the file

TASK 3.4: Test Radial Integration
1. Ensure you're in frontend directory: cd frontend
2. Run: npm run dev
3. Open browser: http://localhost:3000
4. Check that radial menu appears
5. Click on different segments
6. Verify content changes on the right
7. Check browser console for any errors

VALIDATION:
- [ ] Radial menu visible on page
- [ ] Clicking segments triggers console.log messages
- [ ] Right side content changes when clicking
- [ ] StatusBar shows health status
- [ ] No red errors in console

OUTPUT REQUIRED:
1. Radial menu displays: ✅/❌
2. Clicking "Positions" shows: [what appears]
3. Clicking "Execute" shows: [what appears]
4. Console messages when clicking: [what you see]
5. Any errors: [describe or "none"]
```

**After VSCode Claude completes, copy its response and paste below:**
```
STAGE 3 RESULT:
[Paste VSCode Claude's response here]
```

---

## 🚀 STAGE 4: Deploy to Production
**Only proceed after Stage 3 success. Copy this ENTIRE block to VSCode Claude:**

```
PROJECT CONTEXT:
- Application: AI Trader Platform
- Previous Stages: CSP fixed, components working, radial menu integrated
- Current Goal: Deploy to Vercel and verify production functionality
- Backend URL: https://ai-trader-86a1.onrender.com
- Important: Check CORS settings on backend after deploy

STAGE 4 OF 5: Deploy to Production

TASK 4.1: Commit and Push Changes
1. Run command: git status
2. Review changed files - should include:
   - frontend/next.config.js (modified)
   - frontend/vercel.json (modified)
   - frontend/components/StatusBar.tsx (modified)
   - frontend/components/RadialMenuNav.tsx (new)
   - frontend/public/radial-ui.html (new)
   - frontend/app/page.tsx (modified)
3. Run command: git add -A
4. Run command: git commit -m "fix: resolve CSP conflicts, add radial navigation UI, fix component state management"
5. Run command: git push origin main
6. Note any errors during push

TASK 4.2: Monitor Vercel Deployment
1. After push, Vercel should auto-deploy
2. Check Vercel dashboard or wait 3-5 minutes
3. Visit: https://ai-trader-snowy.vercel.app
4. If page loads, continue to Task 4.3
5. If error, check Vercel logs for build errors

TASK 4.3: Run Production Diagnostics
1. Open https://ai-trader-snowy.vercel.app in browser
2. Open DevTools Console (F12)
3. PASTE and run this diagnostic script:

console.clear();
console.log('🔍 PRODUCTION DIAGNOSTIC RUNNING...\n');
console.log('='.repeat(50));

// Check 1: React and Next.js
console.log('1. FRAMEWORK STATUS:');
console.log('   React present:', typeof React !== 'undefined' ? '✅' : '❌');
console.log('   Next.js data:', typeof __NEXT_DATA__ !== 'undefined' ? '✅' : '❌');

// Check 2: Radial Menu
console.log('\n2. UI COMPONENTS:');
const hasRadial = document.querySelector('iframe[src*="radial"]');
console.log('   Radial menu:', hasRadial ? '✅ Found' : '❌ Missing');
const hasStatusBar = document.querySelector('[class*="status"]');
console.log('   StatusBar:', hasStatusBar ? '✅ Found' : '❌ Missing');

// Check 3: CSP Violations
console.log('\n3. CSP STATUS:');
let cspViolations = 0;
document.addEventListener('securitypolicyviolation', (e) => {
  cspViolations++;
  console.error('   ❌ CSP blocked:', e.violatedDirective);
});
setTimeout(() => {
  console.log('   CSP violations:', cspViolations > 0 ? `❌ ${cspViolations} found` : '✅ None');
}, 1000);

// Check 4: Backend API
console.log('\n4. BACKEND CONNECTIVITY:');
fetch('/api/proxy/api/health')
  .then(r => {
    console.log('   Health endpoint:', r.ok ? '✅ Connected' : `❌ Status ${r.status}`);
    return r.json();
  })
  .then(data => console.log('   Backend response:', data))
  .catch(e => console.log('   ❌ Backend error:', e.message));

fetch('/api/proxy/api/portfolio/positions')
  .then(r => {
    console.log('   Positions endpoint:', r.ok ? '✅ Connected' : `❌ Status ${r.status}`);
    return r.json();
  })
  .then(data => console.log('   Positions data:', data))
  .catch(e => console.log('   ❌ Positions error:', e.message));

console.log('\n' + '='.repeat(50));
console.log('Diagnostic complete. Check results above.\n');

4. Copy the entire console output

TASK 4.4: Fix CORS if Needed (Only if API calls fail)
If you see CORS errors in console:
1. Note the exact error message
2. Go to Render dashboard: https://dashboard.render.com
3. Find your backend service (ai-trader)
4. Go to Environment variables
5. Find: ALLOW_ORIGIN
6. Current value might be: https://ai-trader-snowy.vercel.app/
7. Change to: https://ai-trader-snowy.vercel.app (remove trailing slash)
8. Also check it's not http:// (must be https://)
9. Save and redeploy backend
10. Wait 2-3 minutes for backend to restart
11. Re-run the diagnostic script

VALIDATION:
- [ ] Site loads without blank page
- [ ] Radial menu visible
- [ ] StatusBar shows health status
- [ ] No CSP violations in console
- [ ] Backend API calls succeed

OUTPUT REQUIRED:
1. Deployment status: ✅ live / ❌ failed
2. Production URL loads: ✅/❌
3. Diagnostic script output: [paste entire output]
4. CORS errors: [any CORS errors or "none"]
5. What's visible on page: [describe what you see]
```

**After VSCode Claude completes, copy its response and paste below:**
```
STAGE 4 RESULT:
[Paste VSCode Claude's response here]
```

---

## ✅ STAGE 5: Final Verification & Testing
**Only proceed after Stage 4 success. Copy this ENTIRE block to VSCode Claude:**

```
PROJECT CONTEXT:
- Application: AI Trader Platform
- Previous Stages: All fixes deployed, site is live
- Current Goal: Verify complete end-to-end functionality
- Test: Backend → Frontend data flow through radial UI navigation

STAGE 5 OF 5: Final Verification & Testing

TASK 5.1: Test Complete User Flow
1. Open https://ai-trader-snowy.vercel.app
2. Perform these actions in order:

   a. Check StatusBar:
      - Should show "System operational" or similar
      - Should have green indicator
      - Note what it says: ________________

   b. Test Radial Menu Navigation:
      - Click "Morning Routine" segment
      - Verify right panel updates
      - Note what appears: ________________
      
      - Click "Positions" segment
      - Verify PositionsTable loads
      - Note if data appears: ________________
      
      - Click "Execute" segment
      - Verify ExecuteTradeForm loads
      - Note if form appears: ________________

   c. Test Order Execution (Dry Run):
      - In Execute form, enter:
        * Symbol: AAPL
        * Quantity: 10
        * Side: BUY
        * Order Type: MARKET
      - Click Submit
      - Note response: ________________

TASK 5.2: Test API Data Flow
1. Open DevTools Console
2. Run this comprehensive test:

console.clear();
console.log('🧪 FULL SYSTEM TEST\n' + '='.repeat(50));

// Test all endpoints
const testEndpoints = async () => {
  const endpoints = [
    { name: 'Health', url: '/api/proxy/api/health' },
    { name: 'Settings', url: '/api/proxy/api/settings' },
    { name: 'Positions', url: '/api/proxy/api/portfolio/positions' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.name}:`);
      const response = await fetch(endpoint.url);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint.name}: SUCCESS`);
        console.log('   Data:', data);
      } else {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
  }
};

// Test order execution
const testOrderExecution = async () => {
  console.log('\nTesting Order Execution:');
  try {
    const response = await fetch('/api/proxy/api/trading/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbol: 'AAPL',
        side: 'BUY',
        qty: 1,
        type: 'MARKET',
        dry_run: true
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      console.log('✅ Order execution: SUCCESS');
      console.log('   Response:', data);
    } else {
      console.log(`❌ Order execution: HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Order execution: ERROR - ${error.message}`);
  }
};

// Run all tests
(async () => {
  await testEndpoints();
  await testOrderExecution();
  console.log('\n' + '='.repeat(50));
  console.log('✅ FULL SYSTEM TEST COMPLETE');
})();

3. Copy the complete output

TASK 5.3: Document Working Features
Based on your testing, note which features are working:

- [ ] StatusBar shows backend health
- [ ] Radial menu navigation works
- [ ] Morning Routine loads
- [ ] Positions table displays
- [ ] Execute form submits orders
- [ ] API health endpoint responds
- [ ] API settings endpoint responds
- [ ] API positions endpoint responds
- [ ] Dry-run orders execute

TASK 5.4: Create Success Summary
Write a brief summary:
1. What's working: ________________
2. What's not working: ________________
3. Any remaining errors: ________________
4. Backend data flow status: ________________

OUTPUT REQUIRED:
1. StatusBar display: [exact text shown]
2. Radial navigation: ✅ works / ❌ broken
3. Component loading: [which components load successfully]
4. API test results: [paste console output]
5. Order execution test: ✅ success / ❌ failed
6. Overall status: [working/partially working/broken]

FINAL DEPLOYMENT STATUS:
If everything works, your deployment is complete! 
If issues remain, note them for troubleshooting.
```

**After VSCode Claude completes, copy its response and paste below:**
```
STAGE 5 RESULT:
[Paste VSCode Claude's response here]
```

---

## 📋 COMPLETION CHECKLIST

After all stages, you should have:

- [ ] **STAGE 1**: CSP headers fixed (single definition)
- [ ] **STAGE 2**: StatusBar showing live health status
- [ ] **STAGE 3**: Radial menu integrated and clickable
- [ ] **STAGE 4**: Successfully deployed to Vercel
- [ ] **STAGE 5**: All API endpoints responding with data

## 🔧 TROUBLESHOOTING TEMPLATE

If any stage fails, use this template to report back:

```
TROUBLESHOOTING NEEDED:
Stage Failed: [1/2/3/4/5]
Specific Task: [e.g., 3.2]
Error Message: [exact error text]
Browser Console: [any red errors]
What You Expected: [what should happen]
What Actually Happened: [what you saw]
Files Checked: [list files you verified]
```

## SUCCESS CRITERIA

The implementation is successful when:
1. ✅ https://ai-trader-snowy.vercel.app loads without blank page
2. ✅ Radial menu is visible and interactive
3. ✅ Clicking radial segments loads different components
4. ✅ StatusBar shows "System operational"
5. ✅ API calls to backend succeed (no CORS errors)
6. ✅ Order execution (dry-run) returns success response

---

## Notes for Collaboration

- Each stage is completely self-contained
- Copy the ENTIRE stage block (including context) to VSCode Claude
- Wait for VSCode Claude to complete before moving to next stage
- If a stage fails, stop and troubleshoot before proceeding
- The stages are designed to be completed in order
- Total time estimate: 45-60 minutes for all stages

This plan fixes the immediate blocking issues while preserving your working backend and adding the radial UI as a navigation layer.