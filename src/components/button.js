const Buttons = ({ btnType, btnText, type, onClick }) => {
    return (
        <div>
            {
                btnType === "primary" ?
                    (
                        <button className="py-3 px-7 bg-brand rounded-md text-white font-semibold" type={type} onClick={onClick}>{btnText}</button>
                    )
                    :
                btnType === "light"?
                (
                    <button className="bg-brand px-6 py-4 md:py-3 text-sm text-white rounded-md" type={type} onClick={onClick}>{btnText}</button>
                )
                :
                ""
            }
        </div>
    );
}

export default Buttons;