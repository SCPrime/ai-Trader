import { useState, useEffect } from 'react';
import Split from 'react-split';
import RadialMenu, { workflows, Workflow } from '../components/RadialMenu';
import PositionsTable from '../components/PositionsTable';
import MorningRoutine from '../components/MorningRoutine';
import ExecuteTradeForm from '../components/ExecuteTradeForm';
import ResearchDashboardSimple from '../components/ResearchDashboardSimple';
import AIRecommendations from '../components/AIRecommendations';
import ProposalReview from '../components/trading/ProposalReview';
import Settings from '../components/Settings';
import UserSetup from '../components/UserSetup';
import NewsReview from '../components/NewsReview';
import ActivePositions from '../components/ActivePositions';
import StrategyBuilder from '../components/StrategyBuilder';
import Backtesting from '../components/Backtesting';
import Analytics from '../components/Analytics';
import TradingJournal from '../components/TradingJournal';
import RiskDashboard from '../components/RiskDashboard';
import MarketScanner from '../components/MarketScanner';
import { isUserLoggedIn, initializeSession } from '../lib/userManagement';

export default function Dashboard() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [hoveredWorkflow, setHoveredWorkflow] = useState<Workflow | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isUserSetup, setIsUserSetup] = useState(true); // TEMP: Skip UserSetup for testing
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is set up on mount
  useEffect(() => {
    const userExists = isUserLoggedIn();
    setIsUserSetup(userExists);

    if (userExists) {
      // Initialize or restore session
      initializeSession();
    }

    setIsLoading(false);
  }, []);

  // Handle user setup completion
  const handleUserSetupComplete = () => {
    setIsUserSetup(true);
    initializeSession();
  };

  // Show loading state briefly
  if (isLoading) {
    return null;
  }

  // Show user setup modal if not set up
  if (!isUserSetup) {
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

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
          return <ActivePositions />;

        case 'execute':
          return <ExecuteTradeForm />;

        case 'research':
          return <ResearchDashboardSimple />;

        case 'proposals':
          return <AIRecommendations />;

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
          return <NewsReview />;


        case 'strategy-builder':
          return <StrategyBuilder />;

        case 'backtesting':
          return <Backtesting />;

        case 'analytics':
          return <Analytics />;

        case 'journal':
          return <TradingJournal />;

        case 'risk':
          return <RiskDashboard />;

        case 'scanner':
          return <MarketScanner />;

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
    <>
      {!selectedWorkflow ? (
        // Full screen view when no workflow selected
        <div style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
          overflow: 'hidden',
          padding: 0,
          margin: 0,
          position: 'relative'
        }}>
          {/* Radial Menu Container - centered and scaled to fit */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            maxHeight: 'calc(100vh - 100px)',
            overflow: 'hidden',
            paddingTop: '20px',
            paddingBottom: '20px'
          }}>
            <div style={{
              transform: 'scale(0.65)',
              transformOrigin: 'center center'
            }}>
              <RadialMenu
                onWorkflowSelect={setSelectedWorkflow}
                onWorkflowHover={setHoveredWorkflow}
              />
            </div>
          </div>

          {/* Bottom Info Bar - absolute positioned */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'rgba(15, 24, 40, 0.95)',
            backdropFilter: 'blur(10px)',
            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
            padding: '16px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10
          }}>
            {/* System Status */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#10b981',
              fontSize: '14px'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                animation: 'pulse 2s infinite'
              }} />
              System Ready
            </div>

            {/* Keyboard Hints */}
            <div style={{
              fontSize: '0.875rem',
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span>
                <kbd style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  marginRight: '4px'
                }}>Tab</kbd>
                focus
              </span>
              <span>
                <kbd style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  marginRight: '4px'
                }}>Enter</kbd>
                select
              </span>
              <span>
                <kbd style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                  color: '#e2e8f0',
                  marginRight: '4px'
                }}>← →</kbd>
                rotate
              </span>
            </div>

            {/* Hover Description */}
            <div style={{
              color: '#cbd5e1',
              fontSize: '14px',
              fontStyle: 'italic',
              maxWidth: '300px',
              textAlign: 'right'
            }}>
              {hoveredWorkflow ? hoveredWorkflow.description : 'Hover over segments for details'}
            </div>
          </div>
        </div>
      ) : (
        // Split view when workflow selected
        <Split
        sizes={[40, 60]}
        minSize={[350, 400]}
        expandToMin={false}
        gutterSize={1}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
        className="split"
      >
        {/* Left panel - radial menu */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
        }}>
          <div style={{
            transform: 'scale(0.5)',
            transformOrigin: 'center center'
          }}>
            <RadialMenu
              onWorkflowSelect={setSelectedWorkflow}
              onWorkflowHover={setHoveredWorkflow}
              selectedWorkflow={selectedWorkflow}
              compact={true}
            />
          </div>
        </div>

        {/* Right panel - workflow content */}
        <div style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
          padding: '20px',
        }}>
          {renderWorkflowContent()}
        </div>
      </Split>
      )}

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

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        /* React-split gutter styles */
        :global(.split-container) {
          width: 100%;
        }

        :global(.gutter) {
          background-color: #10b981 !important;
          background-repeat: no-repeat;
          background-position: 50%;
          transition: background-color 0.2s ease;
          border: none !important;
        }

        :global(.gutter:hover) {
          background-color: #059669 !important;
        }

        :global(.gutter-horizontal) {
          cursor: col-resize !important;
          background-color: #10b981 !important;
        }

        :global(.gutter.gutter-horizontal) {
          cursor: col-resize !important;
          background-color: #10b981 !important;
        }

        :global(.left-panel),
        :global(.right-panel) {
          overflow-y: auto;
          height: 100vh;
        }
      `}</style>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
