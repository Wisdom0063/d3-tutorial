import { memo } from "react";
import {
  Activity,
  BarChart3,
  Zap,
  AlertTriangle,
  Server,
  Clock,
} from "lucide-react";
import type { MetricDataPoint, NodeMetric } from "../types/metrics";

interface SidebarProps {
  metricsData: MetricDataPoint[];
  nodeMetrics: NodeMetric[];
  isLive: boolean;
}

export const Sidebar = memo(
  ({ metricsData, nodeMetrics, isLive }: SidebarProps) => {
    const latestMetric = metricsData[metricsData.length - 1];
    const healthyNodes = nodeMetrics.filter(
      (n) => n.status === "healthy",
    ).length;
    const degradedNodes = nodeMetrics.filter(
      (n) => n.status === "degraded",
    ).length;
    const downNodes = nodeMetrics.filter((n) => n.status === "down").length;

    const navItems = [
      { icon: Activity, label: "Overview", active: true },
      { icon: BarChart3, label: "Metrics", active: false },
      { icon: Server, label: "Nodes", active: false },
      { icon: AlertTriangle, label: "Alerts", active: false },
      { icon: Clock, label: "History", active: false },
    ];

    return (
      <aside className="w-72 h-screen bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col overflow-hidden">
        {/* Logo & Status */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">InfraWatch</h1>
              <p className="text-xs text-gray-400">v2.0.1</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700">
            <div
              className={`w-2 h-2 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
            />
            <span className="text-sm font-medium text-gray-300">
              {isLive ? "Live Monitoring" : "Paused"}
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                item.active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Quick Stats */}
        {latestMetric && (
          <div className="p-4 border-t border-gray-800 space-y-4 overflow-y-auto">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Live Metrics
            </h3>

            <div className="space-y-3">
              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">CPU Usage</span>
                  <span className="text-sm font-bold text-blue-400">
                    {latestMetric.cpu.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-500"
                    style={{ width: `${latestMetric.cpu}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Memory</span>
                  <span className="text-sm font-bold text-purple-400">
                    {latestMetric.memory.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 transition-all duration-500"
                    style={{ width: `${latestMetric.memory}%` }}
                  />
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Throughput</span>
                  <span className="text-sm font-bold text-emerald-400">
                    {latestMetric.rps} RPS
                  </span>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Error Rate</span>
                  <span
                    className={`text-sm font-bold ${latestMetric.errorRate > 1 ? "text-red-400" : "text-yellow-400"}`}
                  >
                    {latestMetric.errorRate.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Cluster Health */}
            <div className="pt-3 border-t border-gray-700">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Cluster Health
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Healthy</span>
                  <span className="font-bold text-green-400">
                    {healthyNodes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Degraded</span>
                  <span className="font-bold text-amber-400">
                    {degradedNodes}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Down</span>
                  <span className="font-bold text-red-400">{downNodes}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    );
  },
);

Sidebar.displayName = "Sidebar";
