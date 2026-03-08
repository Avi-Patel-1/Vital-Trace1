import { useState } from "react";

import { NotebookCategory, NotebookEntry, TimeRange } from "../../types/signal";

interface RegionNotebookPanelProps {
  entries: NotebookEntry[];
  selection: TimeRange;
  onAddEntry: (entry: {
    label: string;
    note: string;
    category: NotebookCategory;
    startTime: number;
    endTime: number;
  }) => void;
  onRemoveEntry: (entryId: string) => void;
  onToggleInclude: (entryId: string) => void;
  onJumpToEntry: (entry: NotebookEntry) => void;
}

const categories: NotebookCategory[] = [
  "noise",
  "motion artifact",
  "peak cluster",
  "high activity",
  "recovery segment",
  "notable change",
  "custom"
];

export function RegionNotebookPanel({
  entries,
  selection,
  onAddEntry,
  onRemoveEntry,
  onToggleInclude,
  onJumpToEntry
}: RegionNotebookPanelProps) {
  const [label, setLabel] = useState("Window note");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<NotebookCategory>("notable change");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <div className="panel-shell space-y-5">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Region notebook
          </div>
          <div className="mt-2 text-lg text-white">Capture the parts that matter</div>
        </div>

        <div className="grid gap-3">
          <label className="control-field">
            <span>Label</span>
            <input
              className="control-input"
              value={label}
              onChange={(event) => setLabel(event.target.value)}
            />
          </label>
          <label className="control-field">
            <span>Category</span>
            <select
              className="control-input"
              value={category}
              onChange={(event) => setCategory(event.target.value as NotebookCategory)}
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>
          <label className="control-field">
            <span>Note</span>
            <textarea
              className="control-input min-h-[110px] resize-y"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Save a short review note"
            />
          </label>
        </div>

        <div className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] p-4 text-sm text-white/[0.58]">
          Current window: {selection.start.toFixed(2)} s to {selection.end.toFixed(2)} s
        </div>

        <button
          className="primary-button"
          onClick={() =>
            onAddEntry({
              label,
              note,
              category,
              startTime: selection.start,
              endTime: selection.end
            })
          }
        >
          Save current region
        </button>
      </div>

      <div className="panel-shell">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
              Saved regions
            </div>
            <div className="mt-2 text-lg text-white">{entries.length} notebook entries</div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {entries.length ? (
            entries.map((entry) => (
              <div key={entry.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 text-left" onClick={() => onJumpToEntry(entry)}>
                    <div className="text-sm uppercase tracking-[0.2em]" style={{ color: entry.color }}>
                      {entry.category}
                    </div>
                    <div className="mt-2 text-base text-white">{entry.label}</div>
                    <div className="mt-2 text-sm text-white/[0.52]">
                      {entry.startTime.toFixed(2)} s to {entry.endTime.toFixed(2)} s
                    </div>
                    {entry.note && <div className="mt-2 text-sm text-white/[0.52]">{entry.note}</div>}
                  </button>
                  <div className="flex flex-col gap-2">
                    <button className="chip-button" onClick={() => onToggleInclude(entry.id)}>
                      {entry.includeInReport ? "In report" : "Skip report"}
                    </button>
                    <button className="chip-button" onClick={() => onRemoveEntry(entry.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[1.2rem] border border-dashed border-white/[0.12] px-4 py-5 text-sm text-white/[0.46]">
              Save a few windows here, then include the useful ones in the report.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
