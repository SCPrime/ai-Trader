import { useState } from 'react';
import RadialMenu, { workflows, Workflow } from '../components/RadialMenu';

export default function TestRadial() {
  const [selected, setSelected] = useState<string>('');
  const [hovered, setHovered] = useState<Workflow | null>(null);

  const getWorkflowById = (id: string) => {
    return workflows.find(w => w.id === id);
  };

  const displayWorkflow = selected ? getWorkflowById(selected) : hovered;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      color: '#e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px'
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
          marginBottom: '10px'
        }}>
          🎯 AI Trading Platform
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
          10 Stage Workflow Navigation - Phase 1 Test
        </p>
      </div>

      {/* Radial Menu */}
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <RadialMenu
          onWorkflowSelect={setSelected}
          onWorkflowHover={setHovered}
        />
      </div>

      {/* Info Panel */}
      <div style={{
        width: '100%',
        maxWidth: '600px',
        background: 'rgba(30, 41, 59, 0.8)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '24px',
        marginTop: '30px'
      }}>
        <h3 style={{ color: '#00ACC1', marginBottom: '12px', fontSize: '1.25rem' }}>
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
        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '8px' }}>
          Click any segment to explore workflow stages
        </p>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Hover for descriptions • Click for details
        </p>
      </div>

      {/* Workflow Description */}
      {displayWorkflow && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          border: `1px solid ${displayWorkflow.color}40`,
          borderRadius: '16px',
          padding: '20px',
          marginTop: '20px',
          minHeight: '100px',
          animation: 'slideUp 0.4s ease-out'
        }}>
          <h4 style={{
            color: displayWorkflow.color,
            marginBottom: '10px',
            fontSize: '1.1rem'
          }}>
            {displayWorkflow.icon} {displayWorkflow.name.replace('\n', ' ')}
            {selected === displayWorkflow.id && (
              <span style={{
                marginLeft: '12px',
                color: '#00C851',
                fontWeight: 600,
                fontSize: '0.9rem'
              }}>
                - Activated
              </span>
            )}
          </h4>
          <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
            {displayWorkflow.description}
          </p>
          {selected === displayWorkflow.id && (
            <p style={{
              marginTop: '12px',
              color: '#00C851',
              fontWeight: 600
            }}>
              ✓ Workflow loaded and ready
            </p>
          )}
        </div>
      )}

      {!displayWorkflow && (
        <div style={{
          width: '100%',
          maxWidth: '600px',
          background: 'rgba(30, 41, 59, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '20px',
          marginTop: '20px',
          minHeight: '100px'
        }}>
          <h4 style={{ color: '#7E57C2', marginBottom: '10px', fontSize: '1.1rem' }}>
            Welcome to Your Trading Dashboard
          </h4>
          <p style={{ color: '#cbd5e1', lineHeight: 1.5 }}>
            Select a workflow stage from the radial menu above to begin. Each segment represents a key phase in your trading routine, from morning market analysis to strategy execution.
          </p>
        </div>
      )}

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
    </div>
  );
}
