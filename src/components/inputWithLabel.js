import { useId, useState } from "react";
// `required` marks the field (a visual * plus aria-required) without the native
// `required` attribute, so the form's own messages still explain what is missing.
const InputWithLabel = ({ labelName, inputType, placeholder, inputValue, inputOnChange, inputOnBlur, inputError, inputName, required = false, autoComplete, maxLength, inputMode, hint }) => {
    const id = useId();
    const [revealed, setRevealed] = useState(false);
    const password = inputType === "password";
    const hasError = inputError && inputError.length > 0;
    return (
        <div className="grid w-full">
            <div className="pb-1 text-sm"><label htmlFor={id} className="font-medium">{labelName}:</label>{required && <span aria-hidden="true" className="text-red-700"> *</span>}</div>
            <div className="relative"><input id={id} aria-invalid={Boolean(inputError)} aria-describedby={[hint ? `${id}-hint` : "", inputError ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined}
                aria-required={required || undefined}
                autoComplete={autoComplete}
                maxLength={maxLength}
                inputMode={inputMode}
                type={password && revealed ? "text" : inputType}
                value={inputValue}
                name={inputName}
                onBlur={inputOnBlur}
                onChange={inputOnChange}
                className={`w-full p-3 text-sm rounded-md border bg-white text-slate-900 ${password ? "pr-14" : ""} placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand transition-colors ${
                    hasError ? "border-red-600 focus:outline-red-600" : "border-slate-400"
                }`}
                placeholder={placeholder}
            />
            {password && <button type="button" aria-label={`${revealed ? "Hide" : "Show"} ${labelName}`} aria-pressed={revealed} onClick={() => setRevealed(v => !v)} className="absolute right-1 top-1 flex h-10 w-10 items-center justify-center rounded text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-700">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>{revealed && <path d="m3 3 18 18"/>}</svg>
            </button>}</div>
            {hint && <p id={`${id}-hint`} className="text-xs text-black/55 mt-1">{hint}</p>}
            {hasError && (
                <p id={`${id}-error`} role="alert" className="text-red-700 text-xs mt-1">{inputError}</p>
            )}
        </div>
    );
}
export default InputWithLabel;