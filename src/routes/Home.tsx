import { motion } from "framer-motion";
import { Link } from "react-router-dom";

import { CompareChart } from "../components/charts/CompareChart";
import { MiniMapNavigator } from "../components/charts/MiniMapNavigator";
import { SignalChart } from "../components/charts/SignalChart";
import { SectionHeading } from "../components/layout/SectionHeading";
import { Reveal } from "../components/motion/Reveal";
import { useScrollSections } from "../hooks/useScrollSections";
import { useSignalProcessing } from "../hooks/useSignalProcessing";
import { caseStudies } from "../store/useStudioStore";

const heroActions = [
  "Upload files",
  "Filter and detect",
  "Spectrum and compare",
  "Notes and export"
];

const flowSteps = [
  ["Raw", "Capture drift, motion, and baseline shift"],
  ["Clean", "Tune smoothing, notch, and band limits"],
  ["Detect", "Inspect peaks, intervals, and activity"],
  ["Measure", "Review window stats and band energy"],
  ["Export", "Save notes and PDF output"]
] as const;

export function Home() {
  const { progressById } = useScrollSections([
    "home-hero",
    "home-story",
    "home-cases",
    "home-preview"
  ]);
  const { primary, comparison } = useSignalProcessing();
  const heroProgress = progressById["home-hero"] ?? 0;
  const selectedDuration = primary.selectedRange.end - primary.selectedRange.start;

  return (
    <div className="pb-24">
      <section id="home-hero" className="relative min-h-[138vh] px-4 sm:px-6 lg:px-8">
        <div className="section-shell sticky top-24 mx-auto flex min-h-[calc(100vh-6.5rem)] max-w-[1500px] flex-col justify-between px-6 py-8 sm:px-10 lg:px-14 lg:py-12">
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_24%,rgba(240,138,167,0.16),transparent_26%),radial-gradient(circle_at_80%_22%,rgba(210,76,116,0.18),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))]" />
            <div
              className="absolute inset-x-0 top-12 h-[430px] opacity-80"
              style={{
                transform: `translate3d(calc((var(--cursor-rx) - 0.5) * 38px), ${heroProgress * 18}px, 0) scale(${1 + heroProgress * 0.05})`
              }}
            >
              <svg viewBox="0 0 1600 500" className="h-full w-full">
                {primary.processedChannels.slice(0, 3).map((channel, index) => {
                  const values = channel.filtered.slice(0, 900);
                  const min = Math.min(...values);
                  const max = Math.max(...values);
                  const spread = Math.max(max - min, 0.001);
                  const path = values
                    .filter((_, pointIndex) => pointIndex % 2 === 0)
                    .map((value, pointIndex) => {
                      const x = (pointIndex / Math.max(values.length / 2 - 1, 1)) * 1600;
                      const y = 90 + index * 118 + (1 - (value - min) / spread) * 70;
                      return `${pointIndex === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
                    })
                    .join(" ");

                  return (
                    <path
                      key={channel.id}
                      d={path}
                      fill="none"
                      stroke={channel.color}
                      strokeWidth={index === 0 ? 3.2 : 2.2}
                      opacity={0.86 - index * 0.16}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.92))]" />
          </div>

          <div className="relative z-10 grid gap-10 xl:grid-cols-[1.04fr_0.96fr] xl:items-end">
            <div>
              <div className="mb-8 flex flex-wrap items-center gap-3 text-[0.72rem] uppercase tracking-[0.34em] text-white/[0.44]">
                <span>ECG</span>
                <span className="h-1 w-1 rounded-full bg-white/[0.28]" />
                <span>EMG</span>
                <span className="h-1 w-1 rounded-full bg-white/[0.28]" />
                <span>PPG</span>
                <span className="h-1 w-1 rounded-full bg-white/[0.28]" />
                <span>Respiration</span>
              </div>

              <div className="max-w-[860px]">
                <motion.div
                  className="font-display text-[clamp(3.9rem,10vw,8.9rem)] leading-[0.9] text-white"
                  style={{
                    transform: `translate3d(0, ${heroProgress * -30}px, 0)`
                  }}
                >
                  Vital
                </motion.div>
                <motion.div
                  className="font-display text-[clamp(3.9rem,10vw,8.9rem)] leading-[0.9] text-[#d24c74]"
                  style={{
                    transform: `translate3d(${heroProgress * 38}px, ${heroProgress * 8}px, 0)`
                  }}
                >
                  Trace
                </motion.div>
              </div>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-white/[0.68] sm:text-xl">
                Upload traces. Filter noise. Inspect peaks. Compare windows. Mark regions.
                Export a report.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {heroActions.map((action) => (
                  <div key={action} className="signal-badge">
                    {action}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link to="/studio" className="primary-button">
                  Open studio
                </Link>
                <Link to="/review" className="chip-button">
                  Review center
                </Link>
                <Link to="/batch" className="chip-button">
                  Batch review
                </Link>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="panel-shell p-5 sm:p-6">
                <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                  Active signal
                </div>
                <div className="mt-3 text-3xl font-display text-white sm:text-4xl">
                  {primary.dataset.title}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div className="signal-badge">{primary.dataset.signalType}</div>
                  <div className="signal-badge">{primary.dataset.sampleRateHz} Hz</div>
                  <div className="signal-badge">{selectedDuration.toFixed(1)} s window</div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {primary.metrics.slice(0, 4).map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-[0.68rem] uppercase tracking-[0.2em] text-white/[0.42]">
                        {metric.label}
                      </div>
                      <div className="mt-3 text-2xl text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel-shell p-5 sm:p-6">
                <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                  Next in the flow
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    "Load a sample signal",
                    "Inspect waveform and peaks",
                    "Compare filtered and raw views",
                    "Mark regions and export"
                  ].map((line) => (
                    <div
                      key={line}
                      className="rounded-[1.3rem] border border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/[0.58]"
                    >
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="scroll-cue">
              <span>Scroll into signal flow</span>
              <span className="h-2 w-2 rounded-full bg-[#d24c74]" />
            </div>
            <div className="text-sm uppercase tracking-[0.24em] text-white/[0.36]">
              Raw to clean to detect to report
            </div>
          </div>
        </div>
      </section>

      <section id="home-story" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1500px] gap-12 lg:grid-cols-[0.76fr_1.24fr]">
          <Reveal>
            <div className="lg:sticky lg:top-28">
              <SectionHeading
                eyebrow="Signal flow"
                title="Raw trace in. Review layer out."
                body="Clean the active channel, detect events, inspect a window, then save notes or export."
              />
              <div className="mt-8 space-y-3">
                {flowSteps.map(([label, copy], index) => (
                  <div
                    key={label}
                    className="flex items-start gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.12] bg-white/[0.06] text-sm text-white/[0.68]">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm uppercase tracking-[0.22em] text-white/[0.44]">
                        {label}
                      </div>
                      <div className="mt-2 text-sm leading-6 text-white/[0.58]">{copy}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="section-shell p-4 sm:p-6">
              <div className="grid gap-6">
                <SignalChart
                  analysis={primary}
                  showRawOverlay
                  cursorTime={null}
                  annotations={[]}
                  onCursorChange={() => undefined}
                />
                <MiniMapNavigator
                  analysis={primary}
                  selection={primary.selectedRange}
                  onSelectionChange={() => undefined}
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <section id="home-cases" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1500px]">
          <Reveal>
            <SectionHeading
              eyebrow="Signal library"
              title="Open rhythm, burst, pulse, or breathing."
              body="Each view loads with a tuned window and a starting preset."
            />
          </Reveal>

          <div className="mt-12 grid gap-6 lg:grid-cols-5">
            {caseStudies.map((caseStudy, index) => (
              <Reveal key={caseStudy.id} delay={index * 0.06}>
                <Link
                  to={`/studio?dataset=${caseStudy.datasetId}`}
                  className="section-shell group block h-full p-5 transition hover:-translate-y-1"
                >
                  <div
                    className="mb-6 h-44 rounded-[1.4rem]"
                    style={{
                      background: `radial-gradient(circle at 25% 30%, ${caseStudy.accent}33, transparent 35%), linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))`
                    }}
                  >
                    <div className="flex h-full items-end p-4 text-[0.7rem] uppercase tracking-[0.28em] text-white/[0.46]">
                      {caseStudy.mood}
                    </div>
                  </div>
                  <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/40">
                    {caseStudy.strap}
                  </div>
                  <div className="mt-2 font-display text-2xl text-white">{caseStudy.title}</div>
                  <p className="mt-4 text-sm leading-6 text-white/[0.58]">{caseStudy.summary}</p>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="home-preview" className="px-4 py-24 sm:px-6 lg:px-8">
        <div className="section-shell mx-auto max-w-[1500px] p-6 sm:p-10">
          <Reveal>
            <SectionHeading
              eyebrow="Workspace"
              title="Waveform, spectrum, compare, notes."
              body="One selected window drives charts, markers, metrics, and report export."
            />
          </Reveal>

          <div className="mt-12 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
            <Reveal>
              <CompareChart primary={primary} comparison={comparison} normalize />
            </Reveal>
            <Reveal delay={0.08}>
              <div className="panel-shell flex h-full flex-col justify-between">
                <div>
                  <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/[0.38]">
                    Review window
                  </div>
                  <div className="mt-3 text-4xl font-display text-white">
                    {selectedDuration.toFixed(1)} second span
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/60 sm:text-base">
                    Brush a region, inspect peaks, compare spectra, then save notes or export.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {primary.metrics.slice(0, 4).map((metric) => (
                    <div
                      key={metric.id}
                      className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-4"
                    >
                      <div className="text-[0.68rem] uppercase tracking-[0.22em] text-white/[0.42]">
                        {metric.label}
                      </div>
                      <div className="mt-3 text-2xl text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex gap-3">
                  <Link to="/studio" className="primary-button">
                    Open studio
                  </Link>
                  <Link to="/reports" className="chip-button">
                    Build report
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 pt-10 sm:px-6 lg:px-8">
        <div className="section-shell mx-auto grid max-w-[1500px] gap-6 p-8 lg:grid-cols-[1.1fr_0.9fr] lg:p-10">
          <div>
            <div className="text-[0.72rem] uppercase tracking-[0.28em] text-white/40">
              Next
            </div>
            <div className="mt-4 font-display text-4xl text-white sm:text-5xl">
              Start with a signal.
            </div>
          </div>
          <div className="flex flex-col justify-between gap-4 text-white/[0.58]">
            <p className="text-base leading-7">
              Load a sample, bring your own file, or return to the last saved session state.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/studio" className="primary-button">
                Open studio
              </Link>
              <Link to="/review" className="chip-button">
                Open review
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
