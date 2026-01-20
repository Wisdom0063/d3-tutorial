import { memo } from "react";
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
    return (
      <div className="flex items-center gap-6 mb-8 bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 font-semibold">
            Time Range
          </span>
          <div className="flex gap-1.5 bg-gray-800/50 p-1 rounded-lg border border-gray-700">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => onRangeChange(range)}
                className={`px-4 py-2 text-xs font-mono rounded-md transition-all duration-200 ${
                  selectedRange.label === range.label
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-transparent text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={onToggleLive}
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 flex items-center gap-2.5 border ${
              isLive
                ? "bg-green-600 text-white shadow-lg border-green-500/50"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
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
