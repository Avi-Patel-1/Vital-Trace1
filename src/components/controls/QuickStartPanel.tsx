import { SavedView, SignalDataset } from "../../types/signal";

interface QuickStartPanelProps {
  datasets: SignalDataset[];
  currentDatasetId: string;
  hasRecentSession: boolean;
  savedViews: SavedView[];
  onLoadDataset: (datasetId: string) => void;
  onOpenUpload: () => void;
  onRestoreRecent: () => void;
  onSaveCurrentView: () => void;
  onLoadSavedView: (savedViewId: string) => void;
  onRemoveSavedView: (savedViewId: string) => void;
}

export function QuickStartPanel({
  datasets,
  currentDatasetId,
  hasRecentSession,
  savedViews,
  onLoadDataset,
  onOpenUpload,
  onRestoreRecent,
  onSaveCurrentView,
  onLoadSavedView,
  onRemoveSavedView
}: QuickStartPanelProps) {
  const firstSample = datasets.find((dataset) => dataset.source === "demo") ?? datasets[0];

  return (
    <div className="panel-shell space-y-5">
      <div>
        <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
          Start
        </div>
        <div className="mt-2 text-lg text-white">Open a signal view fast</div>
      </div>

      <div className="grid gap-3">
        <button
          className="action-tile text-left"
          onClick={() => onLoadDataset(firstSample.id)}
        >
          <span className="action-title">Load sample</span>
          <span className="action-copy">{firstSample.title}</span>
        </button>
        <button className="action-tile text-left" onClick={onOpenUpload}>
          <span className="action-title">Upload file</span>
          <span className="action-copy">CSV, TXT, or structured JSON</span>
        </button>
        <button
          className="action-tile text-left"
          onClick={onRestoreRecent}
          disabled={!hasRecentSession}
        >
          <span className="action-title">Open recent</span>
          <span className="action-copy">
            {hasRecentSession ? "Restore the last session state" : "No local session yet"}
          </span>
        </button>
      </div>

      <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.24em] text-white/[0.42]">
              Saved views
            </div>
            <div className="mt-2 text-base text-white">
              {datasets.find((dataset) => dataset.id === currentDatasetId)?.title}
            </div>
          </div>
          <button className="chip-button" onClick={onSaveCurrentView}>
            Save current
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {savedViews.length ? (
            savedViews.map((savedView) => (
              <div
                key={savedView.id}
                className="flex items-center justify-between gap-3 rounded-[1.1rem] border border-white/10 bg-white/[0.04] px-3 py-3"
              >
                <button
                  className="min-w-0 text-left"
                  onClick={() => onLoadSavedView(savedView.id)}
                >
                  <div className="truncate text-sm text-white">{savedView.name}</div>
                  <div className="mt-1 text-[0.68rem] uppercase tracking-[0.18em] text-white/[0.42]">
                    {savedView.savedAt.slice(11, 16)}
                  </div>
                </button>
                <button
                  className="chip-button"
                  onClick={() => onRemoveSavedView(savedView.id)}
                >
                  Remove
                </button>
              </div>
            ))
          ) : (
            <div className="rounded-[1.1rem] border border-dashed border-white/[0.12] px-3 py-4 text-sm text-white/[0.48]">
              Save a useful window and filter state here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
