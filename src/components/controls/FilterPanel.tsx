import { useMemo, useState } from "react";

import { FilterSettings } from "../../types/signal";

interface FilterPanelProps {
  filters: FilterSettings;
  onChange: (patch: Partial<FilterSettings>) => void;
  onReset: () => void;
}

function numberInput(
  value: number | null,
  onChange: (value: number | null) => void,
  step = 1
) {
  return (
    <input
      className="control-input"
      type="number"
      step={step}
      value={value ?? ""}
      placeholder="off"
      onChange={(event) =>
        onChange(event.target.value === "" ? null : Number(event.target.value))
      }
    />
  );
}

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const activeChain = useMemo(() => {
    const items: string[] = [];
    if (filters.bandPassLowHz && filters.bandPassHighHz) {
      items.push("bandpass");
    } else {
      if (filters.lowPassHz) {
        items.push("lowpass");
      }
      if (filters.highPassHz) {
        items.push("highpass");
      }
    }
    if (filters.notchHz) {
      items.push("notch");
    }
    if (filters.baselineCorrection) {
      items.push("baseline");
    }
    if (filters.detrend) {
      items.push("detrend");
    }
    if (filters.normalize) {
      items.push("normalize");
    }
    if (filters.rectify) {
      items.push("rectify");
    }
    if (filters.envelope) {
      items.push("envelope");
    }
    return items;
  }, [filters]);

  return (
    <div className="panel-shell space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
            Filter
          </div>
          <div className="mt-2 text-lg text-white">Shape the active signal</div>
        </div>
        <div className="flex gap-2">
          <button className="chip-button" onClick={() => setShowAdvanced((value) => !value)}>
            {showAdvanced ? "Hide tune" : "Tune"}
          </button>
          <button className="chip-button" onClick={onReset}>
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.03] p-4">
        <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
          Active chain
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {activeChain.length ? (
            activeChain.map((item) => (
              <span key={item} className="signal-badge">
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm text-white/[0.48]">Raw trace</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm text-white/70">
        {[
          ["baselineCorrection", "Baseline"],
          ["detrend", "Detrend"],
          ["normalize", "Normalize"],
          ["rectify", "Rectify"],
          ["envelope", "Envelope"]
        ].map(([key, label]) => (
          <label key={key} className="toggle-field">
            <input
              type="checkbox"
              checked={Boolean(filters[key as keyof FilterSettings])}
              onChange={(event) =>
                onChange({ [key]: event.target.checked } as Partial<FilterSettings>)
              }
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="control-field">
          <span>Smoothing</span>
          <input
            className="control-input"
            type="range"
            min="1"
            max="12"
            value={filters.smoothingWindow}
            onChange={(event) =>
              onChange({ smoothingWindow: Number(event.target.value) })
            }
          />
          <span className="control-value">{filters.smoothingWindow}</span>
        </label>

        <label className="control-field">
          <span>Moving avg.</span>
          <input
            className="control-input"
            type="range"
            min="1"
            max="40"
            value={filters.movingAverageWindow}
            onChange={(event) =>
              onChange({ movingAverageWindow: Number(event.target.value) })
            }
          />
          <span className="control-value">{filters.movingAverageWindow}</span>
        </label>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3">
          <label className="control-field">
            <span>Low-pass</span>
            {numberInput(filters.lowPassHz, (value) => onChange({ lowPassHz: value }), 0.1)}
          </label>

          <label className="control-field">
            <span>High-pass</span>
            {numberInput(filters.highPassHz, (value) => onChange({ highPassHz: value }), 0.1)}
          </label>

          <label className="control-field">
            <span>Band low</span>
            {numberInput(
              filters.bandPassLowHz,
              (value) => onChange({ bandPassLowHz: value }),
              0.1
            )}
          </label>

          <label className="control-field">
            <span>Band high</span>
            {numberInput(
              filters.bandPassHighHz,
              (value) => onChange({ bandPassHighHz: value }),
              0.1
            )}
          </label>

          <label className="control-field">
            <span>Notch</span>
            {numberInput(filters.notchHz, (value) => onChange({ notchHz: value }), 1)}
          </label>
        </div>
      )}
    </div>
  );
}
