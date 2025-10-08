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
  const [marketData] = useState({
    nasdaq: { value: 18234.56, change: 1.2 },
    nyse: { value: 16890.34, change: -0.3 }
  });

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

    // SVG FILTERS
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

    // GRADIENTS
    const centerGradient = defs.append('radialGradient')
      .attr('id', 'centerGradient');
    centerGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0f172a');
    centerGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e293b');

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

    // CENTER CIRCLE
    const centerGroup = g.append('g')
      .style('cursor', 'pointer')
      .on('click', () => onWorkflowSelect(''));

    centerGroup.append('circle')
      .attr('r', innerRadius - 15)
      .attr('fill', 'url(#centerGradient)')
      .attr('stroke', '#059669')
      .attr('stroke-width', 3);

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

    // MARKET DATA
    const nasdaq = centerGroup.append('g')
      .attr('transform', 'translate(0, -15)');

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '3px')
      .style('pointer-events', 'none')
      .text('NASDAQ');

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '22')
      .attr('font-size', '24px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 6px rgba(0, 0, 0, 0.6)')
      .style('pointer-events', 'none')
      .text(marketData.nasdaq.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '40')
      .attr('font-size', '14px')
      .attr('font-weight', '800')
      .attr('fill', marketData.nasdaq.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 10px ' + (marketData.nasdaq.change >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'))
      .style('pointer-events', 'none')
      .text(`${marketData.nasdaq.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.nasdaq.change)}%`);

    const nyse = centerGroup.append('g')
      .attr('transform', 'translate(0, 45)');

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '3px')
      .style('pointer-events', 'none')
      .text('NYSE');

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '22')
      .attr('font-size', '24px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 6px rgba(0, 0, 0, 0.6)')
      .style('pointer-events', 'none')
      .text(marketData.nyse.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '40')
      .attr('font-size', '14px')
      .attr('font-weight', '800')
      .attr('fill', marketData.nyse.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 10px ' + (marketData.nyse.change >= 0 ? 'rgba(16, 185, 129, 0.5)' : 'rgba(239, 68, 68, 0.5)'))
      .style('pointer-events', 'none')
      .text(`${marketData.nyse.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.nyse.change)}%`);

  }, []);

  useEffect(() => {
    if (!svgRef.current || !selectedWorkflow) return;

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
      {!compact && (
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '145px', fontWeight: '900', fontStyle: 'italic', lineHeight: '1', marginBottom: '10px' }}>
            <span style={{ color: '#1a7560' }}>P</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              color: '#45f0c0',
              textShadow: '0 0 20px #45f0c0, 0 0 40px #45f0c0',
              animation: 'glow-a 3s ease-in-out infinite'
            }}>a</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              color: '#58ffda',
              textShadow: '0 0 25px #58ffda, 0 0 50px #58ffda',
              animation: 'glow-i 3s ease-in-out infinite 0.75s'
            }}>i</span>
            <span style={{ color: '#0d5a4a' }}>D</span>
          </div>
          <div style={{
            fontSize: '28px',
            fontWeight: '600',
            color: '#94a3b8',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
          }}>
            10 Stage Workflow
          </div>
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <svg ref={svgRef} className="drop-shadow-2xl" />

        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          marginTop: '-70px'
        }}>
          <div style={{
            fontSize: '42px',
            fontWeight: '900',
            fontStyle: 'italic',
            lineHeight: '1',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ color: '#1a7560' }}>P</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              color: '#45f0c0',
              textShadow: '0 0 20px #45f0c0, 0 0 40px #45f0c0',
              animation: 'glow-a 3s ease-in-out infinite'
            }}>a</span>
            <span style={{
              fontFamily: 'Georgia, serif',
              color: '#58ffda',
              textShadow: '0 0 25px #58ffda, 0 0 50px #58ffda',
              animation: 'glow-i 3s ease-in-out infinite 0.75s'
            }}>i</span>
            <span style={{ color: '#0d5a4a', marginLeft: '4px' }}>D</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes glow-a {
          0%, 100% {
            text-shadow: 0 0 10px #45f0c0, 0 0 20px #45f0c0;
          }
          50% {
            text-shadow: 0 0 25px #45f0c0, 0 0 50px #45f0c0, 0 0 75px #45f0c0;
          }
        }
        @keyframes glow-i {
          0%, 100% {
            text-shadow: 0 0 12px #58ffda, 0 0 24px #58ffda;
          }
          50% {
            text-shadow: 0 0 28px #58ffda, 0 0 56px #58ffda, 0 0 84px #58ffda;
          }
        }
      `}</style>
    </div>
  );
}
