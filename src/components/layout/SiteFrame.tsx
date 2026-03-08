import type { CSSProperties, ReactNode } from "react";
import { useEffect } from "react";

import { useCursorGlow } from "../../hooks/useCursorGlow";
import { useStudioStore } from "../../store/useStudioStore";
import { TopNav } from "./TopNav";

interface SiteFrameProps {
  children: ReactNode;
}

export function SiteFrame({ children }: SiteFrameProps) {
  const theme = useStudioStore((state) => state.theme);
  const { x, y, normalizedX, normalizedY, reducedMotion } = useCursorGlow();

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <div
      className="min-h-screen overflow-x-clip text-white"
      style={
        {
          "--cursor-x": `${x}px`,
          "--cursor-y": `${y}px`,
          "--cursor-rx": normalizedX.toFixed(3),
          "--cursor-ry": normalizedY.toFixed(3)
        } as CSSProperties
      }
    >
      <div
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: reducedMotion ? 0.32 : 0.72,
          background: `radial-gradient(520px at ${x}px ${y}px, rgba(210,76,116,0.22), transparent 58%)`
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.08), transparent 28%), radial-gradient(circle at 18% 16%, rgba(210,76,116,0.18), transparent 24%), radial-gradient(circle at 82% 18%, rgba(240,138,167,0.12), transparent 28%), linear-gradient(180deg, #000000, #05070a 38%, #081018)"
        }}
      />
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: reducedMotion
            ? "none"
            : `translate3d(${(normalizedX - 0.5) * 14}px, ${(normalizedY - 0.5) * 10}px, 0)`
        }}
      />
      <div className="pointer-events-none fixed inset-0 z-0 signal-field opacity-80" />
      <div className="pointer-events-none fixed inset-0 z-0 signal-lines opacity-55" />
      <TopNav />
      <main className="relative z-10">{children}</main>
    </div>
  );
}
