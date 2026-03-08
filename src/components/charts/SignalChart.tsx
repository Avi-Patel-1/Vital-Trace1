import { useMemo, useRef } from "react";

import { ProcessedAnalysis, Annotation } from "../../types/signal";
import { biosignalPalette, reviewPalette } from "../../lib/theme/palette";
import { linePath, toPlotPoints } from "./chartUtils";

interface SignalChartProps {
  analysis: ProcessedAnalysis;
  showRawOverlay: boolean;
  cursorTime: number | null;
  annotations: Annotation[];
  onCursorChange: (time: number | null) => void;
}

export function SignalChart({
  analysis,
  showRawOverlay,
  cursorTime,
  annotations,
  onCursorChange
}: SignalChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const laneHeight = 142;
  const height = analysis.processedChannels.length * laneHeight + 60;
  const xStart = 74;
  const xEnd = 942;
  const selectedDuration = analysis.selectedRange.end - analysis.selectedRange.start;
  const activeWindowValues = analysis.selectedChannel.filtered.slice(
    analysis.selectedIndexes.start,
    analysis.selectedIndexes.end
  );
  const hoverIndex =
    cursorTime === null
      ? null
      : Math.max(
          0,
          Math.min(
            activeWindowValues.length - 1,
            Math.round(
              ((cursorTime - analysis.selectedRange.start) / Math.max(selectedDuration, 0.001)) *
                (activeWindowValues.length - 1)
            )
          )
        );
  const hoverValue = hoverIndex === null ? null : activeWindowValues[hoverIndex];

  const lanes = useMemo(() => {
    return analysis.processedChannels.map((channel, laneIndex) => {
      const values = channel.filtered.slice(
        analysis.selectedIndexes.start,
        analysis.selectedIndexes.end
      );
      const rawValues = channel.raw.slice(
        analysis.selectedIndexes.start,
        analysis.selectedIndexes.end
      );
      const top = 28 + laneIndex * laneHeight;
      const bottom = top + laneHeight - 36;
      return {
        channel,
        top,
        bottom,
        filteredPath: linePath(toPlotPoints(values, xStart, xEnd, top, bottom), 10),
        rawPath: linePath(toPlotPoints(rawValues, xStart, xEnd, top, bottom), 10)
      };
    });
  }, [analysis.processedChannels, analysis.selectedIndexes.end, analysis.selectedIndexes.start]);

  const timeToX = (time: number) =>
    xStart +
    ((time - analysis.selectedRange.start) / Math.max(selectedDuration, 0.001)) *
      (xEnd - xStart);

  const pointerTime = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return null;
    }
    const ratio = (clientX - rect.left) / rect.width;
    return analysis.selectedRange.start + ratio * selectedDuration;
  };

  return (
    <div className="panel-shell relative overflow-hidden">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Waveform
          </div>
          <div className="mt-2 text-lg text-white">{analysis.dataset.title}</div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="signal-badge">{analysis.selectedChannel.name}</div>
          <div className="signal-badge">{selectedDuration.toFixed(1)} s</div>
          <div className="signal-badge">{analysis.detection.peaks.length} peaks</div>
          <div className="signal-badge">{analysis.detection.qualityScore}% quality</div>
          {hoverValue !== null && <div className="signal-badge">{hoverValue.toFixed(3)} {analysis.selectedChannel.unit}</div>}
        </div>
      </div>

      <svg
        ref={ref}
        viewBox={`0 0 1000 ${height}`}
        className="h-[420px] w-full cursor-crosshair"
        role="img"
        aria-label="Signal chart"
        onPointerLeave={() => onCursorChange(null)}
        onPointerMove={(event) => onCursorChange(pointerTime(event.clientX))}
      >
        <defs>
          <linearGradient id="signal-grid-stroke" x1="0" x2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.04)" />
            <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1000" height={height} rx="24" fill="rgba(255,255,255,0.02)" />

        {lanes.map((lane) => (
          <g key={lane.channel.id}>
            <line
              x1={xStart}
              x2={xEnd}
              y1={lane.bottom}
              y2={lane.bottom}
              stroke="url(#signal-grid-stroke)"
            />
            <text
              x="20"
              y={lane.top + 16}
              fill="rgba(255,255,255,0.62)"
              fontSize="12"
              letterSpacing="0.18em"
            >
              {lane.channel.name}
            </text>
            {showRawOverlay && (
              <path
                d={lane.rawPath}
                fill="none"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            )}
            <path
              d={lane.filteredPath}
              fill="none"
              stroke={lane.channel.color}
              strokeWidth={lane.channel.id === analysis.selectedChannel.id ? "2.8" : "2.1"}
              strokeLinecap="round"
            />
          </g>
        ))}

        {analysis.detection.peaks.map((peak) => {
          const lane = lanes.find((item) => item.channel.id === analysis.selectedChannel.id);
          if (!lane) {
            return null;
          }
          const x = timeToX(analysis.selectedRange.start + peak.time);
          const peakValues = analysis.selectedChannel.filtered.slice(
            analysis.selectedIndexes.start,
            analysis.selectedIndexes.end
          );
          const min = Math.min(...peakValues);
          const max = Math.max(...peakValues);
          const spread = Math.max(max - min, 1e-6);
          const normalized = (peak.amplitude - min) / spread;
          const y = lane.bottom - normalized * (lane.bottom - lane.top);
          return (
            <g key={peak.id}>
              <line
                x1={x}
                x2={x}
                y1={lane.top}
                y2={lane.bottom}
                stroke={reviewPalette.peakGuide}
                strokeDasharray="4 8"
              />
              <circle cx={x} cy={y} r="4.2" fill={biosignalPalette.light} stroke={lane.channel.color} strokeWidth="2" />
            </g>
          );
        })}

        {analysis.detection.regions.map((region) => {
          const lane = lanes.find((item) => item.channel.id === analysis.selectedChannel.id);
          if (!lane) {
            return null;
          }

          const start = analysis.selectedRange.start + region.startTime;
          const end = analysis.selectedRange.start + region.endTime;
          if (end < analysis.selectedRange.start || start > analysis.selectedRange.end) {
            return null;
          }

          return (
            <rect
              key={region.id}
              x={timeToX(Math.max(start, analysis.selectedRange.start))}
              y={lane.top}
              width={
                timeToX(Math.min(end, analysis.selectedRange.end)) -
                timeToX(Math.max(start, analysis.selectedRange.start))
              }
              height={lane.bottom - lane.top}
              fill={reviewPalette.regionFill}
            />
          );
        })}

        {annotations.map((annotation) => {
          if (
            annotation.time < analysis.selectedRange.start ||
            annotation.time > analysis.selectedRange.end
          ) {
            return null;
          }

          const x = timeToX(annotation.time);
          return (
            <g key={annotation.id}>
              <line
                x1={x}
                x2={x}
                y1="16"
                y2={height - 18}
                stroke={annotation.color}
                strokeDasharray="2 8"
              />
              <text
                x={x + 6}
                y="22"
                fill={annotation.color}
                fontSize="12"
              >
                {annotation.label}
              </text>
            </g>
          );
        })}

        {cursorTime !== null &&
          cursorTime >= analysis.selectedRange.start &&
          cursorTime <= analysis.selectedRange.end && (
            <g>
              <line
                x1={timeToX(cursorTime)}
                x2={timeToX(cursorTime)}
                y1="18"
                y2={height - 16}
                stroke="rgba(255,255,255,0.24)"
              />
              <rect
                x={timeToX(cursorTime) - 34}
                y={height - 40}
                width="68"
                height="24"
                rx="12"
                fill="rgba(7,13,19,0.88)"
                stroke="rgba(255,255,255,0.1)"
              />
              <text
                x={timeToX(cursorTime)}
                y={height - 24}
                fill="white"
                textAnchor="middle"
                fontSize="11"
                letterSpacing="0.18em"
              >
                {cursorTime.toFixed(2)} s
              </text>
            </g>
          )}
      </svg>
    </div>
  );
}
