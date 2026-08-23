const HeroInput = ({inputType, placeholder, inputValue, inputOnChange,inputOnBlur, inputName }) => {
    return (
        <div className="grid w-full text-black">
          <input type={inputType} value={inputValue} name={inputName} onBlur={inputOnBlur} onChange={inputOnChange} className="w-full py-3 px-4 sm:py-5 sm:px-5 text-xs sm:text-sm rounded-md border active:outline-0 focus:outline-0" placeholder={placeholder} />
        </div>
    )
}
export default HeroInput;