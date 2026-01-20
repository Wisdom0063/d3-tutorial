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
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400 font-mono">Time Range:</span>
          <div className="flex gap-1">
            {timeRanges.map((range) => (
              <button
                key={range.label}
                onClick={() => onRangeChange(range)}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                  selectedRange.label === range.label
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={onToggleLive}
            className={`px-4 py-1.5 text-xs font-mono rounded transition-colors flex items-center gap-2 ${
              isLive
                ? "bg-green-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${isLive ? "bg-white animate-pulse" : "bg-gray-600"}`}
            />
            {isLive ? "Live" : "Paused"}
          </button>
        </div>
      </div>
    );
  },
);

Controls.displayName = "Controls";
