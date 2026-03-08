import { useMemo, useState } from "react";
import { reviewPalette } from "../../lib/theme/palette";

interface BatchRow {
  dataset: {
    id: string;
    title: string;
    signalType: string;
    durationSec: number;
  };
  quality: { overallScore: number; flags: { id: string }[] };
  analysis: {
    detection: { peaks: { id: string }[]; regions: { id: string }[] };
  };
  rate: number | null;
  dominantFrequency: number;
}

interface BatchReviewPanelProps {
  rows: BatchRow[];
  summary: {
    averageQuality: number;
    lowQualityCount: number;
    outliers: BatchRow[];
  };
  onOpenDataset: (datasetId: string) => void;
  onComparePair: (primaryId: string, comparisonId: string) => void;
}

export function BatchReviewPanel({
  rows,
  summary,
  onOpenDataset,
  onComparePair
}: BatchReviewPanelProps) {
  const [sortKey, setSortKey] = useState<"quality" | "duration" | "rate">("quality");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((left, right) => {
      if (sortKey === "duration") {
        return right.dataset.durationSec - left.dataset.durationSec;
      }
      if (sortKey === "rate") {
        return (right.rate ?? -1) - (left.rate ?? -1);
      }
      return right.quality.overallScore - left.quality.overallScore;
    });
  }, [rows, sortKey]);

  return (
    <div className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-shell p-4 sm:p-5">
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">Recordings</div>
          <div className="mt-3 text-3xl text-white">{rows.length}</div>
        </div>
        <div className="panel-shell p-4 sm:p-5">
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">Average quality</div>
          <div className="mt-3 text-3xl text-white">{summary.averageQuality.toFixed(0)}%</div>
        </div>
        <div className="panel-shell p-4 sm:p-5">
          <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">Flagged low quality</div>
          <div className="mt-3 text-3xl text-white">{summary.lowQualityCount}</div>
        </div>
      </div>

      <div className="panel-shell">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Cohort review
            </div>
            <div className="mt-2 text-lg text-white">Sort, scan, and compare recordings</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={sortKey === "quality" ? "primary-button" : "chip-button"} onClick={() => setSortKey("quality")}>
              Quality
            </button>
            <button className={sortKey === "duration" ? "primary-button" : "chip-button"} onClick={() => setSortKey("duration")}>
              Duration
            </button>
            <button className={sortKey === "rate" ? "primary-button" : "chip-button"} onClick={() => setSortKey("rate")}>
              Rate
            </button>
            <button
              className="chip-button"
              disabled={selectedIds.length < 2}
              onClick={() => onComparePair(selectedIds[0], selectedIds[1])}
            >
              Compare selected
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {sortedRows.map((row) => (
            <div key={row.dataset.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-4">
              <div className="grid gap-3 xl:grid-cols-[0.18fr_0.34fr_0.48fr] xl:items-center">
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.dataset.id)}
                    onChange={(event) =>
                      setSelectedIds((current) =>
                        event.target.checked
                          ? [...current, row.dataset.id].slice(-2)
                          : current.filter((item) => item !== row.dataset.id)
                      )
                    }
                  />
                  <span>Select</span>
                </label>
                <button className="text-left" onClick={() => onOpenDataset(row.dataset.id)}>
                  <div className="text-sm uppercase tracking-[0.22em] text-white/[0.42]">
                    {row.dataset.signalType}
                  </div>
                  <div className="mt-2 text-lg text-white">{row.dataset.title}</div>
                </button>
                <div className="grid gap-3 text-sm text-white/[0.58] sm:grid-cols-4">
                  <div>Quality {row.quality.overallScore}%</div>
                  <div>Peaks {row.analysis.detection.peaks.length}</div>
                  <div>Rate {row.rate ? row.rate.toFixed(0) : "—"}</div>
                  <div>{row.dominantFrequency.toFixed(1)} Hz</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Outliers
          </div>
          <div className="mt-4 space-y-3">
            {summary.outliers.length ? (
              summary.outliers.map((row) => (
                <button
                  key={row.dataset.id}
                  className="w-full rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3 text-left"
                  onClick={() => onOpenDataset(row.dataset.id)}
                >
                  <div className="text-base text-white">{row.dataset.title}</div>
                  <div className="mt-2 text-sm text-white/[0.56]">
                    {row.quality.overallScore}% quality · {row.analysis.detection.regions.length} flagged regions
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-4 text-sm text-white/[0.46]">
                No strong outliers in the current batch.
              </div>
            )}
          </div>
        </div>

        <div className="panel-shell">
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Quality distribution
          </div>
          <div className="mt-5 space-y-3">
            {sortedRows.map((row) => (
              <div key={row.dataset.id} className="grid gap-3 sm:grid-cols-[0.34fr_0.66fr] sm:items-center">
                <div className="text-sm text-white/[0.58]">{row.dataset.title}</div>
                <div className="rounded-full border border-white/10 bg-white/[0.03] p-1">
                  <div
                    className="h-3 rounded-full"
                    style={{
                      width: `${Math.max(8, row.quality.overallScore)}%`,
                      background:
                        row.quality.overallScore >= 75
                          ? reviewPalette.scoreHigh
                          : row.quality.overallScore >= 55
                            ? reviewPalette.scoreMedium
                            : reviewPalette.scoreLow
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
