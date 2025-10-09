/**
 * Alpaca Trading API Service
 *
 * Provides a client-side interface to interact with Alpaca's paper/live trading API
 * through the backend proxy. All requests go through /api/proxy to secure API keys.
 */

const API_BASE = '/api/proxy';

// Types
export interface AlpacaAccount {
  id: string;
  account_number: string;
  status: string;
  currency: string;
  buying_power: string;
  cash: string;
  portfolio_value: string;
  pattern_day_trader: boolean;
  trading_blocked: boolean;
  transfers_blocked: boolean;
  account_blocked: boolean;
  created_at: string;
  trade_suspended_by_user: boolean;
  multiplier: string;
  shorting_enabled: boolean;
  equity: string;
  last_equity: string;
  long_market_value: string;
  short_market_value: string;
  initial_margin: string;
  maintenance_margin: string;
  last_maintenance_margin: string;
  sma: string;
  daytrade_count: number;
}

export interface AlpacaPosition {
  asset_id: string;
  symbol: string;
  exchange: string;
  asset_class: string;
  avg_entry_price: string;
  qty: string;
  side: 'long' | 'short';
  market_value: string;
  cost_basis: string;
  unrealized_pl: string;
  unrealized_plpc: string;
  unrealized_intraday_pl: string;
  unrealized_intraday_plpc: string;
  current_price: string;
  lastday_price: string;
  change_today: string;
}

export interface AlpacaOrder {
  id: string;
  client_order_id: string;
  created_at: string;
  updated_at: string;
  submitted_at: string;
  filled_at?: string;
  expired_at?: string;
  canceled_at?: string;
  failed_at?: string;
  replaced_at?: string;
  replaced_by?: string;
  replaces?: string;
  asset_id: string;
  symbol: string;
  asset_class: string;
  notional?: string;
  qty?: string;
  filled_qty: string;
  filled_avg_price?: string;
  order_class: string;
  order_type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  side: 'buy' | 'sell';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: string;
  stop_price?: string;
  status: 'new' | 'partially_filled' | 'filled' | 'done_for_day' | 'canceled' | 'expired' | 'replaced' | 'pending_cancel' | 'pending_replace' | 'accepted' | 'pending_new' | 'accepted_for_bidding' | 'stopped' | 'rejected' | 'suspended' | 'calculated';
  extended_hours: boolean;
  legs?: AlpacaOrder[];
  trail_percent?: string;
  trail_price?: string;
  hwm?: string;
}

export interface CreateOrderRequest {
  symbol: string;
  qty?: number;
  notional?: number;
  side: 'buy' | 'sell';
  type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
  time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
  limit_price?: number;
  stop_price?: number;
  trail_price?: number;
  trail_percent?: number;
  extended_hours?: boolean;
  client_order_id?: string;
  order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
  take_profit?: {
    limit_price: number;
  };
  stop_loss?: {
    stop_price: number;
    limit_price?: number;
  };
}

export interface AlpacaAsset {
  id: string;
  class: string;
  exchange: string;
  symbol: string;
  name: string;
  status: string;
  tradable: boolean;
  marginable: boolean;
  shortable: boolean;
  easy_to_borrow: boolean;
  fractionable: boolean;
}

export interface AlpacaBar {
  t: string; // timestamp
  o: number; // open
  h: number; // high
  l: number; // low
  c: number; // close
  v: number; // volume
  n: number; // number of trades
  vw: number; // volume weighted average price
}

export interface AlpacaClock {
  timestamp: string;
  is_open: boolean;
  next_open: string;
  next_close: string;
}

export interface AlpacaCalendar {
  date: string;
  open: string;
  close: string;
}

/**
 * Alpaca API Client
 */
class AlpacaClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE;
  }

  /**
   * Make authenticated request to Alpaca API through backend proxy
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Alpaca API error: ${response.statusText}`);
    }

    return response.json();
  }

  // ==================== Account ====================

  /**
   * Get account information
   */
  async getAccount(): Promise<AlpacaAccount> {
    return this.request<AlpacaAccount>('/api/account');
  }

  // ==================== Positions ====================

  /**
   * Get all open positions
   */
  async getPositions(): Promise<AlpacaPosition[]> {
    return this.request<AlpacaPosition[]>('/api/positions');
  }

  /**
   * Get a specific position by symbol
   */
  async getPosition(symbol: string): Promise<AlpacaPosition> {
    return this.request<AlpacaPosition>(`/api/positions/${symbol}`);
  }

  /**
   * Close all positions
   */
  async closeAllPositions(cancelOrders: boolean = false): Promise<{ status: number }[]> {
    return this.request<{ status: number }[]>(`/api/positions?cancel_orders=${cancelOrders}`, {
      method: 'DELETE',
    });
  }

  /**
   * Close a specific position
   */
  async closePosition(symbol: string, qty?: number, percentage?: number): Promise<AlpacaOrder> {
    const params = new URLSearchParams();
    if (qty) params.append('qty', qty.toString());
    if (percentage) params.append('percentage', percentage.toString());

    return this.request<AlpacaOrder>(`/api/positions/${symbol}?${params}`, {
      method: 'DELETE',
    });
  }

  // ==================== Orders ====================

  /**
   * Get all orders
   */
  async getOrders(params?: {
    status?: 'open' | 'closed' | 'all';
    limit?: number;
    after?: string;
    until?: string;
    direction?: 'asc' | 'desc';
    nested?: boolean;
    symbols?: string[];
  }): Promise<AlpacaOrder[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.after) queryParams.append('after', params.after);
    if (params?.until) queryParams.append('until', params.until);
    if (params?.direction) queryParams.append('direction', params.direction);
    if (params?.nested) queryParams.append('nested', params.nested.toString());
    if (params?.symbols) queryParams.append('symbols', params.symbols.join(','));

    return this.request<AlpacaOrder[]>(`/api/orders?${queryParams}`);
  }

  /**
   * Get a specific order by ID
   */
  async getOrder(orderId: string): Promise<AlpacaOrder> {
    return this.request<AlpacaOrder>(`/api/orders/${orderId}`);
  }

  /**
   * Create a new order
   */
  async createOrder(order: CreateOrderRequest): Promise<AlpacaOrder> {
    return this.request<AlpacaOrder>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    });
  }

  /**
   * Cancel an order
   */
  async cancelOrder(orderId: string): Promise<void> {
    return this.request<void>(`/api/orders/${orderId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Cancel all orders
   */
  async cancelAllOrders(): Promise<{ id: string; status: number }[]> {
    return this.request<{ id: string; status: number }[]>('/api/orders', {
      method: 'DELETE',
    });
  }

  // ==================== Assets ====================

  /**
   * Get all assets
   */
  async getAssets(params?: {
    status?: 'active' | 'inactive';
    asset_class?: string;
  }): Promise<AlpacaAsset[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.asset_class) queryParams.append('asset_class', params.asset_class);

    return this.request<AlpacaAsset[]>(`/api/assets?${queryParams}`);
  }

  /**
   * Get a specific asset by symbol
   */
  async getAsset(symbol: string): Promise<AlpacaAsset> {
    return this.request<AlpacaAsset>(`/api/assets/${symbol}`);
  }

  // ==================== Market Data ====================

  /**
   * Get historical bars for a symbol
   */
  async getBars(
    symbol: string,
    params: {
      timeframe: '1Min' | '5Min' | '15Min' | '1Hour' | '1Day';
      start?: string;
      end?: string;
      limit?: number;
    }
  ): Promise<{ bars: AlpacaBar[] }> {
    const queryParams = new URLSearchParams();
    queryParams.append('timeframe', params.timeframe);
    if (params.start) queryParams.append('start', params.start);
    if (params.end) queryParams.append('end', params.end);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    return this.request<{ bars: AlpacaBar[] }>(`/api/bars/${symbol}?${queryParams}`);
  }

  /**
   * Get latest quote for a symbol
   */
  async getLatestQuote(symbol: string): Promise<{
    symbol: string;
    bid_price: number;
    bid_size: number;
    ask_price: number;
    ask_size: number;
    timestamp: string;
  }> {
    return this.request(`/api/quotes/${symbol}/latest`);
  }

  /**
   * Get latest trade for a symbol
   */
  async getLatestTrade(symbol: string): Promise<{
    symbol: string;
    price: number;
    size: number;
    timestamp: string;
  }> {
    return this.request(`/api/trades/${symbol}/latest`);
  }

  // ==================== Market Info ====================

  /**
   * Get market clock
   */
  async getClock(): Promise<AlpacaClock> {
    return this.request<AlpacaClock>('/api/clock');
  }

  /**
   * Get market calendar
   */
  async getCalendar(params?: {
    start?: string;
    end?: string;
  }): Promise<AlpacaCalendar[]> {
    const queryParams = new URLSearchParams();
    if (params?.start) queryParams.append('start', params.start);
    if (params?.end) queryParams.append('end', params.end);

    return this.request<AlpacaCalendar[]>(`/api/calendar?${queryParams}`);
  }

  // ==================== Watchlists ====================

  /**
   * Get all watchlists
   */
  async getWatchlists(): Promise<any[]> {
    return this.request<any[]>('/api/watchlists');
  }

  /**
   * Create a watchlist
   */
  async createWatchlist(name: string, symbols: string[]): Promise<any> {
    return this.request('/api/watchlists', {
      method: 'POST',
      body: JSON.stringify({ name, symbols }),
    });
  }

  /**
   * Delete a watchlist
   */
  async deleteWatchlist(watchlistId: string): Promise<void> {
    return this.request<void>(`/api/watchlists/${watchlistId}`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const alpaca = new AlpacaClient();

// Helper functions

/**
 * Format Alpaca position data for UI display
 */
export function formatPosition(position: AlpacaPosition) {
  return {
    symbol: position.symbol,
    qty: parseFloat(position.qty),
    avgEntryPrice: parseFloat(position.avg_entry_price),
    currentPrice: parseFloat(position.current_price),
    marketValue: parseFloat(position.market_value),
    unrealizedPL: parseFloat(position.unrealized_pl),
    unrealizedPLPercent: parseFloat(position.unrealized_plpc) * 100,
    side: position.side,
    dayChange: parseFloat(position.change_today),
    dayChangePercent: parseFloat(position.unrealized_intraday_plpc) * 100,
  };
}

/**
 * Check if market is currently open
 */
export async function isMarketOpen(): Promise<boolean> {
  try {
    const clock = await alpaca.getClock();
    return clock.is_open;
  } catch (error) {
    console.error('Failed to check market status:', error);
    return false;
  }
}

/**
 * Get next market open/close time
 */
export async function getNextMarketTimes(): Promise<{ nextOpen: Date; nextClose: Date }> {
  const clock = await alpaca.getClock();
  return {
    nextOpen: new Date(clock.next_open),
    nextClose: new Date(clock.next_close),
  };
}
