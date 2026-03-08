import { useRef } from "react";

import { ProcessedAnalysis, TimeRange } from "../../types/signal";
import { reviewPalette } from "../../lib/theme/palette";
import { linePath, toPlotPoints } from "./chartUtils";

interface MiniMapNavigatorProps {
  analysis: ProcessedAnalysis;
  selection: TimeRange;
  onSelectionChange: (selection: TimeRange) => void;
}

export function MiniMapNavigator({
  analysis,
  selection,
  onSelectionChange
}: MiniMapNavigatorProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const width = 1000;
  const xStart = 34;
  const xEnd = 966;
  const yTop = 26;
  const yBottom = 154;
  const duration = analysis.dataset.durationSec;
  const path = linePath(
    toPlotPoints(analysis.selectedChannel.filtered, xStart, xEnd, yTop, yBottom),
    8
  );

  const pointerSelection = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) {
      return selection;
    }
    const ratio = (clientX - rect.left) / rect.width;
    const center = ratio * duration;
    const windowSize = selection.end - selection.start;
    const start = Math.max(0, Math.min(center - windowSize / 2, duration - windowSize));
    return {
      start,
      end: start + windowSize
    };
  };

  return (
    <div className="panel-shell">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm uppercase tracking-[0.26em] text-white/[0.42]">Navigator</div>
        <div className="flex flex-wrap gap-2 text-sm text-white/[0.58]">
          <span>{analysis.dataset.durationSec.toFixed(1)} s full trace</span>
          <span>{(selection.end - selection.start).toFixed(1)} s view</span>
        </div>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${width} 180`}
        className="h-40 w-full cursor-grab"
        onPointerDown={(event) => onSelectionChange(pointerSelection(event.clientX))}
        onPointerMove={(event) => {
          if (event.buttons !== 1) {
            return;
          }
          onSelectionChange(pointerSelection(event.clientX));
        }}
      >
        <rect x="0" y="0" width={width} height="180" rx="24" fill="rgba(255,255,255,0.02)" />
        <path d={path} fill="none" stroke={analysis.selectedChannel.color} strokeWidth="2.4" />
        <rect
          x={xStart + (selection.start / duration) * (xEnd - xStart)}
          y="16"
          width={((selection.end - selection.start) / duration) * (xEnd - xStart)}
          height="148"
          rx="18"
          fill={reviewPalette.selectionFill}
          stroke={reviewPalette.selectionStroke}
        />
      </svg>
    </div>
  );
}
