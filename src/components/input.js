import { useId, useRef, useState } from "react";

const Input = ({
  label,
  type,
  variant,
  placeholder,
  name,
  value,
  options,
  onChange,
  onError,
  onBlur,
  disabled
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = () => {
    const file = fileInputRef.current.files[0];
    setSelectedFile(file);
    onChange?.({ target: fileInputRef.current });
  };
  return variant === "select" ? (
    <div>
      <div className="grid gap-1 ">
        <label htmlFor={id} className="font-medium text-sm">{label}</label>
        <select
          id={id}
          disabled={disabled}
          aria-invalid={Boolean(onError)}
          aria-describedby={onError ? errorId : undefined}
          placeholder={placeholder}
          name={name}
          value={value}
          defaultValue={value === undefined ? "" : undefined}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full py-[13px] px-3 text-sm  rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-brand/10 "
        >
          <option value="" disabled>
            Select an option
          </option>
          {options.map((option, index) => (
            <option key={index}>{option}</option>
          ))}
        </select>
      </div>
      <span id={errorId} className="text-xs">{onError}</span>
    </div>
  ) : 
    variant === "file" ? (
    <div>
      <div className="grid gap-1">
        <label htmlFor={id} className="font-medium text-sm">{label}</label>
        <input
          id={id}
          aria-invalid={Boolean(onError)}
          aria-describedby={onError ? errorId : undefined}
          ref={fileInputRef}
          type={type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={handleFileSelect}
          onBlur={onBlur}
          className=" hidden"
        />
        <button type="button" disabled={disabled} onClick={() => fileInputRef.current.click()} className="w-full overflow-hidden text-sm text-left">
        {selectedFile ? 
        (<div className="w-full truncate p-4 rounded-md border bg-[#c4c4c410] cursor-pointer">{selectedFile.name}</div>) :
        (<div className="p-3 rounded-md border border-dashed border-brand/50 bg-[#c4c4c410] cursor-pointer">Choose file...</div>)
        }
        </button>
      </div>
      <span id={errorId} className="text-xs">{onError}</span>
    </div>
  ) : (
    <div>
      <div className="grid gap-1">
        <label htmlFor={id} className="font-medium text-sm">{label}</label>
        <input
          id={id}
          aria-invalid={Boolean(onError)}
          aria-describedby={onError ? errorId : undefined}
          type={type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled = {disabled}
          className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand"
        />
      </div>
      <span id={errorId} className="text-xs text-red-500">{onError}</span>
    </div>
  );
};

export default Input;
