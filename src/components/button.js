const Buttons = ({ btnType, btnText, type, onClick }) => {
    return (
        <div>
            {
                btnType === "primary" ?
                    (
                        <button className="py-3 px-7 bg-brand rounded-md text-white font-semibold" type={type} onClick={onClick}>{btnText}</button>
                    )
                    :
                    ""
            }
        </div>
    );
}

export default Buttons;