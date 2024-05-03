const HeroInput = ({inputType, placeholder, inputValue, inputOnChange,inputOnBlur, inputName }) => {
    return (
        <div className="grid w-full text-black">
          <input type={inputType} value={inputValue} name={inputName} onBlur={inputOnBlur} onChange={inputOnChange} className="w-full p-3 text-sm rounded-md border border-[#c4c4c424] bg-[#c4c4c460] active:outline-0 focus:outline-brand" placeholder={placeholder} />
        </div>
    )
}
export default HeroInput;