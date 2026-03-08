import { useState } from "react";

import { Annotation, TimeRange } from "../../types/signal";

interface AnnotationPanelProps {
  annotations: Annotation[];
  selection: TimeRange;
  cursorTime: number | null;
  peakCount: number;
  onAddMarker: (label: string, note: string) => void;
  onAddRange: (label: string, note: string) => void;
  onRemove: (annotationId: string) => void;
}

export function AnnotationPanel({
  annotations,
  selection,
  cursorTime,
  peakCount,
  onAddMarker,
  onAddRange,
  onRemove
}: AnnotationPanelProps) {
  const [label, setLabel] = useState("Review note");
  const [note, setNote] = useState("");

  return (
    <div className="panel-shell space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Annotate
          </div>
          <div className="mt-2 text-lg text-white">Mark beats, ranges, and notes</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="control-field">
          <span>Label</span>
          <input
            className="control-input"
            value={label}
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
        <label className="control-field">
          <span>Note</span>
          <input
            className="control-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional note"
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3 text-sm text-white/[0.58]">
          Window {selection.start.toFixed(2)} s to {selection.end.toFixed(2)} s
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3 text-sm text-white/[0.58]">
          Cursor {cursorTime !== null ? `${cursorTime.toFixed(2)} s` : "idle"}
        </div>
        <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-3 text-sm text-white/[0.58]">
          Peaks in view {peakCount}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button className="chip-button" onClick={() => onAddMarker(label, note)}>
          {cursorTime !== null ? "Marker at cursor" : "Marker at window start"}
        </button>
        <button className="chip-button" onClick={() => onAddRange(label, note)}>
          Range from selection
        </button>
      </div>

      <div className="space-y-3">
        {annotations.length ? (
          annotations.map((annotation) => (
            <div key={annotation.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.2em]" style={{ color: annotation.color }}>
                    {annotation.type}
                  </div>
                  <div className="mt-2 text-base text-white">{annotation.label}</div>
                  <div className="mt-2 text-sm text-white/[0.58]">
                    {annotation.time.toFixed(2)} s
                    {annotation.endTime !== undefined ? ` to ${annotation.endTime.toFixed(2)} s` : ""}
                  </div>
                  {annotation.note && <div className="mt-2 text-sm text-white/[0.52]">{annotation.note}</div>}
                </div>
                <button className="chip-button" onClick={() => onRemove(annotation.id)}>
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-[1.4rem] border border-dashed border-white/[0.12] p-4 text-sm text-white/[0.48]">
            No markers yet. Add a cursor note or save the current range.
          </div>
        )}
      </div>
    </div>
  );
}
