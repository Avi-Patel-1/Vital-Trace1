import { useEffect, useState } from "react";

import { parseSignalFile } from "../../lib/parsing/parseSignalFile";
import { ParsedUpload, SignalType } from "../../types/signal";

interface UploadPanelProps {
  pendingUpload: ParsedUpload | null;
  onPendingUpload: (upload: ParsedUpload | null) => void;
  onImport: (options: {
    title: string;
    signalType: SignalType;
    timeColumn: number | null;
    selectedColumns: number[];
    sampleRateHz: number;
  }) => void;
}

const signalTypeOptions: SignalType[] = [
  "ecg",
  "emg",
  "ppg",
  "respiration",
  "generic",
  "motion",
  "synthetic"
];

export function UploadPanel({
  pendingUpload,
  onPendingUpload,
  onImport
}: UploadPanelProps) {
  const [title, setTitle] = useState("Imported recording");
  const [signalType, setSignalType] = useState<SignalType>("generic");
  const [sampleRateHz, setSampleRateHz] = useState(100);
  const [timeColumn, setTimeColumn] = useState<number | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<number[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingUpload) {
      return;
    }
    setTitle(pendingUpload.fileName.replace(/\.[^.]+$/, ""));
    setSignalType(pendingUpload.signalTypeGuess);
    setSampleRateHz(Math.round(pendingUpload.inferredSampleRateHz));
    setTimeColumn(pendingUpload.inferredTimeColumn);
    setSelectedColumns(
      pendingUpload.numericColumns.filter((column) => column !== pendingUpload.inferredTimeColumn)
    );
  }, [pendingUpload]);

  return (
    <div id="studio-upload-panel" className="panel-shell space-y-5">
      <div>
        <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
          Upload
        </div>
        <div className="mt-2 text-lg text-white">Bring in your own recording</div>
      </div>

      <label className="upload-dropzone">
        <input
          type="file"
          className="hidden"
          accept=".csv,.txt,.json"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) {
              return;
            }

            try {
              const parsed = await parseSignalFile(file);
              onPendingUpload(parsed);
              setStatus(`Parsed ${file.name}`);
            } catch (error) {
              setStatus(error instanceof Error ? error.message : "Unable to parse file");
            }
          }}
        />
        <span className="text-sm uppercase tracking-[0.24em] text-white/[0.42]">
          Drop a file or browse
        </span>
        <span className="mt-3 block text-base text-white/[0.74]">
          Time column, channels, and sample rate are inferred first.
        </span>
      </label>

      {status && <div className="text-sm text-white/[0.58]">{status}</div>}

      {pendingUpload && (
        <div className="space-y-4 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="control-field">
              <span>Dataset title</span>
              <input
                className="control-input"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
            </label>
            <label className="control-field">
              <span>Signal type</span>
              <select
                className="control-input"
                value={signalType}
                onChange={(event) => setSignalType(event.target.value as SignalType)}
              >
                {signalTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="control-field">
              <span>Sample rate (Hz)</span>
              <input
                className="control-input"
                type="number"
                value={sampleRateHz}
                onChange={(event) => setSampleRateHz(Number(event.target.value))}
              />
            </label>
            <label className="control-field">
              <span>Time column</span>
              <select
                className="control-input"
                value={timeColumn ?? ""}
                onChange={(event) =>
                  setTimeColumn(
                    event.target.value === "" ? null : Number(event.target.value)
                  )
                }
              >
                <option value="">Generate from sample rate</option>
                {pendingUpload.headers.map((header, index) => (
                  <option key={header} value={index}>
                    {header}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div>
            <div className="mb-2 text-sm uppercase tracking-[0.22em] text-white/[0.42]">
              Channel map
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {pendingUpload.numericColumns.map((column) => (
                <label key={column} className="toggle-field">
                  <input
                    type="checkbox"
                    checked={selectedColumns.includes(column)}
                    disabled={column === timeColumn}
                    onChange={(event) => {
                      setSelectedColumns((current) =>
                        event.target.checked
                          ? [...current, column]
                          : current.filter((value) => value !== column)
                      );
                    }}
                  />
                  <span>{pendingUpload.headers[column]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="primary-button"
              onClick={() =>
                onImport({
                  title,
                  signalType,
                  timeColumn,
                  selectedColumns,
                  sampleRateHz
                })
              }
            >
              Load into studio
            </button>
            <button className="chip-button" onClick={() => onPendingUpload(null)}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
