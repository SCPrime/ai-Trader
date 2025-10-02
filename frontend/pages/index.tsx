import { useState } from 'react';
import RadialMenu, { workflows, Workflow } from '../components/RadialMenu';
import PositionsTable from '../components/PositionsTable';
import MorningRoutine from '../components/MorningRoutine';
import ExecuteTradeForm from '../components/ExecuteTradeForm';
import ResearchDashboard from '../components/trading/ResearchDashboard';
import Settings from '../components/Settings';

export default function Dashboard() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [hoveredWorkflow, setHoveredWorkflow] = useState<Workflow | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const getWorkflowById = (id: string) => {
    return workflows.find(w => w.id === id);
  };

  const displayWorkflow = selectedWorkflow ? getWorkflowById(selectedWorkflow) : hoveredWorkflow;

  // Render the active workflow component or description
  const renderWorkflowContent = () => {
    // If a workflow is selected, render its component
    if (selectedWorkflow) {
      switch (selectedWorkflow) {
        case 'morning-routine':
          return <MorningRoutine />;

        case 'active-positions':
          return <PositionsTable />;

        case 'execute':
          return <ExecuteTradeForm />;

        case 'research':
          return <ResearchDashboard />;

        case 'settings':
          setShowSettings(true);
          setSelectedWorkflow(''); // Clear selection after opening modal
          return null;

        case 'pnl-dashboard':
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #FF880040',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '200px'
            }}>
              <h4 style={{ color: '#FF8800', fontSize: '1.5rem', margin: 0, marginBottom: '16px' }}>
                💰 P&L Dashboard
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>
                Comprehensive profit and loss analysis with daily, weekly, and monthly performance metrics.
              </p>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Coming soon: Interactive charts, performance analytics, and detailed trade history.
              </p>
            </div>
          );

        case 'news-review':
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #7E57C240',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '200px'
            }}>
              <h4 style={{ color: '#7E57C2', fontSize: '1.5rem', margin: 0, marginBottom: '16px' }}>
                📰 News Review
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>
                Real-time market news aggregation with AI-powered sentiment analysis and breaking news alerts.
              </p>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Coming soon: Live news feed, sentiment indicators, and market-moving events.
              </p>
            </div>
          );

        case 'recommendations':
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #0097A740',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '200px'
            }}>
              <h4 style={{ color: '#0097A7', fontSize: '1.5rem', margin: 0, marginBottom: '16px' }}>
                🤖 AI Recommendations
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>
                AI-generated trade recommendations based on technical indicators, patterns, and market conditions.
              </p>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Coming soon: ML-powered trade signals, confidence scores, and backtested strategies.
              </p>
            </div>
          );

        case 'strategy-builder':
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #5E35B140',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '200px'
            }}>
              <h4 style={{ color: '#5E35B1', fontSize: '1.5rem', margin: 0, marginBottom: '16px' }}>
                🎯 Strategy Builder
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>
                Design, test, and refine custom trading strategies with drag-and-drop rule builder.
              </p>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Coming soon: Visual strategy designer, rule templates, and parameter optimization.
              </p>
            </div>
          );

        case 'backtesting':
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.8)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #00BCD440',
              borderRadius: '16px',
              padding: '24px',
              minHeight: '200px'
            }}>
              <h4 style={{ color: '#00BCD4', fontSize: '1.5rem', margin: 0, marginBottom: '16px' }}>
                📈 Backtesting
              </h4>
              <p style={{ color: '#cbd5e1', lineHeight: 1.6, margin: 0, marginBottom: '12px' }}>
                Test strategies against historical data to validate performance before live deployment.
              </p>
              <p style={{ color: '#94a3b8', fontStyle: 'italic', margin: 0 }}>
                Coming soon: Historical simulation, performance metrics, and risk analysis.
              </p>
            </div>
          );

        default:
          return null;
      }
    }

    // If hovering (but not selected), show description
    if (displayWorkflow) {
      return (
        <div style={{
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${displayWorkflow.color}40`,
          borderRadius: '16px',
          padding: '20px',
          minHeight: '100px',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <h4 style={{
            color: displayWorkflow.color,
            fontSize: '1.1rem',
            margin: 0,
            marginBottom: '10px'
          }}>
            {displayWorkflow.icon} {displayWorkflow.name.replace('\n', ' ')}
          </h4>
          <p style={{
            color: '#cbd5e1',
            lineHeight: 1.5,
            margin: 0
          }}>
            {displayWorkflow.description}
          </p>
        </div>
      );
    }

    // Default welcome message
    return (
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        minHeight: '100px'
      }}>
        <h4 style={{
          color: '#7E57C2',
          fontSize: '1.1rem',
          margin: 0,
          marginBottom: '10px'
        }}>
          Welcome to Your Trading Dashboard
        </h4>
        <p style={{
          color: '#cbd5e1',
          lineHeight: 1.5,
          margin: 0
        }}>
          Select a workflow stage from the radial menu above to begin. Each segment represents a key phase in your trading routine, from morning market analysis to strategy execution.
        </p>
      </div>
    );
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px',
      overflowX: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '30px',
        animation: 'fadeIn 0.8s ease-out'
      }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00ACC1, #7E57C2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          margin: 0,
          marginBottom: '10px'
        }}>
          🎯 AI Trading Platform
        </h1>
        <p style={{
          color: '#94a3b8',
          fontSize: '1rem',
          margin: 0
        }}>
          8-Stage Workflow Navigation
        </p>
      </div>

      {/* Radial Menu Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <RadialMenu
          onWorkflowSelect={setSelectedWorkflow}
          onWorkflowHover={setHoveredWorkflow}
        />
      </div>

      {/* Info Panel */}
      <div style={{
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '30px',
        width: '100%',
        maxWidth: '600px',
        animation: 'fadeIn 1s ease-out'
      }}>
        <h3 style={{
          color: '#00ACC1',
          fontSize: '1.25rem',
          margin: 0,
          marginBottom: '12px'
        }}>
          <span style={{
            display: 'inline-block',
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#00C851',
            marginRight: '8px',
            animation: 'pulse 2s infinite'
          }} />
          System Status
        </h3>
        <p style={{
          color: '#94a3b8',
          lineHeight: 1.6,
          margin: 0,
          marginBottom: '8px'
        }}>
          {selectedWorkflow ? 'Workflow active' : 'Click any segment to explore workflow stages'}
        </p>
        <p style={{
          color: '#94a3b8',
          lineHeight: 1.6,
          margin: 0
        }}>
          Hover for descriptions • Click for details
        </p>
      </div>

      {/* Workflow Content Area */}
      <div style={{
        marginTop: '20px',
        width: '100%',
        maxWidth: '600px',
        animation: 'slideUp 0.4s ease-out'
      }}>
        {renderWorkflowContent()}
      </div>

      {/* Keyboard Hints */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '12px',
        fontSize: '0.875rem',
        color: '#94a3b8',
        width: '100%',
        maxWidth: '600px'
      }}>
        <strong>Keyboard Navigation:</strong>
        {' '}
        <kbd style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#e2e8f0'
        }}>Tab</kbd>
        {' '}to focus • {' '}
        <kbd style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#e2e8f0'
        }}>Enter</kbd>
        {' '}to select • {' '}
        <kbd style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#e2e8f0'
        }}>→</kbd>
        {' '}
        <kbd style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '2px 8px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          color: '#e2e8f0'
        }}>←</kbd>
        {' '}to rotate
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.6;
            transform: scale(1.2);
          }
        }
      `}</style>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}
