import closeIcon from "../assets/svg-icons/closeBlack.svg";
const Modal = ({ isVisible, onClose, modalTitle, children, width }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/60 px-4 py-4 sm:py-6 flex items-start sm:items-center justify-center overflow-y-auto">
                <div className={`bg-white rounded-md w-full ${width} my-auto`}>
                    <div className="flex justify-between items-center py-4 px-6 border-b ">
                        <span className="text-lg font-semibold">{modalTitle}</span>
                        <img src={closeIcon}  onClick={()=>onClose()} alt=""  className="h-5 cursor-pointer"/>
                    </div>
                    <div className="px-6 py-8 grid gap-4">
                       {children}
                    </div>
                </div>
        </div>
    );
}

export default Modal;