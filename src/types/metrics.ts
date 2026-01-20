export interface MetricDataPoint {
  timestamp: number;
  cpu: number;
  memory: number;
  rps: number;
  p50: number;
  p95: number;
  p99: number;
  errorRate: number;
}

export type NodeHealthStatus = "healthy" | "degraded" | "down";

export interface NodeMetric {
  nodeId: string;
  load: number;
  health: number;
  status: NodeHealthStatus;
  region: string;
}

export interface TimeRange {
  label: string;
  minutes: number;
}

export const TIME_RANGES: TimeRange[] = [
  { label: "5m", minutes: 5 },
  { label: "15m", minutes: 15 },
  { label: "30m", minutes: 30 },
  { label: "1h", minutes: 60 },
];
