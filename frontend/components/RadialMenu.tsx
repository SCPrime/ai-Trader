import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const workflows = [
  { id: 'morning-routine', name: 'MORNING\nROUTINE', color: '#00ACC1' },
  { id: 'news-review', name: 'NEWS\nREVIEW', color: '#7E57C2' },
  { id: 'proposals', name: 'AI\nRECS', color: '#0097A7' },
  { id: 'active-positions', name: 'ACTIVE\nPOSITIONS', color: '#00C851' },
  { id: 'pnl-dashboard', name: 'P&L\nDASHBOARD', color: '#FF8800' },
  { id: 'strategy-builder', name: 'STRATEGY\nBUILDER', color: '#5E35B1' },
  { id: 'backtesting', name: 'BACK\nTESTING', color: '#00BCD4' },
  { id: 'execute', name: 'EXECUTE', color: '#FF4444' },
  { id: 'research', name: 'RESEARCH', color: '#F97316' },
  { id: 'settings', name: 'SETTINGS', color: '#64748b' }
];

export default function RadialMenu() {
  const svgRef = useRef(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [hoveredWorkflow, setHoveredWorkflow] = useState(null);
  const [marketData] = useState({
    nasdaq: { value: 18234.56, change: 1.2 },
    nyse: { value: 16890.34, change: -0.3 }
  });

  const handleWorkflowClick = (workflowId) => {
    setSelectedWorkflow(workflowId);
  };

  const handleCenterClick = () => {
    setSelectedWorkflow(null);
  };

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 800;
    const radius = Math.min(width, height) / 2;
    const innerRadius = radius * 0.28;
    const outerRadius = radius * 0.92;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const defs = svg.append('defs');

    const centerGradient = defs.append('radialGradient')
      .attr('id', 'centerGradient');
    centerGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#0f172a');
    centerGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1e293b');

    const aiGradient = defs.append('linearGradient')
      .attr('id', 'aiGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '200%')
      .attr('y2', '0%');
    aiGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981');
    aiGradient.append('stop')
      .attr('offset', '25%')
      .attr('stop-color', '#34d399');
    aiGradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', '#6ee7b7');
    aiGradient.append('stop')
      .attr('offset', '75%')
      .attr('stop-color', '#34d399');
    aiGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981');

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height / 2})`);

    const pie = d3.pie()
      .value(1)
      .sort(null)
      .startAngle(-Math.PI / 2)
      .padAngle(0.004);

    const arc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius)
      .cornerRadius(1);

    const hoverArc = d3.arc()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 5)
      .cornerRadius(1);

    const segments = g.selectAll('.segment')
      .data(pie(workflows))
      .enter()
      .append('g')
      .attr('class', 'segment')
      .style('cursor', 'pointer');

    segments.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', '#000000')
      .attr('stroke-width', 1.5)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.4))')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('d', hoverArc);
        setHoveredWorkflow(d.data);
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(100)
          .attr('d', arc);
        setHoveredWorkflow(null);
      })
      .on('click', (event, d) => handleWorkflowClick(d.data.id));

    segments.append('text')
      .attr('transform', d => {
        const [x, y] = arc.centroid(d);
        return `translate(${x}, ${y})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '22px')
      .attr('font-weight', '900')
      .attr('font-style', 'italic')
      .attr('fill', 'white')
      .attr('letter-spacing', '1.5px')
      .style('text-shadow', '0 3px 8px rgba(0, 0, 0, 0.9)')
      .each(function(d) {
        const lines = d.data.name.split('\n');
        const text = d3.select(this);

        lines.forEach((line, i) => {
          text.append('tspan')
            .attr('x', 0)
            .attr('dy', i === 0 ? '-0.4em' : '1.3em')
            .text(line);
        });
      });

    const centerGroup = g.append('g')
      .style('cursor', 'pointer')
      .on('click', handleCenterClick);

    centerGroup.append('circle')
      .attr('r', innerRadius - 10)
      .attr('fill', 'url(#centerGradient)')
      .attr('stroke', '#059669')
      .attr('stroke-width', 2)
      .style('filter', 'drop-shadow(0 0 15px rgba(5, 150, 105, 0.3))');

    const logoGroup = centerGroup.append('g')
      .attr('transform', 'translate(0, -60)');

    logoGroup.append('text')
      .attr('x', -50)
      .attr('y', 0)
      .attr('font-size', '36px')
      .attr('font-weight', '900')
      .attr('font-style', 'italic')
      .attr('fill', '#047857')
      .attr('letter-spacing', '10px')
      .style('text-shadow', '0 0 10px rgba(5, 150, 105, 0.3)')
      .text('P');

    logoGroup.append('text')
      .attr('x', -10)
      .attr('y', 0)
      .attr('font-size', '36px')
      .attr('font-weight', '900')
      .attr('font-style', 'italic')
      .attr('fill', 'url(#aiGradient)')
      .attr('letter-spacing', '10px')
      .style('text-shadow', '0 0 20px rgba(16, 185, 129, 0.5)')
      .style('filter', 'drop-shadow(0 0 15px rgba(52, 211, 153, 0.9))')
      .text('ai');

    logoGroup.append('text')
      .attr('x', 30)
      .attr('y', 0)
      .attr('font-size', '36px')
      .attr('font-weight', '900')
      .attr('font-style', 'italic')
      .attr('fill', '#34d399')
      .attr('letter-spacing', '10px')
      .style('text-shadow', '0 0 10px rgba(52, 211, 153, 0.3)')
      .text('D');

    const nasdaq = centerGroup.append('g')
      .attr('transform', 'translate(0, -10)');

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '2.5px')
      .text('NASDAQ');

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '20')
      .attr('font-size', '22px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.5)')
      .text(marketData.nasdaq.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    nasdaq.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '36')
      .attr('font-size', '13px')
      .attr('font-weight', '800')
      .attr('fill', marketData.nasdaq.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 8px ' + (marketData.nasdaq.change >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'))
      .text(`${marketData.nasdaq.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.nasdaq.change)}%`);

    const nyse = centerGroup.append('g')
      .attr('transform', 'translate(0, 40)');

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '800')
      .attr('fill', '#cbd5e1')
      .attr('letter-spacing', '2.5px')
      .text('NYSE');

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '20')
      .attr('font-size', '22px')
      .attr('font-weight', '900')
      .attr('fill', '#f1f5f9')
      .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.5)')
      .text(marketData.nyse.value.toLocaleString('en-US', { minimumFractionDigits: 2 }));

    nyse.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '36')
      .attr('font-size', '13px')
      .attr('font-weight', '800')
      .attr('fill', marketData.nyse.change >= 0 ? '#10b981' : '#ef4444')
      .style('text-shadow', '0 0 8px ' + (marketData.nyse.change >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'))
      .text(`${marketData.nyse.change >= 0 ? '▲' : '▼'} ${Math.abs(marketData.nyse.change)}%`);

  }, [marketData]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="mb-8 text-center">
        <h1 className="text-9xl font-black mb-3 drop-shadow-2xl" style={{ fontStyle: 'italic' }}>
          <span className="text-emerald-800" style={{ letterSpacing: '0.15em' }}>P</span>
          <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 animate-pulse" style={{
            letterSpacing: '0.12em',
            filter: 'drop-shadow(0 0 30px rgba(16,185,129,0.5))'
          }}>ai</span>
          <span className="text-emerald-400" style={{ letterSpacing: '0.15em' }}>D</span>
        </h1>
        <p className="text-emerald-400 text-xl font-black tracking-[0.5em] uppercase drop-shadow-lg" style={{ fontStyle: 'italic' }}>
          10-STAGE WORKFLOW
        </p>
      </div>

      <svg ref={svgRef} className="drop-shadow-2xl" />

      {hoveredWorkflow && (
        <div className="mt-10 backdrop-blur-xl bg-gradient-to-br from-slate-800/60 to-slate-900/60 rounded-2xl border-2 border-emerald-500/50 px-10 py-6 max-w-lg shadow-2xl">
          <h3 className="text-3xl font-black text-white mb-2 tracking-wide" style={{ fontStyle: 'italic' }}>
            {hoveredWorkflow.name.replace('\n', ' ')}
          </h3>
        </div>
      )}
    </div>
  );
}
