import { SectionHeading } from "../components/layout/SectionHeading";
import { Reveal } from "../components/motion/Reveal";
import { ReportPanel } from "../components/report/ReportPanel";
import { useSignalProcessing } from "../hooks/useSignalProcessing";
import { useStudioStore } from "../store/useStudioStore";

export function ReportPreview() {
  const { primary, annotations, analystNotes } = useSignalProcessing();
  const setAnalystNotes = useStudioStore((state) => state.setAnalystNotes);

  return (
    <div className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <SectionHeading
            eyebrow="Report preview"
            title="A summary built from the active signal window."
            body="Metrics, annotations, notes, and chart snapshots all come from the selected recording and range."
          />
        </Reveal>
        <div className="mt-12">
          <ReportPanel
            analysis={primary}
            metrics={primary.metrics}
            annotations={annotations}
            notes={analystNotes}
            onNotesChange={(notes) => setAnalystNotes(primary.dataset.id, notes)}
          />
        </div>
      </div>
    </div>
  );
}
