const HeroSelect = ({selectOptions, valueKey, labelKey, selectValue, selectBlur, selectName, onChange}) => {
    return (
        <div className="grid w-full md:w-2/3 text-black rounded-md border px-3 sm:px-5">
            <select
                type="text"
                value={selectValue}
                onBlur={selectBlur}
                name={selectName}
                onChange={onChange}
                className="w-full py-3 sm:py-5 bg-white text-xs sm:text-sm border-transparent active:outline-0 focus:outline-none focus:ring-0 focus:border-transparent"
            >
                {
                    selectOptions.map((option) => (
                    <option key={option[valueKey]} value={option[valueKey]}>{option[labelKey]}</option>))
                }
            </select>
        </div>
    );
}
export default HeroSelect;