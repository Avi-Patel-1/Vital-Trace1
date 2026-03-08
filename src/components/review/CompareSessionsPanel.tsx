import { useMemo, useState } from "react";

import { CompareDelta, ProcessedAnalysis, QualityReview } from "../../types/signal";
import { CompareChart } from "../charts/CompareChart";
import { SpectrumChart } from "../charts/SpectrumChart";
import { linePath, toPlotPoints } from "../charts/chartUtils";

interface CompareSessionsPanelProps {
  primary: ProcessedAnalysis;
  comparison: ProcessedAnalysis | null;
  normalize: boolean;
  compareDeltas: CompareDelta[];
  compareHighlights: string[];
  qualityReview: QualityReview;
  comparisonQuality: QualityReview | null;
  onToggleNormalize: () => void;
}

function SplitWaveform({
  analysis,
  label
}: {
  analysis: ProcessedAnalysis;
  label: string;
}) {
  const path = useMemo(
    () => linePath(toPlotPoints(analysis.windowFilteredValues, 40, 520, 30, 190), 8),
    [analysis.windowFilteredValues]
  );

  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-[0.72rem] uppercase tracking-[0.24em] text-white/[0.4]">{label}</div>
      <div className="mt-2 text-base text-white">{analysis.dataset.title}</div>
      <svg viewBox="0 0 560 220" className="mt-4 h-[180px] w-full">
        <rect x="0" y="0" width="560" height="220" rx="24" fill="rgba(255,255,255,0.02)" />
        <path d={path} fill="none" stroke={analysis.selectedChannel.color} strokeWidth="3" />
      </svg>
    </div>
  );
}

export function CompareSessionsPanel({
  primary,
  comparison,
  normalize,
  compareDeltas,
  compareHighlights,
  qualityReview,
  comparisonQuality,
  onToggleNormalize
}: CompareSessionsPanelProps) {
  const [viewMode, setViewMode] = useState<"overlay" | "split">("overlay");

  return (
    <div className="grid gap-6">
      <div className="panel-shell">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Compare sessions
            </div>
            <div className="mt-2 text-lg text-white">Baseline, follow-up, or window-to-window</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className={viewMode === "overlay" ? "primary-button" : "chip-button"}
              onClick={() => setViewMode("overlay")}
            >
              Overlay
            </button>
            <button
              className={viewMode === "split" ? "primary-button" : "chip-button"}
              onClick={() => setViewMode("split")}
            >
              Split
            </button>
            <button className="chip-button" onClick={onToggleNormalize}>
              {normalize ? "Normalized" : "Absolute"}
            </button>
          </div>
        </div>

        {viewMode === "overlay" ? (
          <CompareChart primary={primary} comparison={comparison} normalize={normalize} />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            <SplitWaveform analysis={primary} label="Primary" />
            <SplitWaveform analysis={comparison ?? primary} label={comparison ? "Comparison" : "Reference"} />
          </div>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Spectrum comparison
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <SpectrumChart before={primary.spectrumBefore} after={primary.spectrumAfter} />
            {comparison ? (
              <SpectrumChart before={comparison.spectrumBefore} after={comparison.spectrumAfter} />
            ) : (
              <div className="rounded-[1.5rem] border border-dashed border-white/[0.12] px-4 py-8 text-sm text-white/[0.46]">
                Load a second session to compare spectra side by side.
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="panel-shell">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Main changes
            </div>
            <div className="mt-4 space-y-3">
              {compareHighlights.map((item) => (
                <div key={item} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/[0.58]">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="panel-shell">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Deltas
            </div>
            <div className="mt-4 grid gap-3">
              {compareDeltas.length ? (
                compareDeltas.map((delta) => (
                  <div key={delta.id} className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[0.72rem] uppercase tracking-[0.2em] text-white/[0.42]">
                          {delta.label}
                        </div>
                        <div className="mt-2 text-sm text-white/[0.56]">{delta.note}</div>
                      </div>
                      <div className="signal-badge">{delta.delta}</div>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-white/[0.58] sm:grid-cols-2">
                      <div>Primary: {delta.primary}</div>
                      <div>Comparison: {delta.comparison}</div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-4 text-sm text-white/[0.46]">
                  Select a second recording to compute deltas.
                </div>
              )}
            </div>
          </div>

          <div className="panel-shell">
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Quality
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Primary</div>
                <div className="mt-2 text-2xl text-white">{qualityReview.overallScore}%</div>
              </div>
              <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">Comparison</div>
                <div className="mt-2 text-2xl text-white">
                  {comparisonQuality ? `${comparisonQuality.overallScore}%` : "—"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
