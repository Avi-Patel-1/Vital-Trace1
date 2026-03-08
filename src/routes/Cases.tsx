import { Link } from "react-router-dom";

import { SectionHeading } from "../components/layout/SectionHeading";
import { Reveal } from "../components/motion/Reveal";
import { caseStudies, demoDatasets, presetModes } from "../store/useStudioStore";

export function Cases() {
  return (
    <div className="px-4 pb-24 pt-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1500px]">
        <Reveal>
          <SectionHeading
            eyebrow="Signal library"
            title="Prepared signal views for fast review."
            body="Each entry opens a different modality with a tuned preset and starting window."
          />
        </Reveal>

        <div className="mt-12 grid gap-6">
          {caseStudies.map((caseStudy, index) => {
            const dataset = demoDatasets.find((item) => item.id === caseStudy.datasetId)!;
            return (
              <Reveal key={caseStudy.id} delay={index * 0.05}>
                <div className="grid gap-6 rounded-[2.2rem] border border-white/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 lg:grid-cols-[0.84fr_1.16fr] lg:p-8">
                  <div
                    className="rounded-[1.7rem] border border-white/10 p-6"
                    style={{
                      background: `radial-gradient(circle at 20% 22%, ${caseStudy.accent}44, transparent 30%), linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`
                    }}
                  >
                    <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.44]">
                      {caseStudy.strap}
                    </div>
                    <div className="mt-4 font-display text-4xl text-white">{caseStudy.title}</div>
                    <div className="mt-4 text-sm uppercase tracking-[0.24em] text-white/[0.38]">
                      {caseStudy.mood}
                    </div>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-[1fr_0.82fr]">
                    <div>
                      <p className="text-base leading-7 text-white/[0.62]">{caseStudy.summary}</p>
                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {dataset.tags.map((tag) => (
                          <div key={tag} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/[0.58]">
                            {tag}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[0.72rem] uppercase tracking-[0.24em] text-white/40">
                        Start here
                      </div>
                      <div className="mt-4 space-y-3">
                        {caseStudy.suggestedActions.map((action) => (
                          <div key={action} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/[0.58]">
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 flex flex-wrap gap-3">
                    <Link
                      to={`/studio?dataset=${dataset.id}&preset=${dataset.suggestedPresetId}`}
                      className="primary-button"
                    >
                      Open signal
                    </Link>
                    <Link to="/report-preview" className="chip-button">
                      View report
                    </Link>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>

        <Reveal delay={0.1}>
          <div className="mt-16">
            <SectionHeading
              eyebrow="Use case modes"
              title="Preset review directions for common tasks."
              body="Each mode shifts default filters, chart focus, and the next action path."
            />

            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {presetModes.map((preset) => (
                <div key={preset.id} className="section-shell p-5">
                  <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.4]">
                    {preset.signalTypes.join(" / ")}
                  </div>
                  <div className="mt-3 font-display text-2xl text-white">{preset.name}</div>
                  <div className="mt-3 text-sm leading-6 text-white/[0.58]">
                    {preset.shortDescription}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {preset.focus.map((item) => (
                      <div key={item} className="signal-badge">
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link to={`/studio?preset=${preset.id}`} className="primary-button">
                      Open mode
                    </Link>
                    <Link to={`/review?panel=summary`} className="chip-button">
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
