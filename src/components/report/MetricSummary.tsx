import { MetricCard } from "../../types/signal";

interface MetricSummaryProps {
  metrics: MetricCard[];
}

export function MetricSummary({ metrics }: MetricSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {metrics.map((metric) => (
        <div key={metric.id} className="rounded-[1.3rem] border border-white/10 bg-white/[0.04] p-4">
          <div className="text-[0.7rem] uppercase tracking-[0.24em] text-white/40">
            {metric.label}
          </div>
          <div className="mt-3 text-2xl text-white">{metric.value}</div>
          {metric.note && <div className="mt-2 text-sm text-white/[0.52]">{metric.note}</div>}
        </div>
      ))}
    </div>
  );
}
