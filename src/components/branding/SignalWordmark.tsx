import { motion } from "framer-motion";

interface SignalWordmarkProps {
  compact?: boolean;
}

export function SignalWordmark({ compact = false }: SignalWordmarkProps) {
  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative h-10 w-10 overflow-hidden rounded-[1.1rem] border border-white/[0.15] bg-white/5 shadow-[0_18px_40px_rgba(7,13,19,0.34)]"
        whileHover={{ rotate: -6, scale: 1.03 }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(210,76,116,0.34),transparent_48%),radial-gradient(circle_at_74%_72%,rgba(255,255,255,0.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.02))]" />
        <svg
          viewBox="0 0 100 100"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d="M8 53h16l6-18 8 34 10-52 11 49 8-21h20"
            fill="none"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.div>
      <div className="leading-none">
        <div className="font-display text-[0.7rem] uppercase tracking-[0.34em] text-white/[0.48]">
          Signal in Motion
        </div>
        <div className={compact ? "font-display text-lg text-white" : "font-display text-xl text-white"}>
          Vital Trace
        </div>
      </div>
    </div>
  );
}
