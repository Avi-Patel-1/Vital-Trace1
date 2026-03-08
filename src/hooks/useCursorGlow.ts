import { useEffect, useState } from "react";

export function useCursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [viewport, setViewport] = useState({ width: 1, height: 1 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(media.matches);
    const updateViewport = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    updatePreference();
    updateViewport();
    media.addEventListener("change", updatePreference);
    window.addEventListener("resize", updateViewport);

    const onPointerMove = (event: PointerEvent) => {
      if (media.matches) {
        return;
      }
      setPosition({ x: event.clientX, y: event.clientY });
    };

    window.addEventListener("pointermove", onPointerMove);

    return () => {
      media.removeEventListener("change", updatePreference);
      window.removeEventListener("resize", updateViewport);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return {
    ...position,
    normalizedX: position.x / Math.max(viewport.width, 1),
    normalizedY: position.y / Math.max(viewport.height, 1),
    reducedMotion
  };
}
