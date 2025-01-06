const HeroSelect = ({selectOptions, valueKey, labelKey, selectValue, selectBlur, selectName, onChange}) => {
    return (
        <div className="grid w-full md:w-2/3 text-black rounded-md border px-5">
            <select type="text" value={selectValue} onBlur={selectBlur} name={selectName} onChange={onChange}  className="w-full py-5 bg-white text-sm border-[#c4c4c460] active:outline-0 focus:outline-0">
                {
                    selectOptions.map((option) => (
                    <option key={option[valueKey]} value={option[valueKey]}>{option[labelKey]} </option>))
                }
            </select>
        </div>
    );
}
export default HeroSelect;