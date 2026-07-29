import { useEffect } from "react";
import {
  findNextFocusTarget,
  getFocusableElements,
  getFocusScope,
  isEditableElement,
  isNativelyActivatable,
  isSliderElement,
  type TvDirection,
} from "../lib/tv-navigation";

const ARROW_KEY_DIRECTION: Record<string, TvDirection> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

export function useTvNavigation() {
  useEffect(() => {
    function focusElement(element: HTMLElement) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
    }

    function handleArrow(event: KeyboardEvent, direction: TvDirection) {
      if (isEditableElement(event.target) || isSliderElement(event.target)) return;
      if (direction === "up" || direction === "down") {
        if (window.location.pathname === "/shorts") return;
      }
      const scope = getFocusScope();
      const candidates = getFocusableElements(scope);
      if (candidates.length === 0) return;
      const current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const next = findNextFocusTarget(current, candidates, direction);
      if (!next) return;
      event.preventDefault();
      focusElement(next);
    }

    function handleEnter(event: KeyboardEvent) {
      if (isEditableElement(event.target)) return;
      if (!(event.target instanceof HTMLElement)) return;
      if (isNativelyActivatable(event.target)) return;
      event.preventDefault();
      event.target.click();
    }

    function handleBackspace(event: KeyboardEvent) {
      if (isEditableElement(event.target)) return;
      event.preventDefault();
      const dialog = document.querySelector("[role='dialog']");
      if (dialog) {
        window.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true, cancelable: true }),
        );
        return;
      }
      window.history.back();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const direction = ARROW_KEY_DIRECTION[event.key];
      if (direction) {
        handleArrow(event, direction);
        return;
      }
      if (event.key === "Enter") {
        if (event.repeat) return;
        handleEnter(event);
        return;
      }
      if (event.key === "Backspace") {
        handleBackspace(event);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
