import { useEffect, useRef, useMemo, memo } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { MetricDataPoint } from "../types/metrics";

interface LineChartProps {
  data: MetricDataPoint[];
  width?: number;
  height?: number;
}

const MARGIN = { top: 20, right: 80, bottom: 30, left: 50 };

export const LineChart = memo(
  ({ data, width = 800, height = 300 }: LineChartProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const pathsRef = useRef<{
      cpu: SVGPathElement | null;
      memory: SVGPathElement | null;
    }>({
      cpu: null,
      memory: null,
    });

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const scales = useMemo(() => {
      const xScale = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.timestamp) as [number, number])
        .range([0, innerWidth]);

      const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

      return { xScale, yScale };
    }, [data, innerWidth, innerHeight]);

    useEffect(() => {
      if (!svgRef.current || data.length === 0) return;

      const svg = d3.select(svgRef.current);
      const g = svg.select<SVGGElement>("g.chart-group");

      const { xScale, yScale } = scales;

      const xAxis = d3
        .axisBottom(xScale)
        .ticks(6)
        .tickFormat((d) => d3.timeFormat("%H:%M:%S")(d as Date));
      const yAxis = d3.axisLeft(yScale).ticks(5);

      g.select<SVGGElement>(".x-axis")
        .attr("transform", `translate(0,${innerHeight})`)
        .call(xAxis);

      g.select<SVGGElement>(".y-axis").call(yAxis);

      const cpuLine = d3
        .line<MetricDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.cpu))
        .defined((d) => d.cpu !== null && d.cpu !== undefined)
        .curve(d3.curveMonotoneX);

      const memoryLine = d3
        .line<MetricDataPoint>()
        .x((d) => xScale(d.timestamp))
        .y((d) => yScale(d.memory))
        .defined((d) => d.memory !== null && d.memory !== undefined)
        .curve(d3.curveMonotoneX);

      const cpuPath = g.select<SVGPathElement>(".line-cpu");
      const memoryPath = g.select<SVGPathElement>(".line-memory");

      if (pathsRef.current.cpu && pathsRef.current.memory) {
        cpuPath.datum(data).attr("d", cpuLine);
        memoryPath.datum(data).attr("d", memoryLine);
      } else {
        pathsRef.current.cpu = cpuPath.node();
        pathsRef.current.memory = memoryPath.node();

        cpuPath.datum(data).attr("d", cpuLine);
        memoryPath.datum(data).attr("d", memoryLine);

        if (pathsRef.current.cpu && pathsRef.current.memory) {
          gsap.fromTo(
            [pathsRef.current.cpu, pathsRef.current.memory],
            { strokeDashoffset: 1000, strokeDasharray: 1000 },
            { strokeDashoffset: 0, duration: 1.2, ease: "power2.out" },
          );
        }
      }

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
            <div class="text-blue-400">CPU: ${d.cpu.toFixed(1)}%</div>
            <div class="text-purple-400">MEM: ${d.memory.toFixed(1)}%</div>
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
            <linearGradient id="cpu-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
            <linearGradient
              id="memory-gradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
            >
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
          <g
            className="chart-group"
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
          >
            <g className="x-axis text-gray-400 text-xs" />
            <g className="y-axis text-gray-400 text-xs" />
            <path
              className="line-cpu"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
            />
            <path
              className="line-memory"
              fill="none"
              stroke="#a855f7"
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

LineChart.displayName = "LineChart";
