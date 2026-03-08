import { ProcessedAnalysis } from "../../types/signal";
import { reviewPalette } from "../../lib/theme/palette";
import { linePath, normalizeSeries, toPlotPoints } from "./chartUtils";

interface CompareChartProps {
  primary: ProcessedAnalysis;
  comparison: ProcessedAnalysis | null;
  normalize: boolean;
}

export function CompareChart({
  primary,
  comparison,
  normalize
}: CompareChartProps) {
  const primaryValues = primary.selectedChannel.filtered.slice(
    primary.selectedIndexes.start,
    primary.selectedIndexes.end
  );
  const fallbackValues = primary.selectedChannel.filtered.slice(
    Math.max(0, primary.selectedIndexes.start - (primary.selectedIndexes.end - primary.selectedIndexes.start)),
    primary.selectedIndexes.start
  );
  const secondarySource =
    comparison?.selectedChannel.filtered.slice(
      comparison.selectedIndexes.start,
      comparison.selectedIndexes.end
    ) ?? fallbackValues;
  const secondaryValues = normalize ? normalizeSeries(secondarySource) : secondarySource;
  const normalizedPrimary = normalize ? normalizeSeries(primaryValues) : primaryValues;

  const primaryPath = linePath(toPlotPoints(normalizedPrimary, 60, 940, 38, 282), 10);
  const secondaryPath = linePath(toPlotPoints(secondaryValues, 60, 940, 38, 282), 10);

  return (
    <div className="panel-shell h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Compare
          </div>
          <div className="mt-2 text-lg text-white">
            {comparison ? "Recording overlay" : "Window A / Window B"}
          </div>
        </div>
        <div className="text-sm text-white/[0.48]">
          {normalize ? "Normalized amplitude" : "Absolute amplitude"}
        </div>
      </div>
      <svg viewBox="0 0 1000 320" className="h-[320px] w-full">
        <rect x="0" y="0" width="1000" height="320" rx="24" fill="rgba(255,255,255,0.02)" />
        <line x1="60" x2="940" y1="160" y2="160" stroke="rgba(255,255,255,0.08)" />
        <path d={secondaryPath} fill="none" stroke={reviewPalette.compareOverlay} strokeWidth="2.4" />
        <path d={primaryPath} fill="none" stroke={primary.selectedChannel.color} strokeWidth="2.8" />
      </svg>
    </div>
  );
}
