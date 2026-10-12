import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import closeIcon from "../assets/svg-icons/closeBlack.svg";

/**
 * One accessible dialog for the whole site.
 *
 * Every modal used to be a plain fixed <div>: screen readers were not told a
 * dialog had opened, Escape did nothing, Tab walked out of the dialog into the
 * page behind it, and the × was an <img> with no name. This wrapper gives any
 * modal those behaviours without changing how it looks:
 *
 *   - role="dialog" + aria-modal, named by `labelledBy` (an element id) or `label`
 *   - focus moves into the dialog when it opens and back to where it was when it
 *     closes
 *   - Tab and Shift+Tab stay inside the dialog
 *   - Escape calls `onClose`
 *
 * The caller keeps its own markup: `overlayClassName` styles the backdrop and
 * `className` the panel. `keepMounted` hides a closed dialog instead of
 * unmounting it, for dialogs whose state must survive being closed (the booking
 * form keeps the chosen slot). `portal` renders under <body>, which keeps a
 * fixed overlay anchored to the viewport inside transformed ancestors.
 */
const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const focusableIn = (root) =>
  root
    ? [...root.querySelectorAll(FOCUSABLE)].filter(
        (el) => !el.closest("[hidden]") && !el.closest(".hidden") && el.getAttribute("aria-hidden") !== "true"
      )
    : [];

export const useDialogFocus = (open, panelRef, onClose) => {
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const panel = panelRef.current;
    const previous = document.activeElement;
    // Autofocus inside the dialog wins; otherwise the first control, otherwise the panel.
    if (panel && !panel.contains(document.activeElement)) {
      const target = panel.querySelector("[autofocus], [data-autofocus]") || focusableIn(panel)[0] || panel;
      target.focus?.();
    }
    const onKeyDown = (event) => {
      if (!panel) return;
      if (event.key === "Escape" || event.key === "Esc") {
        event.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusableIn(panel);
      if (items.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    panel?.addEventListener("keydown", onKeyDown);
    return () => {
      panel?.removeEventListener("keydown", onKeyDown);
      if (previous && typeof previous.focus === "function" && document.contains(previous)) previous.focus();
    };
  }, [open, panelRef]);
};

/** The × button every dialog uses: a real button with an accessible name. */
export const DialogCloseButton = ({ onClick, label = "Close", className = "", iconClassName = "h-5 w-5" }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${className}`}
  >
    <img src={closeIcon} alt="" aria-hidden="true" className={iconClassName} />
  </button>
);

const AccessibleDialog = ({
  open,
  onClose,
  labelledBy,
  label,
  describedBy,
  className = "",
  overlayClassName = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4",
  keepMounted = false,
  portal = false,
  closeOnOverlayClick = false,
  children,
}) => {
  const panelRef = useRef(null);
  useDialogFocus(open, panelRef, onClose);
  if (!open && !keepMounted) return null;
  const dialog = (
    <div
      className={`${overlayClassName} ${open ? "" : "hidden"}`}
      hidden={!open}
      onMouseDown={closeOnOverlayClick ? (event) => event.target === event.currentTarget && onClose?.() : undefined}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`focus:outline-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
  return portal ? createPortal(dialog, document.body) : dialog;
};

/**
 * The site's titled modal (header with title and ×, padded body), built on the
 * accessible dialog. Same props as components/modals.js, so a caller can switch
 * by changing the import.
 */
export const AccessibleModal = ({ isVisible, onClose, modalTitle, children, width = "" }) => {
  const titleId = useId();
  return (
    <AccessibleDialog
      open={isVisible}
      onClose={onClose}
      labelledBy={titleId}
      portal
      overlayClassName="fixed inset-0 z-50 bg-black/60 px-4 py-4 sm:py-6 flex items-start sm:items-center justify-center overflow-y-auto"
      className={`bg-white rounded-md w-full max-h-[90%] overflow-y-auto ${width} my-auto`}
    >
      <div className="sticky top-0 z-10 flex justify-between items-center py-3 px-6 border-b bg-white">
        <h2 id={titleId} className="text-lg font-semibold">{modalTitle}</h2>
        <DialogCloseButton onClick={() => onClose?.()} />
      </div>
      <div className="px-6 py-8 grid gap-4">{children}</div>
    </AccessibleDialog>
  );
};

export default AccessibleDialog;
