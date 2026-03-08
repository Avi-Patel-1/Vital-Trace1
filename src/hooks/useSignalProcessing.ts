import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildAnalysis } from "../lib/analysis/buildAnalysis";
import { useStudioStore } from "../store/useStudioStore";

export function useSignalProcessing() {
  const {
    datasets,
    currentDatasetId,
    comparisonDatasetId,
    activeChannelId,
    filters,
    selection,
    annotations,
    analystNotes
  } = useStudioStore(
    useShallow((state) => ({
      datasets: state.datasets,
      currentDatasetId: state.currentDatasetId,
      comparisonDatasetId: state.comparisonDatasetId,
      activeChannelId: state.activeChannelId,
      filters: state.filters,
      selection: state.selection,
      annotations: state.annotations,
      analystNotes: state.analystNotes
    }))
  );

  return useMemo(() => {
    const dataset =
      datasets.find((item) => item.id === currentDatasetId) ?? datasets[0];
    const comparisonDataset = comparisonDatasetId
      ? datasets.find((item) => item.id === comparisonDatasetId) ?? null
      : null;

    const primary = buildAnalysis(dataset, filters, activeChannelId, selection);
    const comparison = comparisonDataset
      ? buildAnalysis(
          comparisonDataset,
          filters,
          comparisonDataset.channels[0]?.id ?? null,
          comparisonDataset.defaultWindow ?? {
            start: 0,
            end: Math.min(selection.end - selection.start, comparisonDataset.durationSec)
          }
        )
      : null;

    return {
      primary,
      comparison,
      annotations: annotations[dataset.id] ?? [],
      analystNotes: analystNotes[dataset.id] ?? ""
    };
  }, [
    activeChannelId,
    analystNotes,
    annotations,
    comparisonDatasetId,
    currentDatasetId,
    datasets,
    filters,
    selection
  ]);
}
