import { useEffect, useRef, memo } from "react";
import * as d3 from "d3";
import gsap from "gsap";
import type { NodeMetric } from "../types/metrics";
import { HEALTH_COLORS } from "../utils/scales";

interface HeatMapProps {
  data: NodeMetric[];
  width?: number;
  height?: number;
}

const MARGIN = { top: 40, right: 100, bottom: 20, left: 80 };
const COLS = 6;

export const HeatMap = memo(
  ({ data, width = 800, height = 400 }: HeatMapProps) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const cellsInitialized = useRef(false);

    const innerWidth = width - MARGIN.left - MARGIN.right;
    const innerHeight = height - MARGIN.top - MARGIN.bottom;

    const rows = Math.ceil(data.length / COLS);
    const cellWidth = innerWidth / COLS;
    const cellHeight = innerHeight / rows;

    useEffect(() => {
      if (!svgRef.current || data.length === 0) return;

      const svg = d3.select(svgRef.current);
      const g = svg.select<SVGGElement>("g.heatmap-group");

      const cells = g
        .selectAll<SVGGElement, NodeMetric>("g.cell")
        .data(data, (d) => d.nodeId);

      const cellsEnter = cells
        .enter()
        .append("g")
        .attr("class", "cell")
        .attr("transform", (_, i) => {
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          return `translate(${col * cellWidth},${row * cellHeight})`;
        });

      cellsEnter
        .append("rect")
        .attr("width", cellWidth - 2)
        .attr("height", cellHeight - 2)
        .attr("rx", 4)
        .attr("fill", (d) => HEALTH_COLORS[d.status])
        .attr("stroke", "#1f2937")
        .attr("stroke-width", 1);

      cellsEnter
        .append("text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2 - 8)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs font-mono fill-gray-900")
        .text((d) => d.nodeId);

      cellsEnter
        .append("text")
        .attr("x", cellWidth / 2)
        .attr("y", cellHeight / 2 + 8)
        .attr("text-anchor", "middle")
        .attr("class", "text-xs font-mono fill-gray-900")
        .text((d) => `${d.load}%`);

      const cellsMerge = cellsEnter.merge(cells);

      cellsMerge
        .select("rect")
        .transition()
        .duration(300)
        .attr("fill", (d) => HEALTH_COLORS[d.status]);

      cellsMerge.select("text:last-child").text((d) => `${d.load}%`);

      if (!cellsInitialized.current) {
        cellsInitialized.current = true;
        const rects = cellsMerge.selectAll("rect").nodes();
        gsap.from(rects, {
          scale: 0,
          transformOrigin: "center",
          duration: 0.6,
          stagger: 0.02,
          ease: "back.out(1.7)",
        });
      }

      const handleMouseEnter = (event: MouseEvent, d: NodeMetric) => {
        const target = event.currentTarget as SVGGElement;
        d3.select(target)
          .select("rect")
          .attr("stroke-width", 2)
          .attr("stroke", "#60a5fa");

        if (tooltipRef.current) {
          const [x, y] = d3.pointer(event, svgRef.current);
          tooltipRef.current.style.display = "block";
          tooltipRef.current.style.left = `${x + MARGIN.left + 10}px`;
          tooltipRef.current.style.top = `${y + MARGIN.top - 10}px`;
          const statusColor =
            d.status === "healthy"
              ? "text-green-400"
              : d.status === "degraded"
                ? "text-amber-400"
                : "text-red-400";
          tooltipRef.current.innerHTML = `
          <div class="text-xs font-mono">
            <div class="font-semibold text-gray-200">${d.nodeId}</div>
            <div class="text-gray-400 mt-1">Region: ${d.region}</div>
            <div class="${statusColor} font-semibold capitalize">Status: ${d.status}</div>
            <div class="text-yellow-400">Load: ${d.load}%</div>
            <div class="text-gray-400">Health: ${d.health}%</div>
          </div>
        `;
        }
      };

      const handleMouseLeave = (event: MouseEvent) => {
        const target = event.currentTarget as SVGGElement;
        d3.select(target)
          .select("rect")
          .attr("stroke-width", 1)
          .attr("stroke", "#1f2937");

        if (tooltipRef.current) {
          tooltipRef.current.style.display = "none";
        }
      };

      cellsMerge
        .on("mouseenter", handleMouseEnter)
        .on("mouseleave", handleMouseLeave);

      cells.exit().remove();

      return () => {
        cellsMerge.on("mouseenter", null).on("mouseleave", null);
      };
    }, [data, cellWidth, cellHeight]);

    return (
      <div className="relative">
        <svg ref={svgRef} width={width} height={height}>
          <g
            className="heatmap-group"
            transform={`translate(${MARGIN.left},${MARGIN.top})`}
          />
        </svg>
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none bg-gray-900/95 border border-gray-700 rounded px-3 py-2 shadow-lg"
          style={{ display: "none" }}
        />
        <div className="absolute top-2 right-4 flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: HEALTH_COLORS.healthy }}
            />
            <span className="text-gray-400">Healthy</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: HEALTH_COLORS.degraded }}
            />
            <span className="text-gray-400">Degraded</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded"
              style={{ backgroundColor: HEALTH_COLORS.down }}
            />
            <span className="text-gray-400">Down</span>
          </div>
        </div>
      </div>
    );
  },
);

HeatMap.displayName = "HeatMap";
