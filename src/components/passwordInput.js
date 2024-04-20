import { useState } from "react";

const PasswordInput = ({ labelName, inputValue, placeholder, inputOnChange,inputOnBlur,inputError, inputName }) => {
    const [passwordVisibility, setPasswordVisibility] = useState(false);
    return (
        <div className="grid">
            <span className="font-medium text-sm pb-1">{labelName}:</span>
           <div className="relative">
           <input type={passwordVisibility?'text':'password'} name={inputName} onBlur={inputOnBlur} onChange={inputOnChange} value={inputValue} className="w-full p-3 text-sm rounded-md border border-[#c4c4c440] bg-[#c4c4c410] placeholder:text-xs placeholder:font-extralight active:outline-0 focus:outline-brand"  placeholder={placeholder} />
            <button  className="absolute inset-y-0 right-0 flex items-center px-4" type="button" onClick={()=>setPasswordVisibility(!passwordVisibility)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path d="M1.18164 12C2.12215 6.87976 6.60812 3 12.0003 3C17.3924 3 21.8784 6.87976 22.8189 12C21.8784 17.1202 17.3924 21 12.0003 21C6.60812 21 2.12215 17.1202 1.18164 12ZM12.0003 17C14.7617 17 17.0003 14.7614 17.0003 12C17.0003 9.23858 14.7617 7 12.0003 7C9.23884 7 7.00026 9.23858 7.00026 12C7.00026 14.7614 9.23884 17 12.0003 17ZM12.0003 15C10.3434 15 9.00026 13.6569 9.00026 12C9.00026 10.3431 10.3434 9 12.0003 9C13.6571 9 15.0003 10.3431 15.0003 12C15.0003 13.6569 13.6571 15 12.0003 15Z" fill="#9381FF"></path></svg>
            </button>
           </div>
            <code className="text-red-500 text-xs">{inputError}</code>
        </div>
    )
}
export default PasswordInput;