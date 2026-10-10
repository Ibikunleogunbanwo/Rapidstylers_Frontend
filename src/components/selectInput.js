import { useId } from "react";
const SelectInput = ({ labelName, selectOptions, valueKey, labelKey, selectError, selectValue, selectBlur, selectName, onChange}) => {
    const id = useId();
    const errorId = `${id}-error`;
    return (
        <div className="grid">
            <label htmlFor={id} className="text-sm font-medium">{labelName}:</label>
            <select id={id} aria-invalid={Boolean(selectError)} aria-describedby={selectError ? errorId : undefined} defaultValue={selectValue === undefined ? "" : undefined} value={selectValue} onBlur={selectBlur} name={selectName} onChange={onChange}  className="w-full py-[13px] px-3 text-sm  rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-brand ">
                <option value="" disabled>Select a {labelName}</option>
                {
                    selectOptions.map((option) => (
                        <option key={option[valueKey]} value={option[valueKey]}>{option[labelKey]} </option>))
                }
            </select>
            <code id={errorId} className="text-red-500 text-xs">{selectError}</code>
        </div>
    );
}
export default SelectInput;