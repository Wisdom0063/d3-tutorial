import { memo } from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import type { TimeRange } from "../types/metrics";

interface ControlsProps {
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  timeRanges: TimeRange[];
  isLive: boolean;
  onToggleLive: () => void;
}

export const Controls = memo(
  ({
    selectedRange,
    onRangeChange,
    timeRanges,
    isLive,
    onToggleLive,
  }: ControlsProps) => {
    const { theme, toggleTheme } = useTheme();

    return (
      <div className="flex items-center gap-6 mb-8 bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border border-gray-300 dark:border-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 dark:text-gray-400 font-semibold">
            Time Range
          </span>
          <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800/50 p-1 rounded-lg border border-gray-300 dark:border-gray-700">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => onRangeChange(range)}
                className={`px-4 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                  selectedRange.label === range.label
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 transition-all duration-200"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="w-5 h-5 text-yellow-400" />
            ) : (
              <Moon className="w-5 h-5 text-blue-600" />
            )}
          </button>

          <button
            onClick={onToggleLive}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2.5 border ${
              isLive
                ? "bg-green-600 text-white shadow-lg border-green-500/50"
                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700"
            }`}
          >
            <span
              className={`w-2.5 h-2.5 rounded-full ${isLive ? "bg-white animate-pulse shadow-sm shadow-white" : "bg-gray-500"}`}
            />
            {isLive ? "Live Monitoring" : "Paused"}
          </button>
        </div>
      </div>
    );
  },
);

Controls.displayName = "Controls";
