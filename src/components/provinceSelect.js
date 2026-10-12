import { useId } from "react";
import { PROVINCE_NAMES } from "../utils/signupValidation";

/**
 * The 13 Canadian provinces and territories as a dropdown, styled like
 * InputWithLabel so it sits in the same row as City and Postal code. A typed
 * province could be anything ("Sindh", "Albrta"); a list cannot.
 */
const ProvinceSelect = ({ labelName = "Province", name = "province", value, onChange, onBlur, error, required = false }) => {
  const id = useId();
  const hasError = Boolean(error);
  return (
    <div className="grid w-full">
      <div className="pb-1 text-sm">
        <label htmlFor={id} className="font-medium">{labelName}:</label>
        {required && <span aria-hidden="true" className="text-red-700"> *</span>}
      </div>
      <select
        id={id}
        name={name}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete="address-level1"
        aria-required={required || undefined}
        aria-invalid={hasError}
        aria-describedby={hasError ? `${id}-error` : undefined}
        className={`w-full p-3 text-sm rounded-md border bg-white text-slate-900 focus:outline-brand ${
          hasError ? "border-red-600 focus:outline-red-600" : "border-slate-400"
        }`}
      >
        <option value="" disabled>Select…</option>
        {PROVINCE_NAMES.map((province) => (
          <option key={province} value={province}>{province}</option>
        ))}
      </select>
      {hasError && <p id={`${id}-error`} role="alert" className="text-red-700 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ProvinceSelect;
