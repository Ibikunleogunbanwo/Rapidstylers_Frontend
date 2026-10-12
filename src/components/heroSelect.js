// The select names itself (selectName, or ariaLabel when given): it has no visible label.
const HeroSelect = ({selectOptions, valueKey, labelKey, selectValue, selectBlur, selectName, onChange, ariaLabel}) => {
    return (
        <div className="grid w-full md:w-2/3 text-black rounded-md border px-3 sm:px-5">
            <select
                aria-label={ariaLabel || selectName}
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