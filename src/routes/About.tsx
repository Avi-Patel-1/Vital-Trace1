import { Reveal } from "../components/motion/Reveal";
import { SectionHeading } from "../components/layout/SectionHeading";

const useCases = [
  "Wearable sensing and motion artifact review",
  "Physiology teaching with sample recordings",
  "Signal cleanup and event inspection",
  "Human performance and exertion tracking",
  "General time-series exploration in the browser"
];

const notes = [
  "Processing stays focused on analysis support.",
  "Datasets, notes, and session state stay local in the browser.",
  "Exports are review summaries, not clinical interpretation."
];

export function About() {
  return (
    <div className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1500px] gap-16">
        <Reveal>
          <SectionHeading
            eyebrow="Use and scope"
            title="Where the studio fits."
            body="Vital Trace is built for signal review, filtering, detection, comparison, annotation, and report export in a browser-based workflow."
          />
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-2">
          <Reveal>
            <div className="panel-shell h-full">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Use cases
              </div>
              <div className="mt-6 space-y-3">
                {useCases.map((item) => (
                  <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/[0.58]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="panel-shell h-full">
              <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                Guardrails
              </div>
              <div className="mt-6 space-y-3">
                {notes.map((item) => (
                  <div key={item} className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-4 text-sm leading-6 text-white/[0.58]">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
