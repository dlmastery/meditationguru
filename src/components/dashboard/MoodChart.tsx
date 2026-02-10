'use client';

import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TimeSeriesPoint } from '@/types/features';

interface MoodChartProps {
  readonly data: readonly TimeSeriesPoint[];
  readonly title: string;
}

/** Chart dimensions — responsive width is handled by viewBox + container. */
const CHART_WIDTH = 600;
const CHART_HEIGHT = 200;
const PADDING_X = 40;
const PADDING_Y = 24;
const INNER_W = CHART_WIDTH - PADDING_X * 2;
const INNER_H = CHART_HEIGHT - PADDING_Y * 2;

/**
 * SVG line chart with a gradient fill, hover tooltip, and cosmic colour scheme.
 * Uses no external charting library — pure SVG.
 */
export default function MoodChart({ data, title }: MoodChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Filter out zero-value filler points for a cleaner line
  const nonZeroData = useMemo(
    () => data.filter((p) => p.value > 0),
    [data],
  );

  const { minVal, maxVal, points, linePath, areaPath } = useMemo(() => {
    if (nonZeroData.length === 0) {
      return { minVal: 0, maxVal: 5, points: [], linePath: '', areaPath: '' };
    }

    const values = nonZeroData.map((d) => d.value);
    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);
    // Add 10 % headroom so the line never touches edges
    const range = rawMax - rawMin || 1;
    const minV = rawMin - range * 0.1;
    const maxV = rawMax + range * 0.1;

    const pts = nonZeroData.map((d, i) => {
      const x = PADDING_X + (i / Math.max(nonZeroData.length - 1, 1)) * INNER_W;
      const y =
        PADDING_Y + INNER_H - ((d.value - minV) / (maxV - minV)) * INNER_H;
      return { x, y, ...d };
    });

    const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
    const areaD =
      lineD +
      ` L${pts[pts.length - 1].x},${PADDING_Y + INNER_H}` +
      ` L${pts[0].x},${PADDING_Y + INNER_H} Z`;

    return { minVal: minV, maxVal: maxV, points: pts, linePath: lineD, areaPath: areaD };
  }, [nonZeroData]);

  const gradientId = `mood-gradient-${title.replace(/\s/g, '-')}`;
  const lineGradientId = `line-gradient-${title.replace(/\s/g, '-')}`;

  return (
    <motion.div
      className="relative rounded-2xl backdrop-blur-xl border p-4 bg-white/5 border-white/10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className="text-white/80 text-sm font-medium mb-3">{title}</h3>

      {nonZeroData.length === 0 ? (
        <div className="flex items-center justify-center h-[200px] text-white/30 text-sm">
          No data yet — complete a session to see your chart.
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
            className="w-full h-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* Area gradient (purple fill under line) */}
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7b68ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7b68ee" stopOpacity="0.02" />
              </linearGradient>
              {/* Line gradient */}
              <linearGradient id={lineGradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7b68ee" />
                <stop offset="100%" stopColor="#e94560" />
              </linearGradient>
            </defs>

            {/* Y-axis grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
              const y = PADDING_Y + INNER_H * (1 - frac);
              return (
                <line
                  key={frac}
                  x1={PADDING_X}
                  y1={y}
                  x2={CHART_WIDTH - PADDING_X}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
              );
            })}

            {/* Filled area */}
            <path d={areaPath} fill={`url(#${gradientId})`} />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke={`url(#${lineGradientId})`}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data points and hover targets */}
            {points.map((pt, i) => (
              <g
                key={i}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Invisible wider hit target */}
                <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                {/* Visible dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredIndex === i ? 5 : 3}
                  fill={hoveredIndex === i ? '#e94560' : '#7b68ee'}
                  stroke="#0a0a12"
                  strokeWidth="1.5"
                />
              </g>
            ))}

            {/* X-axis labels (show first, middle, last) */}
            {[0, Math.floor(points.length / 2), points.length - 1]
              .filter((idx, pos, arr) => arr.indexOf(idx) === pos && points[idx])
              .map((idx) => (
                <text
                  key={idx}
                  x={points[idx].x}
                  y={CHART_HEIGHT - 4}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.35)"
                  fontSize="10"
                >
                  {points[idx].date.slice(5)}
                </text>
              ))}
          </svg>

          {/* Tooltip */}
          {hoveredIndex !== null && points[hoveredIndex] && (
            <div
              className="absolute pointer-events-none z-20 px-3 py-1.5 rounded-lg bg-black/80 backdrop-blur border border-white/10 text-xs text-white whitespace-nowrap"
              style={{
                left: `${(points[hoveredIndex].x / CHART_WIDTH) * 100}%`,
                top: `${(points[hoveredIndex].y / CHART_HEIGHT) * 100 - 14}%`,
                transform: 'translateX(-50%)',
              }}
            >
              <span className="text-white/60">{points[hoveredIndex].date}</span>
              <span className="mx-1.5 text-white/30">|</span>
              <span className="font-medium">{points[hoveredIndex].value}</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
