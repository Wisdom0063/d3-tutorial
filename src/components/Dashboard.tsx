import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart } from "./LineChart";
import { HeatMap } from "./HeatMap";
import { Controls } from "./Controls";
import { ThroughputChart } from "./ThroughputChart";
import { LatencyChart } from "./LatencyChart";
import { ErrorRateChart } from "./ErrorRateChart";
import {
  MetricsGenerator,
  generateNodeMetrics,
  updateNodeMetrics,
} from "../utils/dataGenerator";
import { TIME_RANGES } from "../types/metrics";
import type { MetricDataPoint, NodeMetric, TimeRange } from "../types/metrics";
import { useThrottle } from "../hooks/useThrottle";

const UPDATE_INTERVAL = 2000;
const NODE_UPDATE_INTERVAL = 3000;

export function Dashboard() {
  const [selectedRange, setSelectedRange] = useState<TimeRange>(TIME_RANGES[0]);
  const [isLive, setIsLive] = useState(true);
  const [metricsData, setMetricsData] = useState<MetricDataPoint[]>([]);
  const [nodeMetrics, setNodeMetrics] = useState<NodeMetric[]>([]);

  const generatorRef = useRef<MetricsGenerator>(new MetricsGenerator());
  const metricsIntervalRef = useRef<number | undefined>(undefined);
  const nodesIntervalRef = useRef<number | undefined>(undefined);

  const throttledMetricsUpdate = useThrottle((newData: MetricDataPoint[]) => {
    setMetricsData(newData);
  }, 100);

  const throttledNodesUpdate = useThrottle((newNodes: NodeMetric[]) => {
    setNodeMetrics(newNodes);
  }, 150);

  const initializeData = useCallback(() => {
    const generator = generatorRef.current;
    const historical = generator.generateHistoricalData(
      selectedRange.minutes,
      UPDATE_INTERVAL,
    );
    setMetricsData(historical);
    setNodeMetrics(generateNodeMetrics());
  }, [selectedRange.minutes]);

  useEffect(() => {
    initializeData();
  }, [initializeData]);

  useEffect(() => {
    if (!isLive) {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (nodesIntervalRef.current) clearInterval(nodesIntervalRef.current);
      return;
    }

    metricsIntervalRef.current = window.setInterval(() => {
      const generator = generatorRef.current;
      const newPoint = generator.generateDataPoint(Date.now());

      setMetricsData((prev) => {
        const maxPoints = Math.floor(
          (selectedRange.minutes * 60 * 1000) / UPDATE_INTERVAL,
        );
        const updated = [...prev, newPoint];
        const trimmed = updated.slice(-maxPoints);
        throttledMetricsUpdate(trimmed);
        return trimmed;
      });
    }, UPDATE_INTERVAL);

    nodesIntervalRef.current = window.setInterval(() => {
      setNodeMetrics((prev) => {
        const updated = updateNodeMetrics(prev);
        throttledNodesUpdate(updated);
        return updated;
      });
    }, NODE_UPDATE_INTERVAL);

    return () => {
      if (metricsIntervalRef.current) clearInterval(metricsIntervalRef.current);
      if (nodesIntervalRef.current) clearInterval(nodesIntervalRef.current);
    };
  }, [
    isLive,
    selectedRange.minutes,
    throttledMetricsUpdate,
    throttledNodesUpdate,
  ]);

  const handleRangeChange = useCallback((range: TimeRange) => {
    setSelectedRange(range);
    const generator = generatorRef.current;
    const historical = generator.generateHistoricalData(
      range.minutes,
      UPDATE_INTERVAL,
    );
    setMetricsData(historical);
  }, []);

  const handleToggleLive = useCallback(() => {
    setIsLive((prev) => !prev);
  }, []);

  const memoizedLineChart = useMemo(
    () => <LineChart data={metricsData} width={1200} height={300} />,
    [metricsData],
  );

  const memoizedThroughputChart = useMemo(
    () => <ThroughputChart data={metricsData} width={580} height={250} />,
    [metricsData],
  );

  const memoizedLatencyChart = useMemo(
    () => <LatencyChart data={metricsData} width={580} height={250} />,
    [metricsData],
  );

  const memoizedErrorRateChart = useMemo(
    () => <ErrorRateChart data={metricsData} width={580} height={250} />,
    [metricsData],
  );

  const memoizedHeatMap = useMemo(
    () => <HeatMap data={nodeMetrics} width={1200} height={400} />,
    [nodeMetrics],
  );

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Infrastructure Metrics
          </h1>
          <p className="text-sm text-gray-400 font-mono">
            Real-time cluster performance monitoring
          </p>
        </header>

        <Controls
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
          timeRanges={TIME_RANGES}
          isLive={isLive}
          onToggleLive={handleToggleLive}
        />

        <div className="space-y-6">
          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">
                Resource Usage
              </h2>
              <div className="flex gap-4 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500" />
                  <span className="text-gray-400">CPU</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-purple-500" />
                  <span className="text-gray-400">Memory</span>
                </div>
              </div>
            </div>
            {memoizedLineChart}
          </section>

          <div className="grid grid-cols-2 gap-6">
            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  Request Throughput
                </h2>
                <span className="text-xs text-gray-400 font-mono">RPS</span>
              </div>
              {memoizedThroughputChart}
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  Latency Percentiles
                </h2>
                <div className="flex gap-3 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-blue-500" />
                    <span className="text-gray-400">P50</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-amber-500" />
                    <span className="text-gray-400">P95</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-0.5 bg-red-500" />
                    <span className="text-gray-400">P99</span>
                  </div>
                </div>
              </div>
              {memoizedLatencyChart}
            </section>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  Error Rate
                </h2>
                <span className="text-xs text-amber-400 font-mono">
                  Threshold: 1.0%
                </span>
              </div>
              {memoizedErrorRateChart}
            </section>

            <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-200">
                  Cluster Overview
                </h2>
                <div className="flex gap-2 text-xs font-mono">
                  <span className="text-green-400">
                    {nodeMetrics.filter((n) => n.status === "healthy").length}{" "}
                    healthy
                  </span>
                  <span className="text-amber-400">
                    {nodeMetrics.filter((n) => n.status === "degraded").length}{" "}
                    degraded
                  </span>
                  <span className="text-red-400">
                    {nodeMetrics.filter((n) => n.status === "down").length} down
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-400 font-mono mb-3">
                {nodeMetrics.length} total nodes across 4 regions
              </div>
            </section>
          </div>

          <section className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-200">
                Node Health Status
              </h2>
              <span className="text-xs text-gray-400 font-mono">
                Live monitoring
              </span>
            </div>
            {memoizedHeatMap}
          </section>
        </div>
      </div>
    </div>
  );
}
