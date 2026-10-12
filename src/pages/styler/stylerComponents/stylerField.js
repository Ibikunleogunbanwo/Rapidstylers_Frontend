import { useId } from "react";

/**
 * Labelled input or select for the professional's profile forms. Unlike the
 * shared InputWithLabel it carries `required` (with a visible marker) and
 * `autoComplete`, which these screens need and the shared one does not offer.
 */
const fieldClasses = (error) =>
  `w-full p-3 text-sm rounded-md border bg-white text-slate-900 placeholder:text-xs placeholder:font-extralight focus:outline-brand transition-colors ${
    error ? "border-red-600 focus:outline-red-600" : "border-slate-400"
  }`;

// The marker sits beside the label, not inside it, so the accessible name stays
// "First name:"; `required` on the control is what assistive tech announces.
const Label = ({ id, label, required }) => (
  <div className="flex pb-1 text-sm">
    <label htmlFor={id} className="font-medium">{label}:</label>
    {required && <span aria-hidden="true" className="ml-0.5 text-red-600">*</span>}
  </div>
);

const ErrorText = ({ id, error }) =>
  error ? <p id={`${id}-error`} role="alert" className="text-red-700 text-xs mt-1">{error}</p> : null;

export const StylerField = ({ label, name, value, onChange, onBlur, error, type = "text", placeholder, autoComplete, required, inputMode, maxLength, min, max, step }) => {
  const id = useId();
  return (
    <div className="grid w-full">
      <Label id={id} label={label} required={required} />
      <input
        id={id}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        aria-required={required || undefined}
        inputMode={inputMode}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(error)}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
};

export const StylerSelect = ({ label, name, value, onChange, onBlur, error, options, placeholder, autoComplete, required, hint }) => {
  const id = useId();
  return (
    <div className="grid w-full">
      <Label id={id} label={label} required={required} />
      <select
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        required={required}
        aria-required={required || undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={fieldClasses(error)}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-black/50">{hint}</p>}
      <ErrorText id={id} error={error} />
    </div>
  );
};
