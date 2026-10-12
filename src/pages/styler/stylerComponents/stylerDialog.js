import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import closeIcon from "../../../assets/svg-icons/closeBlack.svg";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal for the stylist dashboard: role="dialog" with aria-modal,
 * named by its title, focus moved in on open and kept inside while open,
 * Escape and a labelled close button both close it, and focus goes back to
 * whatever opened it.
 *
 * Same visual frame as components/modals.js, which stays untouched for the
 * other areas of the site.
 */
const StylerDialog = ({ isVisible, onClose, title, children, width = "" }) => {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isVisible) return undefined;
    const opener = document.activeElement;
    const panel = panelRef.current;
    // First form control if there is one, else the panel itself.
    const first = panel?.querySelector("input, select, textarea") || panel?.querySelector(FOCUSABLE);
    (first || panel)?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      const items = Array.from(panel.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (opener && typeof opener.focus === "function" && document.contains(opener)) opener.focus();
    };
  }, [isVisible]);

  if (!isVisible) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 px-4 py-4 sm:py-6 flex items-start sm:items-center justify-center overflow-y-auto">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`bg-white rounded-md w-full max-h-[90%] overflow-y-auto ${width} my-auto focus:outline-none`}
      >
        <div className="sticky top-0 z-10 flex justify-between items-center py-4 px-6 border-b bg-white">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            onClick={() => onClose?.()}
            aria-label="Close"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
          >
            <img src={closeIcon} alt="" className="h-5" />
          </button>
        </div>
        <div className="px-6 py-8 grid gap-4">{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default StylerDialog;
