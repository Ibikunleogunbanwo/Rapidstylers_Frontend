const HeroSelect = ({selectOptions, valueKey, labelKey, selectValue, selectBlur, selectName, onChange}) => {
    return (
        <div className="grid w-full md:w-1/2 text-black">
            <select type="text" value={selectValue} onBlur={selectBlur} name={selectName} onChange={onChange}  className="w-full p-3 text-sm rounded-md border border-[#c4c4c460] bg-[#c4c4c424] active:outline-0 focus:outline-brand ">
                {
                    selectOptions.map((option) => (
                        <option key={option[valueKey]} value={option[valueKey]}>{option[labelKey]} </option>))
                }
            </select>
        </div>
    );
}
export default HeroSelect;