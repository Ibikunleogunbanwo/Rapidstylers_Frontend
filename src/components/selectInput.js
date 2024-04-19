const SelectInput = ({ labelName, selectOptions, valueKey, labelKey, selectError, selectValue, selectBlur, selectName, onChange}) => {
    return (
        <div className="grid">
            <span className="text-sm font-medium">{labelName}:</span>
            <select type="text" value={selectValue} onBlur={selectBlur} name={selectName} onChange={onChange}  className="w-full py-[13px] px-3 text-sm  rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-brand ">
                <option value="" disabled selected defaultValue>Select a {labelName}</option>
                {
                    selectOptions.map((option) => (
                        <option key={option[valueKey]} value={option[valueKey]}>{option[labelKey]} </option>))
                }
            </select>
            <code className="text-red-500 text-xs">{selectError}</code>
        </div>
    );
}
export default SelectInput;