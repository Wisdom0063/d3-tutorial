import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart } from "./LineChart";
import { HeatMap } from "./HeatMap";
import { Controls } from "./Controls";
import { ThroughputChart } from "./ThroughputChart";
import { LatencyChart } from "./LatencyChart";
import { ErrorRateChart } from "./ErrorRateChart";
import { Sidebar } from "./Sidebar";
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
    <div className="h-screen bg-gray-950 text-gray-100 flex overflow-hidden">
      <Sidebar
        metricsData={metricsData}
        nodeMetrics={nodeMetrics}
        isLive={isLive}
      />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1600px] mx-auto p-8">
          <header className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Infrastructure Metrics
                </h1>
                <p className="text-sm text-gray-400 font-mono">
                  Real-time cluster performance monitoring
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <span className="text-xs text-gray-400">Last updated</span>
                  <p className="text-sm font-mono text-gray-200">
                    {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </div>
          </header>

          <Controls
            selectedRange={selectedRange}
            onRangeChange={handleRangeChange}
            timeRanges={TIME_RANGES}
            isLive={isLive}
            onToggleLive={handleToggleLive}
          />

          <div className="space-y-6">
            <section className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Resource Usage
                  </h2>
                  <p className="text-xs text-gray-400">
                    System-wide CPU and memory utilization
                  </p>
                </div>
                <div className="flex gap-4 text-xs font-mono bg-gray-800/50 px-4 py-2 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500 shadow-sm shadow-blue-500" />
                    <span className="text-gray-300">CPU</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-purple-500 shadow-sm shadow-purple-500" />
                    <span className="text-gray-300">Memory</span>
                  </div>
                </div>
              </div>
              {memoizedLineChart}
            </section>

            <div className="grid grid-cols-2 gap-6">
              <section className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-xl hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Request Throughput
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      Requests per second
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <span className="text-xs text-emerald-400 font-mono font-semibold">
                      RPS
                    </span>
                  </div>
                </div>
                {memoizedThroughputChart}
              </section>

              <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 border border-gray-700/50 shadow-xl shadow-amber-900/10 hover:shadow-amber-900/20 transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Latency Percentiles
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      Response time distribution
                    </span>
                  </div>
                  <div className="flex gap-2 text-xs font-mono bg-gray-800/50 px-3 py-1.5 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-gray-300">P50</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-gray-300">P95</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-gray-300">P99</span>
                    </div>
                  </div>
                </div>
                {memoizedLatencyChart}
              </section>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <section className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-xl hover:shadow-xl transition-shadow">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Error Rate
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      Failed request percentage
                    </span>
                  </div>
                  <div className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                    <span className="text-xs text-amber-400 font-mono font-semibold">
                      Threshold: 1.0%
                    </span>
                  </div>
                </div>
                {memoizedErrorRateChart}
              </section>

              <section className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-xl">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold text-white mb-1">
                      Cluster Overview
                    </h2>
                    <span className="text-xs text-gray-400 font-mono">
                      {nodeMetrics.length} nodes across 4 regions
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-green-400 mb-1">
                      {nodeMetrics.filter((n) => n.status === "healthy").length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Healthy
                    </div>
                  </div>
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-amber-400 mb-1">
                      {
                        nodeMetrics.filter((n) => n.status === "degraded")
                          .length
                      }
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Degraded
                    </div>
                  </div>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <div className="text-3xl font-bold text-red-400 mb-1">
                      {nodeMetrics.filter((n) => n.status === "down").length}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      Down
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Cluster Health</span>
                    <span className="font-semibold text-green-400">
                      {Math.round(
                        (nodeMetrics.filter((n) => n.status === "healthy")
                          .length /
                          nodeMetrics.length) *
                          100,
                      )}
                      % Operational
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <section className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    Node Health Status
                  </h2>
                  <p className="text-xs text-gray-400">
                    Real-time infrastructure health monitoring
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-gray-300 font-mono">
                    Live monitoring
                  </span>
                </div>
              </div>
              {memoizedHeatMap}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
