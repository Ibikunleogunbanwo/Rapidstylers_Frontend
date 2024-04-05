const OtpInputs = ({ id, onChange }) => {
    const handleInputChange = (event) => {
        onChange(event.target)
    }
    return (
        <input type="text" required inputMode="numeric" name="" id={id} maxLength="1" onInput={handleInputChange} className="bg-brand p-4 text-center font-bold rounded-lg focus:outline-primary input" />
    );
}
export default OtpInputs;