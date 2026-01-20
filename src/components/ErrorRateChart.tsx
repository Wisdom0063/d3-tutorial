import { useEffect, useRef, useMemo, memo } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { MetricDataPoint } from "../types/metrics";
import { formatPercent, ERROR_THRESHOLD } from "../utils/scales";

interface ErrorRateChartProps {
  data: MetricDataPoint[];
  width?: number;
  height?: number;
}

const MARGIN = { top: 20, right: 60, bottom: 30, left: 60 };

export const ErrorRateChart = memo(
  ({ data, width = 600, height = 250 }: ErrorRateChartProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const pathRef = useRef<SVGPathElement | null>(null);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const scales = useMemo(() => {
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.timestamp) as [number, number])
        .range([0, innerWidth]);

      const maxError = Math.max(
        d3.max(data, (d) => d.errorRate) || 5,
        ERROR_THRESHOLD * 1.5,
      );
      const yScale = d3
        .scaleLinear()
        .domain([0, maxError])
        .range([innerHeight, 0]);

      return { xScale, yScale };
    }, [data, innerWidth, innerHeight]);

    useEffect(() => {
      if (!svgRef.current || data.length === 0) return;

      const svg = d3.select(svgRef.current);
      const g = svg.select<SVGGElement>("g.chart-group");

      const { xScale, yScale } = scales;

      const xAxis = d3
        .axisBottom(xScale)
        .ticks(5)
        .tickFormat((d) => d3.timeFormat("%H:%M:%S")(d as Date));
      const yAxis = d3
        .axisLeft(yScale)
        .ticks(5)
        .tickFormat((d) => `${d}%`);

      g.select<SVGGElement>(".x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis);

      g.select<SVGGElement>(".y-axis").call(yAxis);

      const line = d3
        .line<MetricDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.errorRate))
        .curve(d3.curveMonotoneX);

      const area = d3
        .area<MetricDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y0(innerHeight)
        .y1((d) => yScale(d.errorRate))
        .curve(d3.curveMonotoneX);

      const path = g.select<SVGPathElement>(".line-error");
      const areaPath = g.select<SVGPathElement>(".area-error");

      if (pathRef.current) {
        path.datum(data).attr("d", line);
        areaPath.datum(data).attr("d", area);
      } else {
        pathRef.current = path.node();
        path.datum(data).attr("d", line);
        areaPath.datum(data).attr("d", area);

        if (pathRef.current) {
          gsap.fromTo(
            pathRef.current,
            { strokeDashoffset: 1000, strokeDasharray: 1000 },
            { strokeDashoffset: 0, duration: 1, ease: "power2.out" },
          );
        }
      }

      const thresholdY = yScale(ERROR_THRESHOLD);
      g.select(".threshold-line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", thresholdY)
        .attr("y2", thresholdY);

      const bisect = d3.bisector<MetricDataPoint, number>(
        (d) => d.timestamp,
      ).left;

      const handleMouseMove = (event: MouseEvent) => {
        const [xPos] = d3.pointer(event);
        const x0 = xScale.invert(xPos);
        const index = bisect(data, x0.getTime(), 1);
        const d0 = data[index - 1];
        const d1 = data[index];

        if (!d0 || !d1) return;

        const d =
          x0.getTime() - d0.timestamp > d1.timestamp - x0.getTime() ? d1 : d0;

        if (tooltipRef.current) {
          const isAboveThreshold = d.errorRate > ERROR_THRESHOLD;
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${xScale(d.timestamp) + MARGIN.left}px`;
          tooltipRef.current.style.top = `${MARGIN.top - 10}px`;
          tooltipRef.current.innerHTML = `
          <div class="text-xs font-mono">
            <div class="text-gray-400">${new Date(d.timestamp).toLocaleTimeString()}</div>
            <div class="${isAboveThreshold ? "text-red-400" : "text-yellow-400"} font-semibold">
              ${formatPercent(d.errorRate)}
            </div>
            ${isAboveThreshold ? '<div class="text-red-500 text-[10px] mt-1">⚠ Above threshold</div>' : ""}
          </div>
        `;
        }
      };

      const handleMouseLeave = () => {
        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      };

      const overlay = g.select<SVGRectElement>(".overlay");
      overlay
        .on("mousemove", handleMouseMove)
        .on("mouseleave", handleMouseLeave);

      return () => {
        overlay.on("mousemove", null).on("mouseleave", null);
      };
    }, [data, scales, innerWidth, innerHeight]);

    return (
      <div className="relative">
        <svg
          ref={svgRef}
          width={width}
          height={height}
          className="overflow-visible"
        >
          <defs>
            <linearGradient
              id="error-gradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g
            className="chart-group"
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
          >
            <g className="x-axis text-gray-400 text-xs" />
            <g className="y-axis text-gray-400 text-xs" />
            <line
              className="threshold-line"
              stroke="#f59e0b"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.5"
            />
            <path className="area-error" fill="url(#error-gradient)" />
            <path
              className="line-error"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
            />
            <rect
              className="overlay"
              width={innerWidth}
              height={innerHeight}
              fill="transparent"
              style={{ cursor: "crosshair" }}
            />
          </g>
        </svg>
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-gray-900/95 border border-gray-700 rounded px-3 py-2 shadow-lg"
          style={{ display: "none" }}
        />
      </div>
    );
  },
);

ErrorRateChart.displayName = "ErrorRateChart";
