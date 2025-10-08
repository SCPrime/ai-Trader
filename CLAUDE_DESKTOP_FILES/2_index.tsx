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
  const [isUserSetup, setIsUserSetup] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userExists = isUserLoggedIn();
    setIsUserSetup(userExists);

    if (userExists) {
      initializeSession();
    }

    setIsLoading(false);
  }, []);

  const handleUserSetupComplete = () => {
    setIsUserSetup(true);
    initializeSession();
  };

  if (isLoading) {
    return null;
  }

  if (!isUserSetup) {
    return <UserSetup onComplete={handleUserSetupComplete} />;
  }

  const getWorkflowById = (id: string) => {
    return workflows.find(w => w.id === id);
  };

  const displayWorkflow = selectedWorkflow ? getWorkflowById(selectedWorkflow) : hoveredWorkflow;

  const renderWorkflowContent = () => {
    if (selectedWorkflow) {
      switch (selectedWorkflow) {
        case 'morning-routine':
          return <MorningRoutine />;
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
          return <StrategyBuilder />;
        case 'backtesting':
          return <Backtesting />;
        default:
          return null;
      }
    }

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
          Select a workflow stage from the radial menu above to begin.
        </p>
      </div>
    );
  };

  return (
    <>
      {!selectedWorkflow ? (
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

      <style jsx>{`
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

        :global(.gutter) {
          background-color: #10b981 !important;
        }

        :global(.gutter:hover) {
          background-color: #059669 !important;
        }
      `}</style>

      <Settings isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </>
  );
}
