import { useState } from 'react';
import StatusBar from '../components/StatusBar';
import PositionsTable from '../components/PositionsTable';
import ExecuteTradeForm from '../components/ExecuteTradeForm';
import MorningRoutine from '../components/MorningRoutine';
import RadialMenuNav from '../components/RadialMenuNav';

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '256px' }}>
          <div style={{ fontSize: '18px', color: '#9ca3af' }}>Loading workflow...</div>
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
          <div style={{ padding: '24px', background: '#1f2937', borderRadius: '12px', color: 'white' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>P&L Dashboard</h3>
            <p style={{ color: '#9ca3af' }}>P&L tracking coming soon...</p>
          </div>
        );

      case 'news-review':
        return (
          <div style={{ padding: '24px', background: '#1f2937', borderRadius: '12px', color: 'white' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>News Review</h3>
            <p style={{ color: '#9ca3af' }}>Market news integration coming soon...</p>
          </div>
        );

      default:
        return (
          <div style={{ padding: '24px', background: '#1f2937', borderRadius: '12px', color: 'white' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px' }}>Welcome to AI Trader</h3>
            <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
              Select a workflow from the radial menu to begin trading operations.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
              <div style={{ padding: '16px', background: '#374151', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>Quick Start:</h4>
                <ul style={{ fontSize: '14px', color: '#9ca3af', listStyle: 'none', padding: 0 }}>
                  <li>• Click "Morning Routine" for system check</li>
                  <li>• Click "Positions" to view portfolio</li>
                  <li>• Click "Execute" to place orders</li>
                </ul>
              </div>
              <div style={{ padding: '16px', background: '#374151', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', marginBottom: '8px' }}>System Status:</h4>
                <StatusBar />
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #1f2937, #111827)', color: 'white' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid #374151', background: 'rgba(31, 41, 55, 0.5)', backdropFilter: 'blur(10px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold' }}>
              🎯 AI Trading Platform
            </h1>
            <StatusBar />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '600px 1fr', gap: '32px' }}>
          {/* Left: Radial Menu */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <RadialMenuNav onWorkflowSelect={handleWorkflowSelect} />
          </div>

          {/* Right: Dynamic Content */}
          <div style={{ flex: 1 }}>
            {renderWorkflowContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
