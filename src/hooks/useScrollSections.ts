import { useEffect, useMemo, useState } from "react";

export function useScrollSections(sectionIds: string[]) {
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const sectionKey = useMemo(() => sectionIds.join("|"), [sectionIds]);
  const stableSectionIds = useMemo(() => sectionIds, [sectionKey]);

  useEffect(() => {
    const update = () => {
      const next: Record<string, number> = {};

      stableSectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (!element) {
          next[id] = 0;
          return;
        }
        const rect = element.getBoundingClientRect();
        const total = rect.height + window.innerHeight;
        const covered = window.innerHeight - rect.top;
        next[id] = Math.max(0, Math.min(1, covered / Math.max(total, 1)));
      });

      setProgressById(next);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sectionKey, stableSectionIds]);

  return useMemo(
    () => ({
      progressById
    }),
    [progressById]
  );
}
