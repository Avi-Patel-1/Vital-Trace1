import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";

import { buildSavedSession, useStudioStore } from "../store/useStudioStore";
import { SavedSession } from "../types/signal";

export const LOCAL_SESSION_STORAGE_KEY = "vital-trace-session";
export const LEGACY_LOCAL_SESSION_STORAGE_KEY = "biosignal-insight-studio-session";

function readStoredSession() {
  return (
    window.localStorage.getItem(LOCAL_SESSION_STORAGE_KEY) ??
    window.localStorage.getItem(LEGACY_LOCAL_SESSION_STORAGE_KEY)
  );
}

export function useLocalSessions() {
  const restoreSession = useStudioStore((state) => state.restoreSession);
  const [readyToPersist, setReadyToPersist] = useState(false);
  const state = useStudioStore(
    useShallow((store) => ({
      currentDatasetId: store.currentDatasetId,
      comparisonDatasetId: store.comparisonDatasetId,
      activeChannelId: store.activeChannelId,
      filters: store.filters,
      selection: store.selection,
      activeTab: store.activeTab,
      activePresetId: store.activePresetId,
      showRawOverlay: store.showRawOverlay,
      normalizeCompare: store.normalizeCompare,
      theme: store.theme,
      analystNotes: store.analystNotes,
      annotations: store.annotations,
      notebookEntries: store.notebookEntries,
      datasets: store.datasets,
      savedViews: store.savedViews,
      reportBuilder: store.reportBuilder,
      guidedReview: store.guidedReview,
      timelineStages: store.timelineStages
    }))
  );

  useEffect(() => {
    try {
      const raw = readStoredSession();
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as SavedSession;
      if (parsed.version === 1 || parsed.version === 2) {
        restoreSession(parsed);
      }
    } catch {
      window.localStorage.removeItem(LOCAL_SESSION_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_LOCAL_SESSION_STORAGE_KEY);
    } finally {
      setReadyToPersist(true);
    }
  }, [restoreSession]);

  useEffect(() => {
    if (!readyToPersist) {
      return;
    }
    const session = buildSavedSession();
    window.localStorage.setItem(LOCAL_SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [readyToPersist, state]);

  return {
    restoreRecentSession() {
      const raw = readStoredSession();
      if (!raw) {
        return false;
      }
      const parsed = JSON.parse(raw) as SavedSession;
      restoreSession(parsed);
      return true;
    }
  };
}
