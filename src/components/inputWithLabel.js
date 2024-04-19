const InputWithLabel = ({ labelName, inputType, placeholder, inputValue, inputOnChange,inputOnBlur,inputError, inputName }) => {
    return (
        <div className="grid w-full">
            <span className="font-medium text-sm pb-1">{labelName}:</span>
            <input type={inputType} value={inputValue} name={inputName} onBlur={inputOnBlur} onChange={inputOnChange} className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand" placeholder={placeholder} />
            <code className="text-red-500 text-xs">{inputError}</code>
        </div>
    )
}
export default InputWithLabel;