import { useId } from "react";
const InputWithLabel = ({ labelName, inputType, placeholder, inputValue, inputOnChange, inputOnBlur, inputError, inputName }) => {
    const id = useId();
    const hasError = inputError && inputError.length > 0;
    return (
        <div className="grid w-full">
            <label htmlFor={id} className="font-medium text-sm pb-1">{labelName}:</label>
            <input id={id} aria-invalid={Boolean(inputError)} aria-describedby={inputError ? `${id}-error` : undefined}
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
                <p id={`${id}-error`} role="alert" className="text-red-500 text-xs mt-1">{inputError}</p>
            )}
        </div>
    );
}
export default InputWithLabel;