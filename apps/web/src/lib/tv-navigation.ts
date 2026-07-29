export type TvDirection = "up" | "down" | "left" | "right";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  "[tabindex]:not([tabindex='-1'])",
  "[role='button']:not([aria-disabled='true'])",
  "[role='link']:not([aria-disabled='true'])",
  "[role='menuitem']:not([aria-disabled='true'])",
  "[role='option']:not([aria-disabled='true'])",
  "[role='tab']:not([aria-disabled='true'])",
].join(", ");

const EDITABLE_SELECTOR =
  "input:not([type='button']):not([type='submit']):not([type='reset']):not([type='checkbox']):not([type='radio']):not([type='range']):not([type='color']):not([type='file']), textarea, [contenteditable='true']";

const NATIVE_ACTIVATION_SELECTOR = "a[href], button, input, select, textarea, summary, label";

export function isEditableElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return target.matches(EDITABLE_SELECTOR);
}

export function isSliderElement(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(target.closest("input[type='range'], [role='slider']"));
}

export function isNativelyActivatable(element: HTMLElement): boolean {
  return element.matches(NATIVE_ACTIVATION_SELECTOR);
}

function isVisible(element: HTMLElement): boolean {
  if (element.getClientRects().length === 0) return false;
  if (element.closest("[aria-hidden='true'], [hidden]")) return false;
  const style = window.getComputedStyle(element);
  return style.visibility !== "hidden" && style.display !== "none";
}

export function getFocusScope(): ParentNode {
  const dialogs = document.querySelectorAll<HTMLElement>("[role='dialog']");
  if (dialogs.length > 0) return dialogs[dialogs.length - 1];
  return document.body;
}

export function getFocusableElements(scope: ParentNode): HTMLElement[] {
  const elements = Array.from(scope.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return elements.filter(isVisible);
}

function rectCenter(rect: DOMRect): { x: number; y: number } {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

function isInDirection(
  from: { x: number; y: number },
  to: { x: number; y: number },
  direction: TvDirection,
): boolean {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (direction === "left") return dx < -1;
  if (direction === "right") return dx > 1;
  if (direction === "up") return dy < -1;
  return dy > 1;
}

function directionScore(
  from: { x: number; y: number },
  to: { x: number; y: number },
  direction: TvDirection,
): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (direction === "left" || direction === "right") {
    return Math.abs(dx) + Math.abs(dy) * 3;
  }
  return Math.abs(dy) + Math.abs(dx) * 3;
}

export function findNextFocusTarget(
  current: HTMLElement | null,
  candidates: HTMLElement[],
  direction: TvDirection,
): HTMLElement | null {
  const others = candidates.filter((element) => element !== current);
  if (others.length === 0) return null;

  if (!current || !candidates.includes(current)) {
    return others.reduce((best, element) => {
      const bestRect = best.getBoundingClientRect();
      const rect = element.getBoundingClientRect();
      if (rect.top < bestRect.top - 1) return element;
      if (rect.top < bestRect.top + 1 && rect.left < bestRect.left) return element;
      return best;
    });
  }

  const fromCenter = rectCenter(current.getBoundingClientRect());
  let best: HTMLElement | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of others) {
    const toCenter = rectCenter(candidate.getBoundingClientRect());
    if (!isInDirection(fromCenter, toCenter, direction)) continue;
    const score = directionScore(fromCenter, toCenter, direction);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}
