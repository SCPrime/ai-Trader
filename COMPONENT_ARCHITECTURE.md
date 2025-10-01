# Component Architecture Guide

This document explains the technical architecture of the AI Trading Platform, how components interact, and how to extend the system with new workflows.

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser (User)                         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Next.js Frontend (Vercel)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pages/index.tsx - Main Dashboard                    │  │
│  │    ├── RadialMenu.tsx (D3.js 8-segment navigation)   │  │
│  │    ├── PositionsTable.tsx (Live portfolio data)      │  │
│  │    ├── MorningRoutine.tsx (Health checks)            │  │
│  │    └── ExecuteTradeForm.tsx (Order form)             │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  pages/api/proxy/[...path].ts - API Middleware       │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS (Proxied)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            FastAPI Backend (Render)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  main.py - FastAPI Application                       │  │
│  │    ├── /api/health                                   │  │
│  │    ├── /api/portfolio/positions                      │  │
│  │    ├── /api/trades/execute                           │  │
│  │    └── [other endpoints]                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Alpaca Trading API                             │
│  (Market Data, Order Execution, Portfolio Management)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Frontend Architecture

### Directory Structure

```
frontend/
├── components/
│   ├── RadialMenu.tsx          # D3.js radial navigation menu
│   ├── PositionsTable.tsx      # Portfolio positions display
│   ├── MorningRoutine.tsx      # Health check workflow
│   ├── ExecuteTradeForm.tsx    # Trade execution form
│   └── [future components]     # P&L Dashboard, News Review, etc.
├── pages/
│   ├── index.tsx               # Main dashboard page
│   ├── test-radial.tsx         # Isolated radial menu test
│   ├── _app.tsx                # Next.js app wrapper (optional)
│   └── api/
│       └── proxy/
│           └── [...path].ts    # API proxy middleware
├── styles/                     # (Optional) Global styles
├── public/                     # Static assets
├── package.json
├── tsconfig.json
├── next.config.js              # (Optional) Next.js config
└── vercel.json                 # Vercel deployment config
```

---

## 🎨 RadialMenu Component Deep Dive

### How It Works

The `RadialMenu.tsx` component uses D3.js to create an interactive 8-segment pie chart navigation system.

#### Key Concepts

**1. D3.js Pie Layout**
```tsx
const pie = d3.pie<Workflow>()
  .value(1)                    // Each segment gets equal size
  .sort(null)                  // Maintain workflow order
  .startAngle(-Math.PI / 2)    // Start at top (12 o'clock)
  .padAngle(0.02);             // Small gap between segments
```

**2. Arc Generators**
```tsx
// Normal arc
const arc = d3.arc<d3.PieArcDatum<Workflow>>()
  .innerRadius(90)             // Inner donut radius
  .outerRadius(220);           // Outer radius

// Hover arc (expanded)
const arcHover = d3.arc<d3.PieArcDatum<Workflow>>()
  .innerRadius(90)
  .outerRadius(235);           // +15px expansion on hover
```

**3. Workflow Data Structure**
```tsx
interface Workflow {
  id: string;                  // 'morning-routine', 'active-positions', etc.
  name: string;                // Display name (supports \n for line breaks)
  icon: string;                // Emoji icon
  color: string;               // Segment color (hex)
  description: string;         // Full description for hover panel
}

const workflows: Workflow[] = [
  {
    id: 'morning-routine',
    name: 'Morning\nRoutine',
    icon: '☀️',
    color: '#00ACC1',
    description: 'Start your trading day...'
  },
  // ... 7 more workflows
];
```

#### Rendering Process

1. **SVG Setup**
```tsx
const svg = d3.select(svgRef.current)
  .attr('width', 600)
  .attr('height', 600)
  .attr('viewBox', `0 0 600 600`);
```

2. **Segment Creation**
```tsx
const segments = g.selectAll('.segment')
  .data(pie(workflows))          // Bind workflow data
  .enter()
  .append('g')
  .attr('class', 'segment-group');
```

3. **Path Elements**
```tsx
segments.append('path')
  .attr('d', arc)                // Generate arc path
  .attr('fill', d => d.data.color)
  .on('click', (event, d) => {
    onWorkflowSelect(d.data.id); // Callback to parent
  });
```

4. **Text Labels**
```tsx
// Icon
segments.append('text')
  .attr('transform', d => {
    const pos = labelArc.centroid(d);
    return `translate(${pos[0]}, ${pos[1] - 15})`;
  })
  .text(d => d.data.icon);

// Name (split by \n)
segments.each(function(d) {
  const lines = d.data.name.split('\n');
  lines.forEach((line, i) => {
    d3.select(this)
      .append('text')
      .attr('transform', `translate(..., ${15 + i * 16})`)
      .text(line);
  });
});
```

#### Adding a New Workflow Segment

To add a 9th workflow (requires redesigning 8-segment layout):

```tsx
// 1. Add to workflows array
{
  id: 'new-workflow',
  name: 'New\nWorkflow',
  icon: '🚀',
  color: '#FF6B6B',
  description: 'Description here'
}

// 2. No code changes needed in RadialMenu.tsx
// D3 automatically recalculates segment angles
```

---

## 🏠 Main Dashboard (pages/index.tsx)

### Component Structure

```tsx
export default function Dashboard() {
  // State
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [hoveredWorkflow, setHoveredWorkflow] = useState<Workflow | null>(null);

  // Determine which workflow to display
  const displayWorkflow = selectedWorkflow
    ? getWorkflowById(selectedWorkflow)
    : hoveredWorkflow;

  // Render workflow-specific content
  const renderWorkflowContent = () => {
    if (selectedWorkflow) {
      switch (selectedWorkflow) {
        case 'morning-routine':
          return <MorningRoutine />;
        case 'active-positions':
          return <PositionsTable />;
        case 'execute':
          return <ExecuteTradeForm />;
        // ... other workflows
        default:
          return null;
      }
    }

    // Show description on hover
    if (displayWorkflow) {
      return <WorkflowDescriptionPanel workflow={displayWorkflow} />;
    }

    // Default welcome message
    return <WelcomePanel />;
  };

  return (
    <div>
      <Header />
      <RadialMenu
        onWorkflowSelect={setSelectedWorkflow}
        onWorkflowHover={setHoveredWorkflow}
      />
      <InfoPanel selectedWorkflow={selectedWorkflow} />
      <WorkflowContentArea>
        {renderWorkflowContent()}
      </WorkflowContentArea>
      <KeyboardHints />
    </div>
  );
}
```

### Layout Flow

```
┌───────────────────────────────────┐
│           Header                  │ ← Fixed top
│   🎯 AI Trading Platform          │
├───────────────────────────────────┤
│                                   │
│      ┌─────────────┐              │
│      │   Radial    │              │ ← Centered, 600px max-width
│      │    Menu     │              │
│      └─────────────┘              │
│                                   │
├───────────────────────────────────┤
│       System Status Panel         │ ← Info panel below menu
│   🟢 Click any segment...         │
├───────────────────────────────────┤
│                                   │
│   Workflow Content Area           │ ← Dynamic content
│   (PositionsTable, MorningRoutine,│
│    ExecuteTradeForm, or           │
│    description panels)            │
│                                   │
├───────────────────────────────────┤
│     Keyboard Navigation Hints     │ ← Bottom hints
│   Tab → Enter → ← →               │
└───────────────────────────────────┘
```

### Styling Pattern

All components use inline styles with consistent theme:

```tsx
const theme = {
  // Backgrounds
  bgPrimary: '#0f172a',           // Main background
  bgSecondary: '#1e293b',         // Card backgrounds
  bgTertiary: '#374151',          // Borders

  // Text
  textPrimary: '#e2e8f0',         // Main text
  textSecondary: '#cbd5e1',       // Secondary text
  textMuted: '#94a3b8',           // Muted text

  // Accents
  accentPrimary: '#00ACC1',       // Primary accent (cyan)
  accentSecondary: '#7E57C2',     // Secondary accent (purple)
  success: '#00C851',             // Green
  danger: '#FF4444',              // Red
  warning: '#FF8800',             // Orange

  // Effects
  glassmorphism: {
    background: 'rgba(30, 41, 59, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  }
};
```

---

## 🔌 API Proxy Pattern

### Why Use a Proxy?

Direct browser requests to `https://ai-trader-86a1.onrender.com` would cause CORS errors. The proxy routes all requests through Next.js API routes.

### How It Works

**Frontend Request:**
```tsx
fetch('/api/proxy/api/portfolio/positions')
```

**Proxy Middleware** (`pages/api/proxy/[...path].ts`):
```tsx
export default async function handler(req, res) {
  const { path } = req.query;
  const pathString = Array.isArray(path) ? path.join('/') : path;

  const backendUrl = `https://ai-trader-86a1.onrender.com/${pathString}`;

  const response = await fetch(backendUrl, {
    method: req.method,
    headers: {
      'Content-Type': 'application/json',
      ...req.headers
    },
    body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
```

**Backend Receives:**
```
https://ai-trader-86a1.onrender.com/api/portfolio/positions
```

### Usage in Components

```tsx
// GET request
async function fetchPositions() {
  const res = await fetch('/api/proxy/api/portfolio/positions');
  const data = await res.json();
  return data;
}

// POST request
async function executeTrade(order) {
  const res = await fetch('/api/proxy/api/trades/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return await res.json();
}
```

---

## 🧩 Creating a New Workflow Component

### Step-by-Step Guide

**Step 1: Create Component File**

```tsx
// frontend/components/MyNewWorkflow.tsx
'use client';

import { useState, useEffect } from 'react';

interface MyData {
  // Define your data types
}

export default function MyNewWorkflow() {
  const [data, setData] = useState<MyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch('/api/proxy/api/my-endpoint');
        if (!res.ok) throw new Error('Failed to fetch');
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!data) return <div>No data</div>;

  return (
    <div style={{
      background: 'rgba(30, 41, 59, 0.8)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '16px',
      padding: '24px'
    }}>
      <h3 style={{ color: '#00ACC1', marginBottom: '16px' }}>
        My New Workflow
      </h3>
      {/* Your component UI */}
    </div>
  );
}
```

**Step 2: Add to RadialMenu Workflows**

```tsx
// frontend/components/RadialMenu.tsx
const workflows: Workflow[] = [
  // ... existing workflows
  {
    id: 'my-new-workflow',
    name: 'My New\nWorkflow',
    icon: '🚀',
    color: '#FF6B6B',
    description: 'This is my new workflow description'
  }
];
```

**Step 3: Add to Dashboard Switch Statement**

```tsx
// frontend/pages/index.tsx
const renderWorkflowContent = () => {
  if (selectedWorkflow) {
    switch (selectedWorkflow) {
      case 'morning-routine':
        return <MorningRoutine />;
      case 'active-positions':
        return <PositionsTable />;
      case 'execute':
        return <ExecuteTradeForm />;
      case 'my-new-workflow':
        return <MyNewWorkflow />;  // ← Add here
      // ... other workflows
      default:
        return null;
    }
  }
  // ...
};
```

**Step 4: Create Backend Endpoint**

```python
# backend/main.py
@app.get("/api/my-endpoint")
async def my_endpoint():
    return {"message": "Hello from new endpoint"}
```

**Step 5: Test Locally**

```bash
# Terminal 1: Backend
cd backend
python -m uvicorn main:app --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

Visit http://localhost:3000 and click your new workflow segment.

---

## 🎯 Component Best Practices

### 1. Consistent Styling

Always use the glassmorphism pattern:

```tsx
const cardStyle: React.CSSProperties = {
  background: 'rgba(30, 41, 59, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '24px',
  color: '#e2e8f0'
};
```

### 2. Error Handling

Always handle loading, error, and empty states:

```tsx
if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data || data.length === 0) return <EmptyState />;
```

### 3. TypeScript Types

Define interfaces for all data structures:

```tsx
interface Position {
  symbol: string;
  qty: number;
  avgEntryPrice: number;
  marketPrice: number;
  unrealizedPnL: number;
}
```

### 4. Auto-Refresh Pattern

Use `setInterval` for live data:

```tsx
useEffect(() => {
  fetchData(); // Initial fetch

  const interval = setInterval(() => {
    fetchData(); // Refresh every 30s
  }, 30000);

  return () => clearInterval(interval); // Cleanup
}, []);
```

### 5. Color Coding

Use consistent color scheme:

```tsx
const getPnLColor = (pnl: number) => {
  if (pnl > 0) return '#10b981';  // Green
  if (pnl < 0) return '#ef4444';  // Red
  return '#94a3b8';               // Gray
};
```

---

## 📊 Data Flow Example: PositionsTable

```
1. User clicks "Positions" segment
       ↓
2. RadialMenu calls onWorkflowSelect('active-positions')
       ↓
3. Dashboard updates selectedWorkflow state
       ↓
4. renderWorkflowContent() returns <PositionsTable />
       ↓
5. PositionsTable mounts, useEffect runs
       ↓
6. fetch('/api/proxy/api/portfolio/positions')
       ↓
7. Next.js proxy forwards to backend
       ↓
8. Backend calls Alpaca API
       ↓
9. Backend returns positions data
       ↓
10. Proxy forwards response to frontend
       ↓
11. PositionsTable updates state with data
       ↓
12. Component re-renders with table + P&L cards
       ↓
13. setInterval schedules auto-refresh in 30s
```

---

## 🔄 State Management Options

### Current: Component State
```tsx
const [data, setData] = useState<DataType | null>(null);
```

**Pros**: Simple, no dependencies
**Cons**: No sharing between components, no caching

### Option 1: React Context
```tsx
// Create global state
const PortfolioContext = createContext<Portfolio | null>(null);

// Provider in _app.tsx
<PortfolioContext.Provider value={portfolio}>
  <Component {...pageProps} />
</PortfolioContext.Provider>

// Use in components
const portfolio = useContext(PortfolioContext);
```

**Pros**: Share data between components
**Cons**: Manual caching, more boilerplate

### Option 2: React Query (Recommended)
```bash
npm install @tanstack/react-query
```

```tsx
// _app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
    </QueryClientProvider>
  );
}

// Component
import { useQuery } from '@tanstack/react-query';

function PositionsTable() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['positions'],
    queryFn: async () => {
      const res = await fetch('/api/proxy/api/portfolio/positions');
      return res.json();
    },
    refetchInterval: 30000 // Auto-refresh every 30s
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error</div>;
  return <div>{/* Render data */}</div>;
}
```

**Pros**: Automatic caching, refetching, error handling
**Cons**: Additional dependency

---

## 🧪 Testing Components

### Unit Tests (Jest + React Testing Library)

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

```tsx
// components/__tests__/PositionsTable.test.tsx
import { render, screen } from '@testing-library/react';
import PositionsTable from '../PositionsTable';

test('renders positions table', () => {
  render(<PositionsTable />);
  expect(screen.getByText('Active Positions')).toBeInTheDocument();
});
```

### Integration Tests (Mock API)

```tsx
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/proxy/api/portfolio/positions', (req, res, ctx) => {
    return res(ctx.json({ positions: [...] }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## 🚀 Performance Optimization

### 1. React.memo for Pure Components
```tsx
export default React.memo(function MyComponent({ data }) {
  // Only re-renders when data changes
});
```

### 2. useMemo for Expensive Calculations
```tsx
const totalPnL = useMemo(() => {
  return positions.reduce((sum, p) => sum + p.unrealizedPnL, 0);
}, [positions]);
```

### 3. useCallback for Event Handlers
```tsx
const handleClick = useCallback(() => {
  // Function reference stays stable
}, []);
```

### 4. Code Splitting
```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>
});
```

---

## 📝 Summary Checklist

When adding a new workflow:

- [ ] Create component in `frontend/components/`
- [ ] Add workflow to `RadialMenu.tsx` workflows array
- [ ] Add case to switch statement in `pages/index.tsx`
- [ ] Create backend API endpoints
- [ ] Test locally (backend + frontend)
- [ ] Handle loading/error states
- [ ] Use consistent styling (glassmorphism dark theme)
- [ ] Add TypeScript types
- [ ] Commit and push changes
- [ ] Verify production deployment

See [ROADMAP.md](./ROADMAP.md) for detailed specifications of each workflow to implement.
