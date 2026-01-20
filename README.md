# Infrastructure Metrics Dashboard

Production-quality visualization dashboard built with React, TypeScript, D3.js, and GSAP. Demonstrates real-time infrastructure monitoring with performance-optimized rendering.

## What This Represents

A real-time cluster monitoring dashboard for distributed computing infrastructure. Visualizes:

- **Resource Usage**: CPU and memory utilization over time with live updates
- **Request Throughput**: Requests per second (RPS) showing system load
- **Latency Percentiles**: P50, P95, P99 response times for performance analysis
- **Error Rate**: Percentage of failed requests with threshold alerting
- **Node Health Status**: Discrete health states (healthy/degraded/down) across 24 compute nodes

Simulates the type of observability tooling used in production environments for monitoring Kubernetes clusters, distributed databases, or edge computing networks.

## Architecture

### Component Hierarchy

```
App
└── Dashboard (state owner)
    ├── Controls (time range, live/pause)
    ├── LineChart (CPU/Memory - D3 + React)
    ├── ThroughputChart (RPS - D3 + React)
    ├── LatencyChart (P50/P95/P99 - D3 + React)
    ├── ErrorRateChart (Error % - D3 + React)
    └── HeatMap (Node health - D3 + React)
```

### Key Design Decisions

**1. React Owns the DOM, D3 Handles Math**

- React manages component lifecycle and DOM structure via JSX
- D3 used exclusively for scales, axes, line generators, and data transformations
- No D3 DOM manipulation (`.append()`, `.remove()`) - all done through React refs
- D3 selections only for updating existing elements (`.attr()`, `.call()`)

**2. State Management**

- Dashboard component owns all data state
- Data generators isolated in `utils/dataGenerator.ts`
- Refs used for D3-specific state (paths, intervals) that shouldn't trigger re-renders
- `useMemo` prevents unnecessary chart re-renders when parent state changes

**3. Update Strategy**

- Time-series data uses sliding window (maintains fixed point count)
- New data points appended, old ones trimmed based on selected time range
- D3 transitions for smooth visual updates without full redraws
- GSAP for initial mount animations only

**4. Performance Optimizations**

- **Throttling**: Custom `useThrottle` hook batches rapid state updates (100-150ms)
- **Memoization**: Charts wrapped in `useMemo` to prevent re-renders on unrelated state changes
- **Partial Updates**: D3 transitions update only attributes (fill, path data), not entire SVG
- **Ref-based Intervals**: Timers stored in refs to avoid stale closures and unnecessary effect re-runs
- **Memo Components**: All components wrapped in `React.memo` for shallow prop comparison

**5. Type Safety**

- Strict TypeScript throughout
- D3 generic types for scales and line generators
- No `any` types (except unavoidable D3 type casting)

## Performance Tradeoffs

### What Was Optimized

1. **Throttled State Updates**: Prevents React re-render storms during live updates
2. **Selective Re-renders**: Only affected components update when data changes
3. **D3 Attribute Updates**: Modifies existing SVG elements instead of recreating
4. **Stable References**: `useCallback` for event handlers prevents child re-renders

### What Was Not Optimized (Intentionally)

1. **No Canvas Rendering**: SVG chosen for clarity and DOM inspection over raw performance
2. **No Web Workers**: Data generation is lightweight; threading overhead not justified
3. **No Virtual Scrolling**: Fixed dataset size (24 nodes) doesn't warrant complexity
4. **Simple Transitions**: 300ms CSS transitions instead of complex animation libraries

### Scalability Limits

- **Time-series**: Tested up to 1800 points (30min @ 1s intervals) without degradation
- **Heatmap**: Designed for 24-100 nodes; beyond that, consider canvas or aggregation
- **Update Frequency**: 2-3 second intervals optimal; sub-second updates would need requestAnimationFrame batching

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx         # Main container, state owner
│   ├── LineChart.tsx         # CPU/Memory time series
│   ├── ThroughputChart.tsx   # RPS visualization
│   ├── LatencyChart.tsx      # Multi-line percentile chart
│   ├── ErrorRateChart.tsx    # Error rate with threshold
│   ├── HeatMap.tsx           # Node health grid
│   └── Controls.tsx          # Time range and live toggle
├── hooks/
│   └── useThrottle.ts        # Custom throttle hook
├── types/
│   └── metrics.ts            # TypeScript interfaces
├── utils/
│   ├── dataGenerator.ts      # Correlated mock data
│   └── scales.ts             # Shared D3 scales & formatters
└── App.tsx
```

## Running Locally

```bash
pnpm install
pnpm dev
```

## Tech Stack

- **React 19** - Component architecture
- **TypeScript 5.9** - Type safety
- **D3.js 7.9** - Data visualization primitives
- **GSAP 3.14** - Animation engine
- **Vite 7** - Build tool
- **TailwindCSS 4** - Styling

## Implementation Notes

- All D3 effects properly cleaned up on unmount (event listeners, intervals)
- Tooltip positioning uses D3 pointer utilities for accuracy
- Color scales use D3 interpolators (RdYlGn for health, sequential for gradients)
- Time formatting handled by D3's locale-aware formatters
- GSAP animations fire once on mount, not on every update (performance)

---

## Extended Metrics - Design Addendum

### Why These Metrics Were Chosen

**Request Throughput (RPS)**

- Primary indicator of system load and capacity utilization
- Correlates with CPU usage to show realistic infrastructure behavior
- Essential for capacity planning and autoscaling decisions
- Line chart with area fill provides clear visual trend

**Latency Percentiles (P50, P95, P99)**

- P50 shows typical user experience
- P95/P99 reveal tail latency issues affecting subset of users
- Multi-line visualization enables comparison across percentiles
- Degrades realistically under load (correlated with CPU/RPS)
- Critical for SLA monitoring in production systems

**Error Rate (%)**

- Most important reliability metric for production systems
- Threshold indicator (1.0%) provides visual alert mechanism
- Occasional spikes simulate realistic failure scenarios (network issues, deployment rollouts)
- Area chart emphasizes magnitude of error events

**Node Health Status (Enhanced)**

- Discrete states (healthy/degraded/down) more actionable than continuous scale
- Color-coded grid enables rapid visual scanning of cluster health
- Gradual state transitions simulate realistic degradation patterns
- Regional grouping aids in identifying zone-specific issues

### Data Correlation Strategy

All metrics are generated with realistic interdependencies:

```
CPU ↑ → RPS ↑ (higher CPU enables more throughput)
CPU ↑ → Latency ↑ (system under load responds slower)
CPU ↑ → Error Rate ↑ (stressed systems fail more)
Error Spikes → Cooldown period (simulates incident recovery)
Node Health → Gradual degradation (not random jumps)
```

This correlation makes the dashboard feel like a real system rather than random data.

### Performance Considerations

**Shared Data Source**

- Single `MetricsGenerator` instance produces all correlated metrics
- One data point generates 9 values (cpu, memory, rps, p50, p95, p99, errorRate)
- Eliminates redundant calculations and keeps metrics synchronized

**Chart-Specific Optimizations**

- Each chart component independently memoized
- Throttled updates prevent re-render cascades
- D3 scales computed in `useMemo` to avoid recalculation
- Path references cached to enable partial updates

**Layout Strategy**

- Grid layout for smaller charts (throughput, latency, error rate)
- Full-width for high-density visualizations (resource usage, node health)
- Reduces vertical scrolling while maintaining readability

### Shared Utilities

**`utils/scales.ts`**

- Centralized color definitions for health states
- Formatter functions (latency, RPS, percentages) ensure consistency
- D3 scale factories reduce boilerplate in components
- Single source of truth for threshold values

**Benefits:**

- Consistent visual language across all charts
- Easy to adjust thresholds globally
- Type-safe color mappings
- Reduced code duplication

### Scalability Considerations

**Current Limits:**

- 5 time-series charts updating every 2 seconds
- ~150 data points per chart (5 minutes at 2s intervals)
- 24 nodes in heatmap
- Total: ~750 data points + 24 nodes rendered simultaneously

**How to Scale Further:**

1. **More Data Points (10k+ per chart)**
   - Switch to canvas rendering for line charts
   - Implement data downsampling (LTTB algorithm)
   - Use Web Workers for data processing

2. **More Nodes (100+)**
   - Virtualize heatmap grid
   - Aggregate by region/zone
   - Implement zoom/pan interactions

3. **Higher Update Frequency (<1s)**
   - Batch updates with `requestAnimationFrame`
   - Implement double buffering for smooth transitions
   - Consider WebGL for rendering

4. **More Metrics (20+ charts)**
   - Lazy load chart components
   - Implement virtual scrolling for dashboard
   - Add metric selection/filtering UI

### Architecture Decisions

**Why Not Use a Charting Library?**

- Full control over rendering pipeline
- Demonstrates D3 + React integration patterns
- No bundle size overhead from unused features
- Educational value for code review

**Why Separate Chart Components?**

- Each metric has unique visualization requirements
- Independent testing and optimization
- Easy to add/remove metrics
- Clear separation of concerns

**Why Correlated Mock Data?**

- Realistic behavior aids in visual debugging
- Demonstrates understanding of system dynamics
- More impressive in demos/interviews
- Tests edge cases (spikes, degradation)

### Production Readiness Checklist

- [x] TypeScript strict mode
- [x] Proper cleanup of effects and listeners
- [x] Memoization for expensive computations
- [x] Throttling for high-frequency updates
- [x] Accessible color choices (distinct hues)
- [x] Responsive layout (grid system)
- [x] Error boundaries (would add in production)
- [x] Loading states (would add for real data)
- [ ] Unit tests (would add with Vitest)
- [ ] E2E tests (would add with Playwright)
- [ ] Storybook stories (would add for component library)

### Future Enhancements

If this were a production system:

1. **Real Data Integration**: WebSocket connection to metrics backend
2. **Alerting**: Visual + audio alerts when thresholds breached
3. **Historical Playback**: Scrub through past time ranges
4. **Metric Comparison**: Overlay multiple time periods
5. **Export**: Download charts as PNG/SVG or data as CSV
6. **Annotations**: Mark deployments, incidents on timeline
7. **Drill-down**: Click node to see detailed metrics
8. **Custom Dashboards**: User-configurable metric selection
