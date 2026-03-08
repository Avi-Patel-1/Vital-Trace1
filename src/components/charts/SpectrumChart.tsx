import { SpectrumPoint } from "../../types/signal";
import { biosignalPalette } from "../../lib/theme/palette";
import { linePath } from "./chartUtils";

interface SpectrumChartProps {
  before: SpectrumPoint[];
  after: SpectrumPoint[];
}

function spectrumPath(points: SpectrumPoint[], color: string, height = 280) {
  const width = 1000;
  const xStart = 56;
  const xEnd = 956;
  const yTop = 28;
  const yBottom = height - 36;
  const filtered = points.filter((point) => point.frequency <= 50);
  const maxAmplitude = Math.max(...filtered.map((point) => point.amplitude), 1e-6);
  const pathPoints = filtered.map((point) => ({
    x: xStart + (point.frequency / 50) * (xEnd - xStart),
    y: yBottom - (point.amplitude / maxAmplitude) * (yBottom - yTop)
  }));

  return {
    color,
    d: linePath(pathPoints, 8)
  };
}

export function SpectrumChart({ before, after }: SpectrumChartProps) {
  const beforePath = spectrumPath(before, "rgba(255,255,255,0.22)");
  const afterPath = spectrumPath(after, biosignalPalette.cyan);

  return (
    <div className="panel-shell h-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Frequency-domain analysis
          </div>
          <div className="mt-2 text-lg text-white">Raw and filtered spectrum</div>
        </div>
      </div>
      <svg viewBox="0 0 1000 280" className="h-[280px] w-full">
        <rect x="0" y="0" width="1000" height="280" rx="24" fill="rgba(255,255,255,0.02)" />
        {[10, 20, 30, 40, 50].map((value) => (
          <g key={value}>
            <line
              x1={56 + (value / 50) * 900}
              x2={56 + (value / 50) * 900}
              y1="24"
              y2="244"
              stroke="rgba(255,255,255,0.06)"
            />
            <text
              x={56 + (value / 50) * 900}
              y="264"
              textAnchor="middle"
              fill="rgba(255,255,255,0.48)"
              fontSize="12"
            >
              {value}
            </text>
          </g>
        ))}
        <path d={beforePath.d} fill="none" stroke={beforePath.color} strokeWidth="2.2" />
        <path d={afterPath.d} fill="none" stroke={afterPath.color} strokeWidth="2.8" />
      </svg>
    </div>
  );
}
