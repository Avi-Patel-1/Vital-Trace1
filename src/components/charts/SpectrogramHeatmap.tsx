import { SpectrogramGrid } from "../../types/signal";
import { heatColor } from "./chartUtils";

interface SpectrogramHeatmapProps {
  spectrogram: SpectrogramGrid;
}

export function SpectrogramHeatmap({ spectrogram }: SpectrogramHeatmapProps) {
  const maxValue = Math.max(...spectrogram.values.flat(), 1e-6);
  const columnWidth = 860 / Math.max(spectrogram.times.length, 1);
  const rowHeight = 200 / Math.max(spectrogram.frequencies.length, 1);

  return (
    <div className="panel-shell">
      <div className="mb-4 text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
        Spectrogram
      </div>
      <svg viewBox="0 0 960 250" className="h-[250px] w-full">
        <rect x="0" y="0" width="960" height="250" rx="24" fill="rgba(255,255,255,0.02)" />
        {spectrogram.values.map((column, columnIndex) =>
          column.map((value, rowIndex) => (
            <rect
              key={`${columnIndex}-${rowIndex}`}
              x={54 + columnIndex * columnWidth}
              y={18 + (spectrogram.frequencies.length - rowIndex - 1) * rowHeight}
              width={columnWidth + 0.4}
              height={rowHeight + 0.4}
              fill={heatColor(value / maxValue)}
              opacity={0.9}
            />
          ))
        )}
        <text x="54" y="236" fill="rgba(255,255,255,0.48)" fontSize="12">
          Time
        </text>
        <text x="18" y="36" fill="rgba(255,255,255,0.48)" fontSize="12">
          Hz
        </text>
      </svg>
    </div>
  );
}
