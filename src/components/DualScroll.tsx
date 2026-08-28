import { ReactNode, useEffect, useRef, useState } from "react";

/**
 * Envolve tabelas largas exibindo uma barra de rolagem horizontal
 * sincronizada no topo (logo abaixo do cabeçalho) e na base.
 */
export function DualScroll({ children }: { children: ReactNode }) {
  const topRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);

  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom) return;

    const update = () => setContentWidth(bottom.scrollWidth);
    update();

    const ro = new ResizeObserver(update);
    ro.observe(bottom);
    Array.from(bottom.children).forEach((child) => ro.observe(child));
    return () => ro.disconnect();
  }, []);

  const syncFrom = (origem: "top" | "bottom") => () => {
    const top = topRef.current;
    const bottom = bottomRef.current;
    if (!top || !bottom) return;
    if (origem === "top") {
      if (bottom.scrollLeft !== top.scrollLeft) bottom.scrollLeft = top.scrollLeft;
    } else {
      if (top.scrollLeft !== bottom.scrollLeft) top.scrollLeft = bottom.scrollLeft;
    }
  };

  return (
    <div className="w-full">
      <div
        ref={topRef}
        onScroll={syncFrom("top")}
        aria-hidden
        className="mb-1 overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "thin" }}
      >
        <div style={{ width: contentWidth, height: 1 }} />
      </div>
      <div ref={bottomRef} onScroll={syncFrom("bottom")} className="overflow-x-auto">
        {children}
      </div>
    </div>
  );
}
