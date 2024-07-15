
import close from "../assets/svg-icons/closeBlack.svg";
const GeneralModal = ({ isVisible, onClose, modalTitle, children }) => {
    if (!isVisible) return null;
    return (
        <div
            className="fixed w-full h-[100vh] top-0 bottom-0 left-0 right-0"
        >
            <div className="bg-black/50 h-full w-full px-4 flex justify-center items-center">
                <div className="bg-white relative w-full md:w-[40%] lg:w-[35%] rounded-md border max-h-[60%] md:max-h-[80%] overflow-y-scroll">
                    <div className="border-b sticky top-0 bg-white flex justify-between items-center px-6 py-5">
                        <p className="font-semibold">{modalTitle}</p>
                        <img
                            src={close}
                            alt=""
                            className="h-6 cursor-pointer"
                            onClick={() => onClose()}
                        />
                    </div>
                    <div className="px-6 py-5 grid text-sm w-full">
                        {children}

                    </div>
                </div>
            </div>
        </div>
    );
}

export default GeneralModal;