import { createPortal } from "react-dom";
import closeIcon from "../assets/svg-icons/closeBlack.svg";

/**
 * Reusable modal. Renders through a portal directly under <body> so
 * `position: fixed` always anchors to the real viewport — ancestors with
 * backdrop-filter/transform/filter would otherwise hijack fixed positioning
 * and push the overlay off-screen.
 *
 * Props:
 *   isVisible   – render nothing when false
 *   onClose     – called by the header close button
 *   modalTitle  – header text
 *   children    – dialog body
 *   width       – extra Tailwind width classes for the card (e.g. "md:w-1/2")
 */
const Modal = ({ isVisible, onClose, modalTitle, children, width }) => {
    if (!isVisible) return null;
    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 px-4 py-4 sm:py-6 flex items-start sm:items-center justify-center overflow-y-auto">
                <div className={`bg-white rounded-md w-full max-h-[90%] overflow-y-auto ${width} my-auto`}>
                    <div className="sticky top-0 z-10 flex justify-between items-center py-4 px-6 border-b bg-white">
                        <span className="text-lg font-semibold">{modalTitle}</span>
                        <img src={closeIcon} onClick={() => onClose?.()} alt="Close" className="h-5 cursor-pointer" />
                    </div>
                    <div className="px-6 py-8 grid gap-4">
                       {children}
                    </div>
                </div>
        </div>,
        document.body
    );
}

export default Modal;
