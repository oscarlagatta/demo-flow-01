export interface ServiceStatus {
  id: string;
  service: string;
  statuses: Record<string, '✅' | '❌'>;
  currentHourlyAverage: string;
  averagePerDay: string;
}
