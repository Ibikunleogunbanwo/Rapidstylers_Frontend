const OtpInputs = ({ id, onChange }) => {
    const handleInputChange = (event) => {
        onChange(event.target)
    }
    return (
        <input type="text" required inputMode="numeric" name="" id={id} maxLength="1" onInput={handleInputChange} className="bg-gray-100 border-brand border-2 p-3 text-center font-bold rounded-lg focus:outline-primary input" />
    );
}
export default OtpInputs;