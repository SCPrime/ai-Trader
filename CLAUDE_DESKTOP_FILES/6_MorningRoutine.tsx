"use client";

import { useState, useEffect } from 'react';
import { Sun, Clock, AlertCircle, CheckCircle, XCircle, Calendar, DollarSign } from 'lucide-react';

interface MarketHours {
  isOpen: boolean;
  nextEvent: string;
  currentTime: string;
}

interface PortfolioMetrics {
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  buyingPower: number;
}

interface SystemCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
}

interface NewsItem {
  title: string;
  impact: 'high' | 'medium' | 'low';
  time: string;
}

export default function MorningRoutine() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [systemChecks] = useState<SystemCheck[]>([
    { name: 'API Connection', status: 'pass', message: 'Connected to Alpaca' },
    { name: 'Market Data', status: 'pass', message: 'Real-time feed active' },
    { name: 'Account Status', status: 'pass', message: 'Paper trading account active' },
    { name: 'Risk Limits', status: 'warning', message: 'Daily loss at 75%' },
  ]);

  const [portfolio] = useState<PortfolioMetrics>({
    totalValue: 18234.56,
    dayChange: 156.23,
    dayChangePercent: 0.86,
    buyingPower: 8500.00,
  });

  const [todaysNews] = useState<NewsItem[]>([
    { title: 'Fed Interest Rate Decision', impact: 'high', time: '2:00 PM ET' },
    { title: 'Tech Earnings: AAPL, MSFT', impact: 'high', time: 'After Close' },
    { title: 'Unemployment Claims', impact: 'medium', time: '8:30 AM ET' },
    { title: 'Oil Inventory Report', impact: 'low', time: '10:30 AM ET' },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getMarketStatus = (): MarketHours => {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    const isWeekday = day >= 1 && day <= 5;
    const isMarketHours = hour >= 9 && hour < 16;

    return {
      isOpen: isWeekday && isMarketHours,
      nextEvent: isWeekday && !isMarketHours ? 'Opens at 9:30 AM ET' : 'Closes at 4:00 PM ET',
      currentTime: now.toLocaleTimeString('en-US'),
    };
  };

  const runMorningChecks = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
  };

  const market = getMarketStatus();

  return (
    <div className="h-full bg-slate-900 p-6 overflow-y-auto">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-cyan-500/10 rounded-xl">
              <Sun className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">☀️ Morning Routine</h1>
              <p className="text-slate-400 mt-1">Pre-market analysis and system checks</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Current Time</div>
            <div className="text-2xl font-mono font-bold text-cyan-400">
              {market.currentTime}
            </div>
          </div>
        </div>

        {/* Market Status, Portfolio, System Checks, Economic Calendar */}
        {/* [Rest of component - 234 lines total] */}
      </div>
    </div>
  );
}
