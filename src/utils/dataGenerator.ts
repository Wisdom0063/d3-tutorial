import type {
  MetricDataPoint,
  NodeMetric,
  NodeHealthStatus,
} from "../types/metrics";

const REGIONS = ["us-east", "us-west", "eu-central", "ap-south"];
const NODE_COUNT = 24;

export class MetricsGenerator {
  private baselineCpu = 45;
  private baselineMemory = 60;
  private cpuTrend = 0;
  private memoryTrend = 0;
  private errorSpikeCooldown = 0;

  generateDataPoint(timestamp: number): MetricDataPoint {
    this.cpuTrend += (Math.random() - 0.5) * 2;
    this.memoryTrend += (Math.random() - 0.5) * 1.5;

    this.cpuTrend = Math.max(-15, Math.min(15, this.cpuTrend));
    this.memoryTrend = Math.max(-10, Math.min(10, this.memoryTrend));

    const cpu = Math.max(
      0,
      Math.min(
        100,
        this.baselineCpu + this.cpuTrend + (Math.random() - 0.5) * 8,
      ),
    );

    const memory = Math.max(
      0,
      Math.min(
        100,
        this.baselineMemory + this.memoryTrend + (Math.random() - 0.5) * 6,
      ),
    );

    const loadFactor = cpu / 100;
    const baseRps = 1200;
    const rps = Math.max(
      0,
      baseRps * (0.5 + loadFactor * 0.8) + (Math.random() - 0.5) * 200,
    );

    const baseLatency = 45;
    const loadPenalty = loadFactor * 80;
    const p50 = Math.max(
      5,
      baseLatency + loadPenalty + (Math.random() - 0.5) * 15,
    );
    const p95 = p50 * (2.2 + Math.random() * 0.4);
    const p99 = p95 * (1.8 + Math.random() * 0.3);

    let errorRate = 0.05 + loadFactor * 0.15 + Math.random() * 0.1;

    if (this.errorSpikeCooldown > 0) {
      this.errorSpikeCooldown--;
    }

    if (this.errorSpikeCooldown === 0 && Math.random() < 0.02) {
      errorRate = 2.0 + Math.random() * 3.0;
      this.errorSpikeCooldown = 15;
    } else if (this.errorSpikeCooldown > 0 && this.errorSpikeCooldown < 5) {
      errorRate = 0.5 + Math.random() * 1.0;
    }

    return {
      timestamp,
      cpu,
      memory,
      rps: Math.round(rps),
      p50: Math.round(p50 * 10) / 10,
      p95: Math.round(p95 * 10) / 10,
      p99: Math.round(p99 * 10) / 10,
      errorRate: Math.round(errorRate * 100) / 100,
    };
  }

  generateHistoricalData(
    minutes: number,
    intervalMs: number = 2000,
  ): MetricDataPoint[] {
    const now = Date.now();
    const points = Math.floor((minutes * 60 * 1000) / intervalMs);
    const data: MetricDataPoint[] = [];

    for (let i = 0; i < points; i++) {
      const timestamp = now - (points - i) * intervalMs;
      data.push(this.generateDataPoint(timestamp));
    }

    return data;
  }
}

function determineStatus(health: number): NodeHealthStatus {
  if (health >= 80) return "healthy";
  if (health >= 40) return "degraded";
  return "down";
}

export function generateNodeMetrics(): NodeMetric[] {
  return Array.from({ length: NODE_COUNT }, (_, i) => {
    const regionIndex = i % REGIONS.length;
    const baseLoad = 30 + Math.random() * 40;
    const health =
      Math.random() > 0.15
        ? 85 + Math.random() * 15
        : Math.random() > 0.5
          ? 50 + Math.random() * 25
          : 15 + Math.random() * 20;

    return {
      nodeId: `node-${String(i + 1).padStart(2, "0")}`,
      load: Math.round(baseLoad),
      health: Math.round(health),
      status: determineStatus(health),
      region: REGIONS[regionIndex],
    };
  });
}

export function updateNodeMetrics(current: NodeMetric[]): NodeMetric[] {
  return current.map((node) => {
    let healthDelta = (Math.random() - 0.5) * 3;

    if (node.status === "down" && Math.random() < 0.3) {
      healthDelta = Math.abs(healthDelta) * 2;
    } else if (node.status === "degraded" && Math.random() < 0.1) {
      healthDelta = -Math.abs(healthDelta) * 1.5;
    }

    const newHealth = Math.max(0, Math.min(100, node.health + healthDelta));

    return {
      ...node,
      load: Math.max(0, Math.min(100, node.load + (Math.random() - 0.5) * 8)),
      health: Math.round(newHealth),
      status: determineStatus(newHealth),
    };
  });
}
