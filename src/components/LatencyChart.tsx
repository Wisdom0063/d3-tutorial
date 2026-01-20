import { useEffect, useRef, useMemo, memo } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { MetricDataPoint } from "../types/metrics";
import { formatLatency } from "../utils/scales";

interface LatencyChartProps {
  data: MetricDataPoint[];
  width?: number;
  height?: number;
}

const MARGIN = { top: 20, right: 80, bottom: 30, left: 60 };

const PERCENTILES = [
  { key: "p50" as const, label: "P50", color: "#3b82f6" },
  { key: "p95" as const, label: "P95", color: "#f59e0b" },
  { key: "p99" as const, label: "P99", color: "#ef4444" },
];

export const LatencyChart = memo(
  ({ data, width = 600, height = 250 }: LatencyChartProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const pathsInitialized = useRef(false);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const scales = useMemo(() => {
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.timestamp) as [number, number])
        .range([0, innerWidth]);

      const maxLatency =
        d3.max(data, (d) => Math.max(d.p50, d.p95, d.p99)) || 200;
      const yScale = d3
        .scaleLinear()
        .domain([0, maxLatency * 1.1])
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
      const yAxis = d3.axisLeft(yScale).ticks(5);

      g.select<SVGGElement>(".x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis);

      g.select<SVGGElement>(".y-axis").call(yAxis);

      PERCENTILES.forEach(({ key }) => {
        const line = d3
          .line<MetricDataPoint>()
          .x((d) => xScale(d.timestamp))
          .y((d) => yScale(d[key]))
          .curve(d3.curveMonotoneX);

        const path = g.select<SVGPathElement>(`.line-${key}`);
        path.datum(data).attr("d", line);

        if (!pathsInitialized.current) {
          const pathNode = path.node();
          if (pathNode) {
            gsap.fromTo(
              pathNode,
              { strokeDashoffset: 1000, strokeDasharray: 1000 },
              { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" },
            );
          }
        }
      });

      pathsInitialized.current = true;

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
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${xScale(d.timestamp) + MARGIN.left}px`;
          tooltipRef.current.style.top = `${MARGIN.top - 10}px`;
          tooltipRef.current.innerHTML = `
          <div class="text-xs font-mono">
            <div class="text-gray-400">${new Date(d.timestamp).toLocaleTimeString()}</div>
            <div class="text-blue-400">P50: ${formatLatency(d.p50)}</div>
            <div class="text-amber-400">P95: ${formatLatency(d.p95)}</div>
            <div class="text-red-400">P99: ${formatLatency(d.p99)}</div>
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
          <g
            className="chart-group"
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
          >
            <g className="x-axis text-gray-400 text-xs" />
            <g className="y-axis text-gray-400 text-xs" />
            {PERCENTILES.map(({ key, color }) => (
              <path
                key={key}
                className={`line-${key}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
              />
            ))}
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

LatencyChart.displayName = "LatencyChart";
