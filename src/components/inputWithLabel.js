const InputWithLabel = ({ labelName, inputType, placeholder, inputValue, inputOnChange, inputOnBlur, inputError, inputName }) => {
    const hasError = inputError && inputError.length > 0;
    return (
        <div className="grid w-full">
            <span className="font-medium text-sm pb-1">{labelName}:</span>
            <input
                type={inputType}
                value={inputValue}
                name={inputName}
                onBlur={inputOnBlur}
                onChange={inputOnChange}
                className={`w-full p-3 text-sm rounded-md border bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand transition-colors ${
                    hasError ? "border-red-400 focus:outline-red-400" : "border-[#c4c4c440]"
                }`}
                placeholder={placeholder}
            />
            {hasError && (
                <p className="text-red-500 text-xs mt-1">{inputError}</p>
            )}
        </div>
    );
}
export default InputWithLabel;