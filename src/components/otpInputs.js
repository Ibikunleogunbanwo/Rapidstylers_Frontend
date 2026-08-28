// Controlled single-digit OTP box. The digit lives in React state (via the
// `value` prop) rather than the raw DOM, so it is always re-rendered visibly
// and can never be wiped or hidden by a re-render. The explicit text color
// guarantees the digit is dark on every browser/OS regardless of defaults.
const OtpInputs = ({ id, value, onChange, onKeyDown, onPaste, inputRef }) => {
    return (
        <input
            type="text"
            required
            inputMode="numeric"
            name={id}
            id={id}
            maxLength="1"
            value={value || ""}
            onChange={onChange}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            ref={inputRef}
            className="bg-gray-100 border-brand border-2 p-3 text-center font-bold rounded-lg focus:outline-primary text-gray-900 caret-brand"
            aria-label={`Code digit ${id.replace(/[^0-9]/g, "")}`}
        />
    );
}
export default OtpInputs;
