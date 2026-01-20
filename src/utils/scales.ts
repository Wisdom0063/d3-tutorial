import * as d3 from "d3";
import type { NodeHealthStatus } from "../types/metrics";

export const HEALTH_COLORS: Record<NodeHealthStatus, string> = {
  healthy: "#10b981",
  degraded: "#f59e0b",
  down: "#ef4444",
};

export function getHealthStatus(health: number): NodeHealthStatus {
  if (health >= 80) return "healthy";
  if (health >= 40) return "degraded";
  return "down";
}

export function formatLatency(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatRPS(rps: number): string {
  if (rps >= 1000) return `${(rps / 1000).toFixed(1)}k`;
  return rps.toFixed(0);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

export const ERROR_THRESHOLD = 1.0;

export function createTimeScale(
  domain: [number, number],
  range: [number, number],
) {
  return d3.scaleTime().domain(domain).range(range);
}

export function createLinearScale(
  domain: [number, number],
  range: [number, number],
) {
  return d3.scaleLinear().domain(domain).range(range);
}
