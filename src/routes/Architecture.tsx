import { Reveal } from "../components/motion/Reveal";
import { SectionHeading } from "../components/layout/SectionHeading";
import { architectureNotes } from "../store/useStudioStore";

const modules = [
  "Routes for the landing flow, studio workspace, review center, batch review, and synthetic lab",
  "Typed data models for recordings, channels, filters, metrics, annotations, and saved sessions",
  "Client-side filters, detection, FFT, spectrogram generation, signal quality review, and metric summaries",
  "Browser-side report export, chart image sets, notebook state, and timeline assembly",
  "Local session restore so review state, saved views, and notes persist across visits"
];

export function Architecture() {
  return (
    <div className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <SectionHeading
            eyebrow="Build"
            title="Typed analysis modules under a single front-end surface."
            body="The interface is split between a lighter landing flow and a denser studio route. Signal processing modules stay small and direct so the workflow is easy to inspect."
          />
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-[0.94fr_1.06fr]">
          <Reveal>
            <div className="panel-shell h-full">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Notes
              </div>
              <div className="mt-6 space-y-4">
                {architectureNotes.map((note) => (
                  <div key={note.title} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
                    <div className="text-base text-white">{note.title}</div>
                    <div className="mt-2 text-sm leading-6 text-white/[0.58]">{note.body}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="panel-shell h-full">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Module map
              </div>
              <div className="mt-6 space-y-3">
                {modules.map((module) => (
                  <div key={module} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/[0.58]">
                    {module}
                  </div>
                ))}
              </div>
              <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-black/20 p-5 font-mono text-sm leading-7 text-[#f3f4f4]">
                src/
                <br />
                ├─ routes/
                <br />
                ├─ components/
                <br />
                ├─ hooks/
                <br />
                ├─ lib/
                <br />
                ├─ store/
                <br />
                ├─ data/
                <br />
                └─ types/
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
