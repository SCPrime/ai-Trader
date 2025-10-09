import { useState, useEffect } from 'react';
import Split from 'react-split';
import RadialMenu, { workflows, Workflow } from '../components/RadialMenu';
import PositionsTable from '../components/PositionsTable';
import MorningRoutine from '../components/MorningRoutine';
import MorningRoutineAI from '../components/MorningRoutineAI';
import ExecuteTradeForm from '../components/ExecuteTradeForm';
import ResearchDashboardSimple from '../components/ResearchDashboardSimple';
import AIRecommendations from '../components/AIRecommendations';
import ProposalReview from '../components/trading/ProposalReview';
import Settings from '../components/Settings';
import UserSetup from '../components/UserSetup';
import UserSetupAI from '../components/UserSetupAI';
import NewsReview from '../components/NewsReview';
import ActivePositions from '../components/ActivePositions';
import StrategyBuilder from '../components/StrategyBuilder';
import StrategyBuilderAI from '../components/StrategyBuilderAI';
import Backtesting from '../components/Backtesting';
import Analytics from '../components/Analytics';
import TradingJournal from '../components/TradingJournal';
import RiskDashboard from '../components/RiskDashboard';
import MarketScanner from '../components/MarketScanner';
import { isUserLoggedIn, initializeSession } from '../lib/userManagement';
import AIChat from '../components/AIChat';

export default function Dashboard() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [hoveredWorkflow, setHoveredWorkflow] = useState<Workflow | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isUserSetup, setIsUserSetup] = useState(false); // Start with onboarding
  const [isLoading, setIsLoading] = useState(true);
  const [aiChatOpen, setAiChatOpen] = useState(false);

  // Check if user is set up on mount
  useEffect(() => {
    // FOR TESTING: Always clear and show onboarding
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }

    const userExists = false; // Force onboarding for testing
    setIsUserSetup(userExists);

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
    return <UserSetupAI onComplete={handleUserSetupComplete} />;
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
          return <MorningRoutineAI />;

        case 'active-positions':
          return <ActivePositions />;

        case 'execute':
          return <ExecuteTradeForm />;

        case 'research':
          return <MarketScanner />;

        case 'proposals':
          return <AIRecommendations />;

        case 'settings':
          return <Settings isOpen={true} onClose={() => setSelectedWorkflow('')} />;

        case 'pnl-dashboard':
          return <Analytics />;

        case 'news-review':
          return <NewsReview />;


        case 'strategy-builder':
          return <StrategyBuilderAI />;

        case 'backtesting':
          return <Backtesting />;

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
            {/* Empty left space for symmetry */}
            <div></div>

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
        gutterSize={8}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        direction="horizontal"
        cursor="col-resize"
        className="split"
      >
        {/* Left panel - radial menu with header */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
          overflow: 'hidden',
        }}>
          {/* Header Logo */}
          <div style={{
            textAlign: 'center',
            paddingTop: '20px',
            paddingBottom: '10px',
          }}>
            <div style={{ fontSize: '48px', fontWeight: '900', lineHeight: '1', marginBottom: '8px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
              }}>P</span>
              <span style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.6), 0 0 40px rgba(16, 185, 129, 0.4)',
                animation: 'glow-ai 3s ease-in-out infinite'
              }}>aii</span>
              <span style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
              }}>D</span>
            </div>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              color: '#94a3b8',
              letterSpacing: '1px',
            }}>
              10 Stage Workflow
            </div>
          </div>

          {/* Radial Menu */}
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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
        </div>

        {/* Right panel - workflow content */}
        <div style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
          padding: '20px',
          color: '#e2e8f0'
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

        @keyframes glow-ai {
          0%, 100% {
            text-shadow: 0 0 15px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.2);
          }
          50% {
            text-shadow: 0 0 25px rgba(16, 185, 129, 0.6), 0 0 50px rgba(16, 185, 129, 0.4), 0 0 75px rgba(16, 185, 129, 0.2);
          }
        }

        /* React-split gutter styles - Claude-inspired */
        :global(.split-container) {
          width: 100%;
        }

        :global(.gutter) {
          background-color: rgba(30, 41, 59, 0.8) !important;
          background-repeat: no-repeat;
          background-position: center;
          transition: all 0.2s ease;
          border: none !important;
          position: relative;
          backdrop-filter: blur(10px);
        }

        :global(.gutter:hover) {
          background-color: rgba(16, 185, 129, 0.15) !important;
        }

        :global(.gutter:active) {
          background-color: rgba(16, 185, 129, 0.25) !important;
        }

        :global(.gutter-horizontal) {
          cursor: col-resize !important;
          position: relative;
        }

        /* Grip indicator - vertical dots like Claude */
        :global(.gutter-horizontal::before) {
          content: '';
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 3px;
          height: 40px;
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(16, 185, 129, 0.4) 20%,
            rgba(16, 185, 129, 0.6) 50%,
            rgba(16, 185, 129, 0.4) 80%,
            transparent 100%
          );
          border-radius: 2px;
          transition: all 0.2s ease;
        }

        :global(.gutter-horizontal:hover::before) {
          background: linear-gradient(
            to bottom,
            transparent 0%,
            rgba(16, 185, 129, 0.6) 20%,
            rgba(16, 185, 129, 0.9) 50%,
            rgba(16, 185, 129, 0.6) 80%,
            transparent 100%
          );
          height: 60px;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
        }

        :global(.gutter-horizontal:active::before) {
          background: rgba(16, 185, 129, 1);
          height: 80px;
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }

        :global(.left-panel),
        :global(.right-panel) {
          overflow-y: auto;
          height: 100vh;
        }
      `}</style>

      {/* Settings Modal */}
      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* AI Chat Modal */}
      <AIChat
        isOpen={aiChatOpen}
        onClose={() => setAiChatOpen(false)}
        initialMessage="Hi! I'm your PaiiD AI assistant. I can help you with trading strategies, build custom workflows, analyze market data, or adjust your preferences. What would you like to know?"
      />
    </>
  );
}
