import { ChartPoint } from './chart-point';

export interface ServiceCharts {
  averageTransactionDuration: ChartPoint[];
  currentHourlyAverage: ChartPoint[];
}
