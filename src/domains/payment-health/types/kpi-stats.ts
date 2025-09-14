export interface KPIStats {
  recentIssues: { value: number; change: string };
  pendingIssues: { value: number; change: string };
  runningServices: { value: number; change: string };
  interruptions: { value: number; change: string };
}
