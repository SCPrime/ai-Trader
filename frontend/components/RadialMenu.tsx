import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export interface Workflow {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

interface RadialMenuProps {
  onWorkflowSelect: (workflowId: string) => void;
  onWorkflowHover?: (workflow: Workflow | null) => void;
  selectedWorkflow?: string;
  compact?: boolean;
}

export const workflows: Workflow[] = [
  { id: 'morning-routine', name: 'MORNING\nROUTINE', color: '#00ACC1', icon: '🌅', description: 'Start your day with market analysis, portfolio review, and trading alerts.' },
  { id: 'news-review', name: 'NEWS\nREVIEW', color: '#7E57C2', icon: '📰', description: 'Real-time market news aggregation with AI-powered sentiment analysis.' },
  { id: 'proposals', name: 'AI\nRECS', color: '#0097A7', icon: '🤖', description: 'Review AI-generated trading recommendations and strategy proposals.' },
  { id: 'active-positions', name: 'ACTIVE\nPOSITIONS', color: '#00C851', icon: '📊', description: 'Monitor and manage your current open positions and orders.' },
  { id: 'pnl-dashboard', name: 'P&L\nDASHBOARD', color: '#FF8800', icon: '💰', description: 'Analytics, performance metrics, equity curves, and trading statistics.' },
  { id: 'strategy-builder', name: 'STRATEGY\nBUILDER', color: '#5E35B1', icon: '🎯', description: 'Design and test custom trading strategies with drag-and-drop rules.' },
  { id: 'backtesting', name: 'BACK\nTESTING', color: '#00BCD4', icon: '📈', description: 'Test strategies against historical data to validate performance.' },
  { id: 'execute', name: 'EXECUTE', color: '#FF4444', icon: '⚡', description: 'Execute trades with pre-filled orders and real-time confirmation.' },
  { id: 'research', name: 'RESEARCH', color: '#F97316', icon: '🔍', description: 'Market scanner, technical analysis, charts, and trading opportunities.' },
  { id: 'settings', name: 'SETTINGS', color: '#64748b', icon: '⚙️', description: 'Trading journal, risk control, and system configuration.' }
];

export default function RadialMenu({ onWorkflowSelect, onWorkflowHover, selectedWorkflow, compact }: RadialMenuProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredWorkflow, setHoveredWorkflow] = useState<Workflow | null>(null);
  const [showAIChat, setShowAIChat] = useState(false);
  const [marketData, setMarketData] = useState({
    dow: { value: 0, change: 0, symbol: 'DJI' },
    nasdaq: { value: 0, change: 0, symbol: 'COMP' }
  });

  // Fetch live market data from backend
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const apiToken = process.env.NEXT_PUBLIC_API_TOKEN || 'rnd_bDRqi1TvLvd3rC78yvUSgDraH2Kl';
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL || 'http://127.0.0.1:8001';

        const response = await fetch(`${backendUrl}/api/market/indices`, {
          headers: {
            'Authorization': `Bearer ${apiToken}`
          }
        });

        if (response.ok) {
          const data = await response.json();

          setMarketData({
            dow: {
              value: data.dow?.last || 0,
              change: data.dow?.changePercent || 0,
              symbol: 'DJI'
            },
            nasdaq: {
              value: data.nasdaq?.last || 0,
              change: data.nasdaq?.changePercent || 0,
              symbol: 'COMP'
            }
          });
        }
      } catch (error) {
        console.error('[RadialMenu] Failed to fetch market data:', error);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  // Debug logging for Fast Refresh loop detection
  useEffect(() => {
    console.log('RadialMenu rendered with selectedWorkflow:', selectedWorkflow);
  }, [selectedWorkflow]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 900;
    const height = 900;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.30;
    const outerRadius = radius * 0.90;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    // ====== SVG FILTERS ======

    // Normal shadow filter
    const normalShadow = defs.append('filter')
      .attr('id', 'normalShadow')
      .attr('height', '150%')
      .attr('width', '150%');
    normalShadow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '3');
    normalShadow.append('feOffset')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('result', 'offsetblur');
    normalShadow.append('feComponentTransfer')
      .append('feFuncA')
      .attr('type', 'linear')
      .attr('slope', '0.4');
    const normalMerge = normalShadow.append('feMerge');
    normalMerge.append('feMergeNode');
    normalMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Hover glow filter
    const hoverGlow = defs.append('filter')
      .attr('id', 'hoverGlow')
      .attr('height', '200%')
      .attr('width', '200%')
      .attr('x', '-50%')
      .attr('y', '-50%');
    hoverGlow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '8')
      .attr('result', 'blur');
    hoverGlow.append('feFlood')
      .attr('flood-color', '#00ffff')
      .attr('flood-opacity', '0.6');
    hoverGlow.append('feComposite')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'glow');
    const hoverMerge = hoverGlow.append('feMerge');
    hoverMerge.append('feMergeNode').attr('in', 'glow');
    hoverMerge.append('feMergeNode').attr('in', 'glow');
    hoverMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Click glow filter
    const clickGlow = defs.append('filter')
      .attr('id', 'clickGlow')
      .attr('height', '300%')
      .attr('width', '300%')
      .attr('x', '-100%')
      .attr('y', '-100%');
    clickGlow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '12')
      .attr('result', 'blur');
    clickGlow.append('feFlood')
      .attr('flood-color', '#ffffff')
      .attr('flood-opacity', '0.8');
    clickGlow.append('feComposite')
      .attr('in2', 'blur')
      .attr('operator', 'in')
      .attr('result', 'glow');
    const clickMerge = clickGlow.append('feMerge');
    clickMerge.append('feMergeNode').attr('in', 'glow');
    clickMerge.append('feMergeNode').attr('in', 'glow');
    clickMerge.append('feMergeNode').attr('in', 'glow');
    clickMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Inner shadow filter
    const innerShadow = defs.append('filter')
      .attr('id', 'innerShadow');
    innerShadow.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '3')
      .attr('result', 'blur');
    innerShadow.append('feOffset')
      .attr('in', 'blur')
      .attr('dx', '0')
      .attr('dy', '2')
      .attr('result', 'offsetBlur');
    innerShadow.append('feFlood')
      .attr('flood-color', '#000000')
      .attr('flood-opacity', '0.5')
      .attr('result', 'color');
    innerShadow.append('feComposite')
      .attr('in', 'color')
      .attr('in2', 'offsetBlur')
      .attr('operator', 'in')
      .attr('result', 'shadow');
    innerShadow.append('feComposite')
      .attr('in', 'shadow')
      .attr('in2', 'SourceAlpha')
      .attr('operator', 'in');
    const innerMerge = innerShadow.append('feMerge');
    innerMerge.append('feMergeNode');
    innerMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Sparkles filter
    const sparkles = defs.append('filter')
      .attr('id', 'sparkles')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    sparkles.append('feGaussianBlur')
      .attr('in', 'SourceAlpha')
      .attr('stdDeviation', '2')
      .attr('result', 'blur');
    sparkles.append('feSpecularLighting')
      .attr('in', 'blur')
      .attr('surfaceScale', '5')
      .attr('specularConstant', '0.75')
      .attr('specularExponent', '20')
      .attr('lighting-color', '#ffffff')
      .attr('result', 'spec')
      .append('fePointLight')
      .attr('x', '0')
      .attr('y', '0')
      .attr('z', '100');
    sparkles.append('feComposite')
      .attr('in', 'spec')
      .attr('in2', 'SourceAlpha')
      .attr('operator', 'in')
      .attr('result', 'specOut');
    const sparkleMerge = sparkles.append('feMerge');
    sparkleMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    sparkleMerge.append('feMergeNode').attr('in', 'specOut');

    // AI Glow filter for center logo
    const aiGlow = defs.append('filter')
      .attr('id', 'aiGlow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    aiGlow.append('feGaussianBlur')
      .attr('stdDeviation', '4')
      .attr('result', 'coloredBlur');
    const aiMerge = aiGlow.append('feMerge');
    aiMerge.append('feMergeNode').attr('in', 'coloredBlur');
    aiMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // ====== GRADIENTS ======

    // Center gradient
    const centerGradient = defs.append('radialGradient')
      .attr('id', 'centerGradient');
    centerGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0f172a');
    centerGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e293b');

    // Animated radial gradients for each wedge with wave effects
    workflows.forEach((workflow, i) => {
      const wedgeGradient = defs.append('radialGradient')
        .attr('id', `wedgeGradient${i}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');

      wedgeGradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', workflow.color)
        .attr('stop-opacity', '1');

      wedgeGradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', workflow.color)
        .attr('stop-opacity', '0.7');

      // Animate the gradient
      wedgeGradient.select('stop:first-child')
        .append('animate')
        .attr('attributeName', 'stop-opacity')
        .attr('values', '1;0.8;1')
        .attr('dur', '3s')
        .attr('repeatCount', 'indefinite');
    });

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie<Workflow>()
      .value(1)
      .sort(null)
      .startAngle(-Math.PI / 2)
      .padAngle(0.008);

    const arc = d3.arc<d3.PieArcDatum<Workflow>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(3);

    const hoverArc = d3.arc<d3.PieArcDatum<Workflow>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 12)
      .cornerRadius(3);

    const segments = g.selectAll('.segment')
      .data(pie(workflows))
      .enter()
      .append('g')
      .attr('class', 'segment')
      .style('cursor', 'pointer');

    segments.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => `url(#wedgeGradient${i})`)
      .attr('stroke', '#000000')
      .attr('stroke-width', 2)
      .style('filter', 'url(#normalShadow)')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', hoverArc)
          .style('filter', 'url(#hoverGlow)');
        setHoveredWorkflow(d.data);
        if (onWorkflowHover) onWorkflowHover(d.data);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('d', arc)
          .style('filter', 'url(#normalShadow)');
        setHoveredWorkflow(null);
        if (onWorkflowHover) onWorkflowHover(null);
      })
      .on('mousedown', function() {
        d3.select(this)
          .style('filter', 'url(#clickGlow)');
      })
      .on('mouseup', function() {
        d3.select(this)
          .style('filter', 'url(#hoverGlow)');
      })
      .on('click', (event, d) => {
        console.log('RadialMenu: Workflow clicked:', d.data.id);
        onWorkflowSelect(d.data.id);
      });

    segments.append('text')
      .attr('transform', d => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '24px')
      .attr('font-weight', '900')
      .attr('font-style', 'italic')
      .attr('fill', 'white')
      .attr('letter-spacing', '2px')
      .style('text-shadow', '0 4px 12px rgba(0, 0, 0, 0.9), 0 2px 4px rgba(0, 0, 0, 0.8)')
      .style('pointer-events', 'none')
      .style('filter', 'url(#sparkles)')
      .each(function(d) {
        const lines = d.data.name.split('\n');
        const text = d3.select(this);

        lines.forEach((line, i) => {
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '-0.5em' : '1.4em')
            .text(line);
        });
      });

    // ====== CENTER CIRCLE ======
    const centerGroup = g.append('g')
      .style('cursor', 'pointer')
      .on('click', () => onWorkflowSelect(''));

    centerGroup.append('circle')
      .attr('r', innerRadius - 15)
      .attr('fill', 'url(#centerGradient)')
      .attr('stroke', '#059669')
      .attr('stroke-width', 3)
      .style('filter', 'url(#innerShadow)');

    // Animated ring around center
    centerGroup.append('circle')
      .attr('r', innerRadius - 15)
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .attr('opacity', 0.3)
      .append('animate')
      .attr('attributeName', 'opacity')
      .attr('values', '0.3;0.8;0.3')
      .attr('dur', '2s')
      .attr('repeatCount', 'indefinite');

    // ====== CENTER LOGO (PaiiD) ======
    // Note: Logo rendered as HTML overlay for CSS animation compatibility

    // ====== MARKET DATA ======
    const dow = centerGroup.append('g')
      .attr('transform', 'translate(0, -15)');

    dow.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '2px')
      .style('pointer-events', 'none')
      .text('DOW JONES INDUSTRIAL');

    dow.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '20')
      .attr('font-size', '22px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 6px rgba(0, 0, 0, 0.6)')
      .style('pointer-events', 'none')
      .text(marketData.dow.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    const dowChange = dow.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '38')
      .attr('font-size', '13px')
      .attr('font-weight', '800')
      .attr('fill', marketData.dow.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 10px ' + (marketData.dow.change >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'))
      .style('pointer-events', 'none')
      .text(`${marketData.dow.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.dow.change).toFixed(2)}%`);

    // Animate market data
    dowChange
      .transition()
      .duration(1000)
      .style('opacity', 0.7)
      .transition()
      .duration(1000)
      .style('opacity', 1)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(1000)
          .style('opacity', 0.7)
          .transition()
          .duration(1000)
          .style('opacity', 1)
          .on('end', repeat);
      });

    const nasdaqGroup = centerGroup.append('g')
      .attr('transform', 'translate(0, 45)');

    nasdaqGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '2px')
      .style('pointer-events', 'none')
      .text('NASDAQ COMPOSITE');

    nasdaqGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '20')
      .attr('font-size', '22px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 6px rgba(0, 0, 0, 0.6)')
      .style('pointer-events', 'none')
      .text(marketData.nasdaq.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    const nasdaqChange = nasdaqGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '38')
      .attr('font-size', '13px')
      .attr('font-weight', '800')
      .attr('fill', marketData.nasdaq.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 10px ' + (marketData.nasdaq.change >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'))
      .style('pointer-events', 'none')
      .text(`${marketData.nasdaq.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.nasdaq.change).toFixed(2)}%`);

    // Animate market data
    nasdaqChange
      .transition()
      .duration(1000)
      .delay(500)
      .style('opacity', 0.7)
      .transition()
      .duration(1000)
      .style('opacity', 1)
      .on('end', function repeat() {
        d3.select(this)
          .transition()
          .duration(1000)
          .style('opacity', 0.7)
          .transition()
          .duration(1000)
          .style('opacity', 1)
          .on('end', repeat);
      });

  }, []); // Empty array - only run once on mount to prevent infinite re-renders

  // Separate effect for selectedWorkflow updates - only update selected wedge styling
  useEffect(() => {
    if (!svgRef.current || !selectedWorkflow) return;

    // Update only the selected wedge styling without full re-render
    d3.select(svgRef.current)
      .selectAll('.segment path')
      .style('filter', function(this: any, d: any) {
        return d.data.id === selectedWorkflow ? 'url(#clickGlow)' : 'url(#normalShadow)';
      });
  }, [selectedWorkflow]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f1828 0%, #1a2a3f 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      {/* Title Header - only show in full screen mode */}
      {!compact && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Main Logo */}
          <div style={{ fontSize: '145px', fontWeight: '900', lineHeight: '1', marginBottom: '16px' }}>
            <span style={{
              background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
            }}>P</span>
            <span
              onClick={() => setShowAIChat(true)}
              style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.5)',
                animation: 'glow-ai 3s ease-in-out infinite',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >aii</span>
            <span style={{
              background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
            }}>D</span>
          </div>

          {/* Line 1: Personal Artificial Intelligence Dashboard */}
          <div style={{
            fontSize: '22px',
            fontWeight: '600',
            color: '#cbd5e1',
            letterSpacing: '3px',
            marginBottom: '12px',
            textShadow: '0 2px 8px rgba(0, 0, 0, 0.6)'
          }}>
            Personal Artificial Intelligence Dashboard
          </div>

          {/* Line 2: 10 Stage Workflow */}
          <div style={{
            fontSize: '18px',
            fontWeight: '500',
            color: '#94a3b8',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            10 Stage Workflow
          </div>
        </div>
      )}

      {/* SVG Radial Menu */}
      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} className="drop-shadow-2xl" />

        {/* Center Logo Overlay - matches top logo styling */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'auto',
          marginTop: '-70px' // Adjust to position above market data
        }}>
          <div style={{
            fontSize: '42px',
            fontWeight: '900',
            lineHeight: '1',
            whiteSpace: 'nowrap'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
            }}>P</span>
            <span
              onClick={() => setShowAIChat(true)}
              style={{
                background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 20px rgba(16, 185, 129, 0.8), 0 0 40px rgba(16, 185, 129, 0.5)',
                animation: 'glow-ai 3s ease-in-out infinite',
                cursor: 'pointer',
                transition: 'transform 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >aii</span>
            <span style={{
              background: 'linear-gradient(135deg, #1a7560 0%, #0d5a4a 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 4px 12px rgba(26, 117, 96, 0.4))'
            }}>D</span>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes glow-ai {
          0%, 100% {
            text-shadow: 0 0 15px rgba(16, 185, 129, 0.6), 0 0 30px rgba(16, 185, 129, 0.4);
          }
          50% {
            text-shadow: 0 0 25px rgba(16, 185, 129, 0.9), 0 0 50px rgba(16, 185, 129, 0.6), 0 0 75px rgba(16, 185, 129, 0.3);
          }
        }
      `}</style>
    </div>
  );
}
