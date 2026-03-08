import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { BatchReviewPanel } from "../components/review/BatchReviewPanel";
import { buildDatasetFromUpload, parseSignalFile } from "../lib/parsing/parseSignalFile";
import { useReviewWorkflow } from "../hooks/useReviewWorkflow";
import { useStudioStore } from "../store/useStudioStore";

export function Batch() {
  const navigate = useNavigate();
  const { batchRows, batchSummary } = useReviewWorkflow();
  const addDataset = useStudioStore((state) => state.addDataset);
  const loadDataset = useStudioStore((state) => state.loadDataset);
  const setComparisonDataset = useStudioStore((state) => state.setComparisonDataset);
  const [status, setStatus] = useState<string | null>(null);

  return (
    <div className="px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="section-shell p-6 sm:p-8">
          <div className="relative z-10 grid gap-6 xl:grid-cols-[1.02fr_0.98fr] xl:items-end">
            <div>
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Batch review
              </div>
              <h1 className="mt-3 font-display text-4xl text-white sm:text-5xl">
                Scan a cohort before you dive deeper
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-6 text-white/[0.62] sm:text-base">
                Bring in multiple recordings, sort by quality or rate, flag outliers, then send a pair to compare.
              </p>
            </div>

            <div className="panel-shell">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Multi-file import
              </div>
              <label className="upload-dropzone mt-4">
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.txt,.json"
                  multiple
                  onChange={async (event) => {
                    const files = Array.from(event.target.files ?? []);
                    if (!files.length) {
                      return;
                    }

                    try {
                      for (const file of files) {
                        const parsed = await parseSignalFile(file);
                        const dataset = buildDatasetFromUpload(parsed, {
                          title: file.name.replace(/\.[^.]+$/, ""),
                          signalType: parsed.signalTypeGuess,
                          timeColumn: parsed.inferredTimeColumn,
                          selectedColumns: parsed.numericColumns.filter(
                            (column) => column !== parsed.inferredTimeColumn
                          ),
                          sampleRateHz: Math.round(parsed.inferredSampleRateHz)
                        });
                        addDataset(dataset, { setCurrent: false });
                      }
                      setStatus(`Imported ${files.length} recording${files.length === 1 ? "" : "s"}.`);
                    } catch (error) {
                      setStatus(error instanceof Error ? error.message : "Unable to import files.");
                    }
                  }}
                />
                <span className="text-sm uppercase tracking-[0.24em] text-white/[0.42]">
                  Add multiple files
                </span>
                <span className="mt-3 block text-base text-white/[0.74]">
                  CSV, TXT, or JSON. Each file is parsed and added to the batch list.
                </span>
              </label>
              {status && <div className="mt-3 text-sm text-white/[0.56]">{status}</div>}
            </div>
          </div>
        </div>

        <BatchReviewPanel
          rows={batchRows}
          summary={batchSummary}
          onOpenDataset={(datasetId) => {
            loadDataset(datasetId);
            navigate("/studio");
          }}
          onComparePair={(primaryId, comparisonId) => {
            loadDataset(primaryId);
            setComparisonDataset(comparisonId);
            navigate("/review?panel=compare");
          }}
        />
      </div>
    </div>
  );
}
