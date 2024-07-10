import { useRef, useState } from "react";

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
}) => {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileSelect = () => {
    const file = fileInputRef.current.files[0];
    setSelectedFile(file);
  };
  return variant === "select" ? (
    <div>
      <div className="grid gap-1 ">
        <span className="font-medium text-sm">{label}</span>
        <select
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full py-[13px] px-3 text-sm  rounded-md border border-[#c4c4c440] bg-[#c4c4c410] active:outline-0 focus:outline-brand "
        >
          <option value="" selected disabled>
            Select an option
          </option>
          {options.map((option, index) => (
            <option key={index}>{option}</option>
          ))}
        </select>
      </div>
      <span className="text-xs">{onError}</span>
    </div>
  ) : 
    variant === "file" ? (
    <div>
      <div className="grid gap-1">
        <span className="font-medium text-sm">{label}</span>
        <input
          ref={fileInputRef}
          type={type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={handleFileSelect}
          onBlur={onBlur}
          className=" hidden"
        />
        <div onClick={() => fileInputRef.current.click()} className="w-full overflow-hidden text-sm">
        {selectedFile ? 
        (<div className="w-full truncate p-4 rounded-md border bg-[#c4c4c410] cursor-pointer">{selectedFile.name}</div>) :
        (<div className="p-3 rounded-md border border-dashed border-brand/50 bg-[#c4c4c410] cursor-pointer">Choose file...</div>)
        }
        </div>
      </div>
      <span className="text-xs">{onError}</span>
    </div>
  ) : (
    <div>
      <div className="grid gap-1">
        <span className="font-medium text-sm">{label}</span>
        <input
          type={type}
          placeholder={placeholder}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand"
        />
      </div>
      <span className="text-xs text-red-500">{onError}</span>
    </div>
  );
};

export default Input;
