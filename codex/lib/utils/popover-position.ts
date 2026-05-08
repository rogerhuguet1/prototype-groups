export type Position = { top: number; left: number };

export function computePopoverPosition(
  triggerRect: DOMRect,
  popoverWidth: number,
  popoverHeight: number,
  margin = 8,
  gap = 4,
): Position {
  let top = triggerRect.bottom + gap;
  if (top + popoverHeight > window.innerHeight - margin) {
    const aboveTop = triggerRect.top - popoverHeight - gap;
    if (aboveTop >= margin) {
      top = aboveTop;
    } else {
      top = Math.max(margin, window.innerHeight - popoverHeight - margin);
    }
  }

  let left = triggerRect.left;
  if (left + popoverWidth > window.innerWidth - margin) {
    left = window.innerWidth - popoverWidth - margin;
  }
  if (left < margin) left = margin;

  return { top, left };
}
