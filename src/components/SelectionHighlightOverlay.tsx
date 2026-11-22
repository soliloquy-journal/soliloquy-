import React, { useEffect, useState } from 'react';

interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Renders soft, rounded botanical-sage highlight boxes behind active text selections.
 */
export const SelectionHighlightOverlay: React.FC = () => {
  const [rects, setRects] = useState<SelectionRect[]>([]);

  useEffect(() => {
    const updateSelection = () => {
      const sel = window.getSelection();
      const activeEl = document.activeElement;
      const isTextInput =
        activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;

      if (!sel || sel.isCollapsed || sel.rangeCount === 0 || isTextInput) {
        document.body.classList.remove('custom-selection-active');
        setRects((prev) => (prev.length === 0 ? prev : []));
        return;
      }

      const text = sel.toString();
      if (!text.length) {
        document.body.classList.remove('custom-selection-active');
        setRects((prev) => (prev.length === 0 ? prev : []));
        return;
      }

      const range = sel.getRangeAt(0);
      const clientRects = Array.from(range.getClientRects()).filter(
        (r) => r.width > 1 && r.height > 1
      );

      if (clientRects.length === 0) {
        document.body.classList.remove('custom-selection-active');
        setRects((prev) => (prev.length === 0 ? prev : []));
        return;
      }

      document.body.classList.add('custom-selection-active');
      setRects(
        clientRects.map((r) => ({
          left: r.left - 2,
          top: r.top - 1,
          width: r.width + 4,
          height: r.height + 2,
        }))
      );
    };

    document.addEventListener('selectionchange', updateSelection);
    window.addEventListener('scroll', updateSelection, true);
    window.addEventListener('resize', updateSelection);

    return () => {
      document.body.classList.remove('custom-selection-active');
      document.removeEventListener('selectionchange', updateSelection);
      window.removeEventListener('scroll', updateSelection, true);
      window.removeEventListener('resize', updateSelection);
    };
  }, []);

  if (rects.length === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[100] overflow-hidden"
    >
      {rects.map((r, idx) => (
        <div
          key={idx}
          style={{
            left: `${r.left}px`,
            top: `${r.top}px`,
            width: `${r.width}px`,
            height: `${r.height}px`,
          }}
          className="fixed rounded-[7px] bg-[#1E4D3B]/15 dark:bg-[#6EE7B7]/20 border border-[#1E4D3B]/25 dark:border-[#6EE7B7]/35"
        />
      ))}
    </div>
  );
};
