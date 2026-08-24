const Buttons = ({ btnType, btnText, type, onClick, disabled }) => {
    return (
        <div>
            {
                btnType === "primary" ?
                    (
                        <button
                            className={`py-3 px-5 sm:py-5 sm:px-7 rounded-md text-xs sm:text-sm text-white font-medium transition-opacity ${
                                disabled ? "bg-brand/60 cursor-not-allowed" : "bg-brand"
                            }`}
                            type={type}
                            onClick={onClick}
                            disabled={disabled}
                        >
                            {btnText}
                        </button>
                    )
                    :
                btnType === "light"?
                (
                    <button
                        className={`px-6 py-4 md:py-5 text-sm text-white rounded-md transition-opacity ${
                            disabled ? "bg-brand/60 cursor-not-allowed" : "bg-brand"
                        }`}
                        type={type}
                        onClick={onClick}
                        disabled={disabled}
                    >
                        {btnText}
                    </button>
                )
                :
                ""
            }
        </div>
    );
}

export default Buttons;