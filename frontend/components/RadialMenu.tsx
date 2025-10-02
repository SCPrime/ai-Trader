'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface Workflow {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

interface RadialMenuProps {
  onWorkflowSelect: (workflowId: string) => void;
  onWorkflowHover?: (workflow: Workflow) => void;
}

const workflows: Workflow[] = [
  {
    id: 'morning-routine',
    name: 'Morning\nRoutine',
    icon: '☀️',
    color: '#00ACC1',
    description: 'Start your trading day with market overview, pre-market movers, and economic calendar review.'
  },
  {
    id: 'news-review',
    name: 'News\nReview',
    icon: '📰',
    color: '#7E57C2',
    description: 'Real-time market news aggregation with AI-powered sentiment analysis and breaking news alerts.'
  },
  {
    id: 'recommendations',
    name: 'AI Recs',
    icon: '🤖',
    color: '#0097A7',
    description: 'AI-generated trade recommendations based on technical indicators, patterns, and market conditions.'
  },
  {
    id: 'active-positions',
    name: 'Positions',
    icon: '📊',
    color: '#00C851',
    description: 'Monitor all active positions with real-time P&L, risk metrics, and position management tools.'
  },
  {
    id: 'pnl-dashboard',
    name: 'P&L\nDashboard',
    icon: '💰',
    color: '#FF8800',
    description: 'Comprehensive profit and loss analysis with daily, weekly, and monthly performance metrics.'
  },
  {
    id: 'strategy-builder',
    name: 'Strategy\nBuilder',
    icon: '🎯',
    color: '#5E35B1',
    description: 'Design, test, and refine custom trading strategies with drag-and-drop rule builder.'
  },
  {
    id: 'backtesting',
    name: 'Backtesting',
    icon: '📈',
    color: '#00BCD4',
    description: 'Test strategies against historical data to validate performance before live deployment.'
  },
  {
    id: 'execute',
    name: 'Execute',
    icon: '⚡',
    color: '#FF4444',
    description: 'Execute trades with advanced order types, smart routing, and risk management controls.'
  },
  {
    id: 'research',
    name: 'Research',
    icon: '🔬',
    color: '#F97316',
    description: 'Stock analysis with charts, indicators, options chain, and AI strategy recommendations.'
  },
  {
    id: 'settings',
    name: 'Settings',
    icon: '⚙️',
    color: '#64748b',
    description: 'Configure trading mode, notifications, and risk preferences.'
  }
];

export default function RadialMenu({ onWorkflowSelect, onWorkflowHover }: RadialMenuProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 600;
    const height = 600;
    const outerRadius = 220;
    const innerRadius = 90;
    const centerX = width / 2;
    const centerY = height / 2;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .attr('role', 'navigation')
      .attr('aria-label', 'Trading workflow navigation');

    const pie = d3.pie<Workflow>()
      .value(1)
      .sort(null)
      .startAngle(-Math.PI / 2)
      .padAngle(0.02);

    const arc = d3.arc<d3.PieArcDatum<Workflow>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);

    const arcHover = d3.arc<d3.PieArcDatum<Workflow>>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius + 15);

    const labelArc = d3.arc<d3.PieArcDatum<Workflow>>()
      .innerRadius((innerRadius + outerRadius) / 2)
      .outerRadius((innerRadius + outerRadius) / 2);

    const g = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`);

    // Create segments
    const segments = g.selectAll('.segment')
      .data(pie(workflows))
      .enter()
      .append('g')
      .attr('class', 'segment-group');

    segments.append('path')
      .attr('class', 'segment')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .style('transition', 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arcHover)
          .style('filter', 'brightness(1.2)');

        if (onWorkflowHover) {
          onWorkflowHover(d.data);
        }
      })
      .on('mouseleave', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('d', arc)
          .style('filter', 'brightness(1)');
      })
      .on('click', function(event, d) {
        console.log('RadialMenu: Workflow clicked:', d.data.id);
        onWorkflowSelect(d.data.id);
      });

    // Add icons
    segments.append('text')
      .attr('class', 'segment-icon')
      .attr('transform', d => {
        const pos = labelArc.centroid(d);
        return `translate(${pos[0]}, ${pos[1] - 15})`;
      })
      .attr('text-anchor', 'middle')
      .attr('font-size', '28px')
      .attr('fill', 'white')
      .style('pointer-events', 'none')
      .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.3)')
      .text(d => d.data.icon);

    // Add labels (split by \n)
    segments.each(function(d) {
      const lines = d.data.name.split('\n');
      const pos = labelArc.centroid(d);

      lines.forEach((line, i) => {
        d3.select(this)
          .append('text')
          .attr('class', 'segment-label')
          .attr('transform', `translate(${pos[0]}, ${pos[1] + 15 + i * 16})`)
          .attr('text-anchor', 'middle')
          .attr('font-size', '13px')
          .attr('font-weight', 600)
          .attr('fill', 'white')
          .style('pointer-events', 'none')
          .style('user-select', 'none')
          .style('text-shadow', '0 2px 4px rgba(0, 0, 0, 0.3)')
          .text(line);
      });
    });

    // Center circle
    g.append('circle')
      .attr('class', 'center-circle')
      .attr('r', innerRadius - 5)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('fill', '#1e293b')
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 3)
      .style('filter', 'drop-shadow(0 0 20px rgba(0, 172, 193, 0.3))');

    g.append('text')
      .attr('class', 'center-text')
      .attr('dy', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '18px')
      .attr('font-weight', 600)
      .attr('fill', '#e2e8f0')
      .style('pointer-events', 'none')
      .text('AI Trading');

    g.append('text')
      .attr('class', 'center-text')
      .attr('dy', 18)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#94a3b8')
      .style('pointer-events', 'none')
      .text('Platform');

  }, [onWorkflowSelect, onWorkflowHover]);

  return (
    <div style={{
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      filter: 'drop-shadow(0 10px 30px rgba(0, 0, 0, 0.5))'
    }}>
      <svg ref={svgRef} style={{ width: '100%', height: 'auto' }} />
    </div>
  );
}

export { workflows };
export type { Workflow };
