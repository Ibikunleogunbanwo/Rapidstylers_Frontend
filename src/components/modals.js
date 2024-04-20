import closeIcon from "../assets/svg-icons/closeBlack.svg";
const Modal = ({ isVisible, onClose, modalTitle, children, width }) => {
    if (!isVisible) return null;
    return (
        <div className="fixed bg-black/60 h-screen w-full px-4 flex items-center justify-center">
                <div className={`bg-white rounded-md w-full ${width}`}>
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