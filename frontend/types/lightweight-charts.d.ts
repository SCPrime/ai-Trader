import 'lightweight-charts';

declare module 'lightweight-charts' {
  interface IChartApi {
    addCandlestickSeries(options?: any): any;
    addLineSeries(options?: any): any;
    addAreaSeries(options?: any): any;
    addHistogramSeries(options?: any): any;
  }
}
